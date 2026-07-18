# AI Stylist System

Deep dive into Almaari’s outfit recommendation pipeline. For a short overview, see the [main README](../README.md#ai-stylist-overview).

Express is the **control plane**: auth, credits, wardrobe ownership, and output validation. Models propose tags or rerank candidates — they never authorize users, invent clothing IDs, or settle billing.

---

## What the user gets

On Generate / Style this item / Try Another, the API returns **three wardrobe-only looks** (typically Safe / Styled / Alternative). Manual outfit building in the UI does **not** trigger inference or spend credits.

Each look is a validated set of clothing `itemId`s that already belong to the authenticated user, plus short explanations when LLM rerank is enabled.

---

## End-to-end pipeline

```
validate request
  → load wardrobe (caller only)
  → filter by constraints
  → generate slot-aware candidates
  → deterministic score
  → optional OpenAI rerank
  → validate IDs / diversity
  → respond (3 looks)
  → (later) 👍/👎 feedback → influence next run
```

| Stage | Behavior |
| ----- | -------- |
| **Validate** | Auth required; optional `anchorItemId`, occasion, weather, style, avoid lists |
| **Retrieve** | Load clothes for `req.auth.sub` only |
| **Candidates** | Slot-aware combos (e.g. top + bottom + shoes, or dress + shoes); anchor included when provided |
| **Layering** | Resolves wear state, openability, belts, and layer roles so looks stay physically plausible |
| **Deterministic scoring** | Colour, occasion, weather, formality, style, and preference weights from prior feedback |
| **Optional LLM rerank** | OpenAI picks among a shortlist and writes brief explanations; IDs must come from that shortlist |
| **Strict validation** | Drop unknown/foreign IDs, duplicates, missing anchors, duplicate outfits |
| **Credits** | One credit reserved for a successful 3-look session; refund on failure |
| **Feedback** | Stored as `StylistFeedback`; applied on the **next** generation |

Generation is always explicit. Rating a card does not regenerate mid-session and does not consume a credit.

---

## Scoring & preferences

### Deterministic score

Candidates are ranked with weighted signals (colour harmony, occasion fit, weather, formality, style). Preference match from prior feedback contributes a bounded bump (`preferenceMatch × 0.12`); cold start uses a neutral `0.5`.

### Feedback loop (👍 / 👎)

```
Rate card → POST /api/ai-stylist/feedback → StylistFeedback
  → next generation → preference profile → preferenceMatch scoring → new looks
```

| Field | Purpose |
| ----- | ------- |
| `recommendationId` | Which card was rated |
| `outfitItemIds` | Clothing IDs in that look (ownership-validated) |
| `outfitSignature` | Sorted ID join — used to avoid repeating an exact combo |
| `rating` | `positive` or `negative` |
| `label` / `occasion` / `style` | Optional context for scoped preferences |

**How the next run uses it**

1. Load recent feedback (scoped to occasion/style when possible).
2. Resolve item IDs → types/colours; build Laplace-smoothed weights in `[-1, 1]`.
3. Fold preference into deterministic scoring.
4. Skip recently downvoted `outfitSignature`s when alternatives exist.
5. If OpenAI rerank is on, pass a short safe summary (e.g. likes navy/jeans; avoids cargos) — never raw private payloads beyond wardrobe metadata already used for candidates.

| User action | Effect on the next session |
| ----------- | -------------------------- |
| 👍 navy jeans + white tee + sneakers | Boosts similar types/colours/item IDs |
| 👎 neon cargos look | Lowers cargos / that item; exact signature avoided when possible |
| No feedback yet | Baseline colour / occasion / weather / style weights |

**Out of scope for this loop:** instant regeneration on rate, cross-user collaborative filtering, or charging credits for thumbs.

---

## Credits & failure modes

- Reserve **one credit** before expensive work for a successful 3-look session.
- Refund on timeout, provider error, or validation failure that yields no usable looks.
- Deduction uses atomic MongoDB updates to limit races under concurrent requests.
- If `OPENAI_API_KEY` is unset or rerank fails, the API **falls back to deterministic rankings** — users still get outfits.

---

## Observability (stylist path)

Correlation via `X-Request-Id` (AsyncLocalStorage + response header). Structured JSON logs include `workflow` (`outfit_recommendation`, `outfit_reranking`), `durationMs`, hashed `userId`, and safe counts — never image payloads, tokens, or full model prompts/responses.

Timed stages include wardrobe load, candidate generation, deterministic scoring, optional OpenAI latency, and totals. Errors are classified (`validation_error`, `insufficient_credits`, `model_timeout`, etc.) with `retryable` hints.

See also [Image Pipeline & S3](./image-pipeline-s3.md#observability) for the shared logging model across AI workflows.

---

## Design principles

- **Business logic outside the model** — Auth, ownership, credits, schema validation, and ID allowlisting live in Express.
- **Wardrobe-grounded outputs** — Every recommended `itemId` is checked against the caller’s closet.
- **Reliability over cleverness** — Refundable credits, deterministic fallbacks, validated payloads.
- **Extensibility** — Scoring weights, preference profiles, and optional LLM rerank can change without rewriting CRUD, auth, or billing.

---

## Related docs

- [AI styling metadata contract](./ai-styling-metadata-contract.md) — FastAPI tag / enrichment fields used when items enter the wardrobe
- [Image Pipeline & S3](./image-pipeline-s3.md) — How garments are cropped and analyzed before they appear in stylist candidates
- [Main README](../README.md)
