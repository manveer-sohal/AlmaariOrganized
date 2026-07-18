# Image Pipeline & S3

Deep dive into garment upload, normalization, AI analysis, and object storage. For a short overview, see the [main README](../README.md#image-processing--s3-overview).

---

## Goals

1. Present every garment as a consistent, transparent catalog image.
2. Optionally extract structured metadata with a metered AI call.
3. Keep CPU-heavy vision work off the Express process so wardrobe CRUD and billing stay responsive.
4. Route large binaries through object storage (S3) instead of the API when possible.

---

## Service boundaries

| Component               | Responsibility                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**             | Upload UI, client-side prep, Auth0 session                                                                                              |
| **Express**             | JWT auth, rate limits, MIME/size validation, credit reserve/refund, tag sanitization, MongoDB writes, Redis invalidation, orchestration |
| **Python crop service** | Background removal and normalization → transparent PNG                                                                                  |
| **FastAPI AI service**  | Vision inference → clothing tags + confidence scores                                                                                    |
| **AWS S3**              | Object storage for large uploads via presigned URLs                                                                                     |

Inference and crop scale independently of the core API on Cloud Run.

---

## Image processing pipeline

```
Upload → validate → crop service → (optional) FastAPI analyze → sanitize tags → persist
```

### Step by step

1. **Ingest** — Authenticated upload with size/MIME checks in Express. The client may crop first (`imageAlreadyCropped`), or Express forwards the image to the crop service during upload.
2. **Normalize** — Crop runs in a separate process. Express awaits the HTTP result but does not run CPU-heavy CV in-process.
3. **Analyze (optional, credit-metered)** — `POST /api/ai/analyze-clothing` deducts one credit **before** calling FastAPI. Tags include type, colours, material, fit, pattern, plus rich styling fields when the service supports them.
4. **Safeguards** — Express sanitizes tags. Empty / low-confidence results refund the reserved credit. Failures refund and return an error without charging for unusable output.
5. **Persist** — Wardrobe documents land in MongoDB; wardrobe/outfit Redis keys are invalidated on write.

Crop and analyze are **discrete** endpoints. Service warmups can hit FastAPI and crop concurrently (`Promise.allSettled`) without coupling readiness of one to the other.

### Analyze request lifecycle

Primary path: `POST /api/ai/analyze-clothing` (Auth0 JWT required).

1. **Receive** — Behind AI rate limiters; resolve or generate `X-Request-Id`.
2. **Validate** — Require `req.auth.sub` and image body. Invalid auth → `401`; missing image → `400`.
3. **Credit reserve** — `deductOneCredit` before FastAPI. Insufficient balance → `402`.
4. **Forward** — POST to `AI_CLOTHING_SERVICE_URL/analyze-clothing`, forwarding the request id.
5. **Infer** — FastAPI returns tag payloads with confidence scores.
6. **Validate response** — Sanitize tags. If `validTagCount < 1`, refund and return `creditsDeducted: 0`.
7. **Respond** — Tags, counts, credit balance. Persisting tags onto a clothing document is a separate upload/update step.

How often FastAPI is called per add-clothing flow (analyze vs background enrichment) is specified in the [AI styling metadata contract](./ai-styling-metadata-contract.md).

---

## AWS S3 upload design

Large files should not stream through the Express heap. The intended path uses **presigned URLs**:

```
Frontend → POST (request upload URL) → Express
Express  → generate S3 presigned PUT URL (short TTL)
Frontend → PUT bytes directly to S3
Express  → store object key / URL reference on the clothing document
```

```json
{
  "user_id": "123",
  "s3_key": "user_123/shirt_blue.png",
  "category": null,
  "cropped": false
}
```

Secure image upload flow using AWS S3 presigned URLs

**Why this matters**

- API memory and bandwidth stay bounded under concurrent uploads
- S3 handles durability and throughput; Express stays the control plane for auth and metadata
- Crop / analyze can later fetch from the object key instead of receiving huge base64 bodies

---

## Observability

Shared across analyze, crop, and stylist workflows (`backend/observability/*`).

### Correlation IDs

- Accept incoming `X-Request-Id`, otherwise generate a UUID
- Store in AsyncLocalStorage; echo on the response (`CORS` `exposedHeaders`)
- Forward on outbound calls to FastAPI and the crop service

### Structured JSON logs

Typical fields: `timestamp`, `level`, `event`, `service`, `requestId`, `workflow`, `route`, `method`, `durationMs`, `classification`, `retryable`, `status`, `userIdHash` (SHA-256 prefix — never raw Auth0 ids), safe counts (`validTagCount`, `imageKb`).

```json
{
  "timestamp": "2026-07-11T22:00:00.000Z",
  "level": "info",
  "event": "ai.inference.completed",
  "service": "almaari-api",
  "requestId": "a1b2c3d4-...",
  "workflow": "clothing_metadata_generation",
  "durationMs": 842,
  "validTagCount": 5,
  "success": true
}
```

**Never logged:** image/base64 payloads, Authorization headers, tokens, secrets, full prompts, full model responses, payment data.

### Timed stages

| Workflow                       | Stages                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `clothing_metadata_generation` | validation, credit reserve, image prep, FastAPI round-trip, tag sanitize, refunds, totals |
| `image_crop_processing`        | crop downstream call + total                                                              |
| `outfit_recommendation`        | wardrobe load, candidates, scoring, optional OpenAI rerank, total                         |

**Error classes:** `validation_error`, `authentication_error`, `insufficient_credits`, `rate_limit_error`, `model_timeout`, `model_provider_error`, `invalid_model_output`, `downstream_service_error`, `image_processing_error`, `database_error`, `unknown_error` — with `retryable` hints.

**Ops endpoints:** `/health` (liveness), `/ready` (MongoDB + config; Redis optional), `/metrics/ai` (in-process counters).

---

## Reliability choices

- **Fault isolation** — Crop or vision failures stay in their services; Express maps them to HTTP errors and credit refunds.
- **Independent scale** — CV and inference containers scale separately from CRUD/billing.
- **Credit integrity** — Reserve before inference; refund on failure or unusable tags; atomic MongoDB updates.
- **Rate limiting** — Per-route caps on AI and upload paths protect upstream services.
- **Graceful degradation** — Cache outages fall back to MongoDB; analyze failures do not take down wardrobe reads.

---

## Related docs

- [AI Stylist System](./ai-stylist.md) — How tagged wardrobe items become outfit recommendations
- [AI styling metadata contract](./ai-styling-metadata-contract.md) — Exact FastAPI response shape and enrichment status
- [Main README](../README.md)
