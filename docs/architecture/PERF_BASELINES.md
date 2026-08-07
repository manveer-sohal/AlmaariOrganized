# Performance baselines (latency)

Use these greppable markers when comparing speed before/after a change.

## How to capture

1. Run the app (`docker compose up` or local FE/API).
2. Exercise the flow once (warm services first — cold rembg/analyze skews numbers).
3. Search logs / browser console for: `PERF_BASELINE`
4. Optionally also search JSON: `"event":"perf.baseline"`

Frontend baselines are on when `NEXT_PUBLIC_AI_ANALYZE_TIMING=true` or `NODE_ENV=development`.

## Workflow names

| Workflow | Where | Meaning |
|----------|--------|---------|
| `outfit_recommendation` | API | Server stylist total |
| `outfit_recommendation_client` | Browser | Client round-trip (includes network) |
| `image_crop_processing` | API | Server rembg/crop hop |
| `image_crop_processing_client` | Browser | Client crop fetch |
| `clothing_metadata_generation` | API | Server analyze total |
| `clothing_metadata_generation_client` | Browser | Analyze click → response |
| `clothing_upload_persist` | API | Mongo upload persist |
| `clothing_upload_persist_client` | Browser | Upload fetch |
| `add_clothes_pipeline` | Browser | **Sum** of rembg + analyze + upload stages (excludes user idle time between steps) |

## Reference run (2026-08-07, staging crop/AI, local API)

Captured from a warm docker session:

| Workflow | totalMs | Notes |
|----------|---------|--------|
| `outfit_recommendation` | **~478** | 10 wardrobe items, random mode, no OpenAI rerank |
| `image_crop_processing` | **~518–664** | rembg_only |
| `clothing_metadata_generation` | **~5213** | FastAPI ~4908 ms of that |
| `clothing_upload_persist` | **~1081** | `imageAlreadyCropped=true` |
| `add_clothes_pipeline` (approx sum) | **~6.7–7.0 s** | rembg + analyze + upload |

Update this table when you land a meaningful latency win (keep date + environment notes).

## Comparing a change

1. Record baseline `totalMs` for the workflow you touched.
2. Make the change; re-run the **same** flow (same wardrobe size / warm services when possible).
3. Diff the new `PERF_BASELINE` line against the table above (or against the previous commit’s note).
4. Prefer server workflows for backend work; prefer `*_client` / `add_clothes_pipeline` for UX-facing claims.
