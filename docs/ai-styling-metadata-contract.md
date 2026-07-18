# AI styling metadata contract (FastAPI)

This document describes the Node ↔ FastAPI clothing-analysis contract for Almaari Organizer.

The FastAPI service lives in a **separate repository**. This repo consumes its HTTP response and must stay backward compatible while that service is updated.

## Analysis call frequency (Node)

Exact flow:

1. **Optional pre-upload analyze** (`POST /api/ai/analyze-clothing`): one FastAPI call. Tags (core + rich when available) are returned to the client.
2. **Create clothing** (`POST /api/clothes/upload`):
   - If the client sends `analysisSnapshot` from step 1, Node **reuses that snapshot** and does **not** call FastAPI again.
   - If there is no snapshot (user skipped analyze), Node schedules **one** background FastAPI call for styling enrichment.
3. **Authenticated retry** (`POST /api/clothes/:id/style-enrichment/retry`): may call FastAPI again for failed/stale jobs only.

So FastAPI is called **at most once per add-clothing flow** (either analyze or post-create enrichment, not both).

Legacy snapshots without rich fields leave `enrichmentStatus: pending` after the snapshot is applied. Node then **schedules one background enrichment job** so items are not stuck forever. Opening clothing details also triggers an authenticated ensure/retry for `pending` or `failed` items.

If a background enrichment call still returns a legacy (non-rich) response, status becomes `failed` with a safe message so the UI does not show “Analyzing…” indefinitely. Use the retry endpoint after the FastAPI service is upgraded.

## Status model

`stylingMetadata.enrichmentStatus`: `pending` | `processing` | `completed` | `failed`

- `completed` only when at least one rich field is present (`styleCategory`, `occasionTags`, `formalityScore`, `statementLevel`, `outfitRole`).
- Legacy responses keep `pending`.
- `processingStartedAt` supports stale-job detection (default 5 minutes).
- Field sources: `styleCategorySource` / `occasionTagsSource` = `ai` | `user` | null.
- `userReviewedAt` remains an audit timestamp when the user edits style fields.

## Formality vs user styleCategory

When the user sets `styleCategory`, Node **clamps** `formalityScore` into a category band (Casual/Athletic 1–4, Smart Casual 4–7, Formal 7–10). The AI Stylist uses `effectiveFormalityScore`, which applies the same rule for user-sourced categories.



```json
{
  "type": { "value": "Tie", "confidence": 0.98 },
  "colour": { "value": ["Red"], "confidence": 0.91 },
  "material": { "value": "Silk", "confidence": 0.72 },
  "fit": { "value": null, "confidence": 0.25 },
  "pattern": { "value": "Solid", "confidence": 0.94 }
}
```

Node continues to accept this shape. Missing rich styling fields are stored as `null` / `[]`.

## New response contract

Each field is `{ "value": <T|null>, "confidence": <0.0-1.0> }`.

```json
{
  "type": { "value": "Tie", "confidence": 0.98 },
  "colour": { "value": ["Red"], "confidence": 0.91 },
  "material": { "value": "Silk", "confidence": 0.72 },
  "fit": { "value": null, "confidence": 0.25 },
  "pattern": { "value": "Solid", "confidence": 0.94 },
  "styleCategory": { "value": "Formal", "confidence": 0.9 },
  "occasionTags": { "value": ["Work", "Formal Event"], "confidence": 0.82 },
  "formalityScore": { "value": 9, "confidence": 0.88 },
  "statementLevel": { "value": 2, "confidence": 0.78 },
  "outfitRole": { "value": "Accent", "confidence": 0.81 },
  "subtype": { "value": "button_up", "confidence": 0.86 }
}
```

Optional `subtype` is a snake_case garment subtype (e.g. `button_up`, `polo`, `jorts`, `denim_jacket`). It does not replace broad `type`. Low-confidence or missing subtype stays `null`; Node falls back to deterministic normalization from type/name/tags.

## Allowed enums

| Field | Values |
|---|---|
| `styleCategory` | `Casual`, `Smart Casual`, `Formal`, `Athletic` |
| `occasionTags` | `Everyday`, `Work`, `Going Out`, `Event`, `Formal Event`, `Travel`, `Active` |
| `outfitRole` | `Base`, `Layer`, `Accent`, `Statement` |
| `fit` | `Slim`, `Regular`, `Relaxed`, `Oversized` (plus app-local `Baggy` if ever returned) |
| `pattern` | `Solid`, `Striped`, `Graphic`, `Plaid`, `Floral`, `Checked`, `Polka Dot`, `Camo` |
| `colour` | `Black`, `White`, `Grey`, `Blue`, `Navy`, `Brown`, `Beige`, `Cream`, `Green`, `Olive`, `Red`, `Pink`, `Purple`, `Yellow`, `Orange` |

## Null behavior

- Prefer `null` (or `[]` for `occasionTags` / colours) over unsupported guesses.
- Uncertain `material` / `fit` should be `null`.
- Node never invents fallback values for low-confidence fields.
- Invalid enums are normalized to `null` / ignored; clothing creation does not fail.

## Confidence behavior

- Number from `0.0` to `1.0`.
- Node clamps out-of-range values into `[0, 1]` for storage.
- `formalityScore` must be an integer `1–10` or `null`.
- `statementLevel` must be an integer `1–5` or `null`.

## Backward compatibility

- Legacy responses without styling keys remain valid.
- Enrichment runs asynchronously after clothing create; missing rich fields do not block upload.
- Interactive analyze (`POST /api/ai/analyze-clothing`) also accepts the enriched shape and returns optional styling tags to the client.

## Recommended FastAPI system prompt

```
Classify ONE main clothing item in the image and return ONLY valid JSON.

Return these keys:

type
colour
material
fit
pattern
styleCategory
occasionTags
formalityScore
statementLevel
outfitRole
subtype (optional)

Each field must have:

{
  "value": <value or null>,
  "confidence": <number from 0.0 to 1.0>
}

Focus on the most central and prominent garment only.

Ignore:

- Background objects
- Walls and floors
- Skin and hair
- Hangers
- Other garments that are not the primary subject
- Lighting colour casts where possible

Core field rules:

type:
Use a common, specific garment name such as:
T-shirt, Oxford Shirt, Dress Shirt, Hoodie, Sweater, Jeans, Chinos, Trousers, Jacket, Blazer, Coat, Dress, Skirt, Sneakers, Boots, Tie.

colour:
Return an array containing the dominant garment colour first, followed by meaningful secondary colours.

Allowed colours:
Black, White, Grey, Blue, Navy, Brown, Beige, Cream, Green, Olive, Red, Pink, Purple, Yellow, Orange.

material:
Only identify material when visible texture strongly supports it.
Examples:
Cotton, Polyester, Wool, Silk, Denim, Leather, Knit, Fleece, Linen.
Return null instead of making a weak guess.

fit:
Allowed values:
Slim, Regular, Relaxed, Oversized.
Return null if fit cannot be confidently determined from the image.

pattern:
Allowed values:
Solid, Striped, Graphic, Plaid, Floral, Checked, Polka Dot, Camo.

styleCategory:
Choose one:
Casual, Smart Casual, Formal, Athletic.

occasionTags:
Return zero or more of:
Everyday, Work, Going Out, Event, Formal Event, Travel, Active.

formalityScore:
Integer from 1 to 10.

1 means extremely casual.
5 means smart casual.
10 means highly formal.

statementLevel:
Integer from 1 to 5.

1 means basic or neutral.
3 means noticeable.
5 means bold or highly attention-grabbing.

outfitRole:
Choose one:
Base, Layer, Accent, Statement.

subtype (optional):
Prefer a precise snake_case value when confident, e.g.:
t_shirt, polo, button_up, dress_shirt, sweater, hoodie, jacket, denim_jacket, blazer, coat, jeans, jorts, chinos, shorts.
Do not infer button_up from the bare word "Shirt" alone.
If unsure, return null.

Use semantic fashion reasoning, but prefer null or an empty array over unsupported guesses.

Do not return markdown.
Do not return explanations.
Return JSON only.
```

## Node adapter

Parsing is centralized in:

`backend/utils/normalizeClothingAnalysisResponse.js`

Use `normalizeClothingAnalysisResponse(rawResponse)` instead of ad-hoc parsing in routes.
