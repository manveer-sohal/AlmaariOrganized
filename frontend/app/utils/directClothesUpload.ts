/**
 * Direct-to-S3 clothing upload (when IMAGE_STORAGE_PROVIDER=s3 on API).
 * Falls back to legacy multipart when object storage is disabled.
 */

import { clearAuthTokenCache, getAuthHeaders } from "./getAuthHeaders";
import { createIdempotencyKey } from "./idempotencyKey";
import { logPerfBaseline } from "./workflowTiming";

export type DirectUploadResult = {
  mode: "s3" | "legacy";
  clothingId?: string;
  processingStatus?: string;
  response: Response;
};

const putToPresignedUrl = async (
  uploadUrl: string,
  blob: Blob,
  contentType: string,
) => {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed (${res.status})`);
  }
};

/**
 * Prefer S3 direct upload when enabled; otherwise caller should use multipart.
 */
export const tryDirectClothesUpload = async ({
  blob,
  contentType = "image/png",
  idempotencyKey,
  metadata,
  clientCropVerified = true,
  traceId,
}: {
  blob: Blob;
  contentType?: string;
  idempotencyKey?: string;
  metadata: {
    type: string;
    colour: string[];
    material: string;
    fit: string;
    pattern: string;
  };
  clientCropVerified?: boolean;
  traceId?: string;
}): Promise<DirectUploadResult | null> => {
  const key = idempotencyKey || createIdempotencyKey("upload");
  const start = performance.now();

  const initHeaders = await getAuthHeaders({
    "Content-Type": "application/json",
    "Idempotency-Key": key,
    ...(traceId ? { "X-Request-Id": traceId } : {}),
  });

  let initRes = await fetch("/api/clothes/upload/init", {
    method: "POST",
    headers: initHeaders,
    body: JSON.stringify({
      contentType,
      contentLength: blob.size,
      clientCropVerified,
      ...metadata,
    }),
  });
  if (initRes.status === 401) {
    clearAuthTokenCache();
    initRes = await fetch("/api/clothes/upload/init", {
      method: "POST",
      headers: await getAuthHeaders({
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      }),
      body: JSON.stringify({
        contentType,
        contentLength: blob.size,
        clientCropVerified,
        ...metadata,
      }),
    });
  }

  if (initRes.status === 400) {
    const body = await initRes.json().catch(() => ({}));
    if (body?.code === "OBJECT_STORAGE_DISABLED") {
      return null; // caller uses legacy multipart
    }
  }

  if (!initRes.ok) {
    throw new Error("Failed to initialize direct upload");
  }

  const init = await initRes.json();
  await putToPresignedUrl(init.uploadUrl, blob, contentType);

  const completeRes = await fetch("/api/clothes/upload/complete", {
    method: "POST",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
      "Idempotency-Key": key,
      ...(traceId ? { "X-Request-Id": traceId } : {}),
    }),
    body: JSON.stringify({
      clothingId: init.clothingId || init.operationId,
      ...metadata,
    }),
  });

  logPerfBaseline({
    workflow: "clothing_direct_upload_client",
    totalMs: performance.now() - start,
    stages: { clientTotalMs: performance.now() - start },
    traceId,
    meta: { processingStatus: "crop_pending" },
  });

  return {
    mode: "s3",
    clothingId: init.clothingId || init.operationId,
    processingStatus: "crop_pending",
    response: completeRes,
  };
};
