/**
 * Direct-to-S3 clothing upload: init (presign) + complete (HEAD verify + queue crop).
 */

import crypto from "crypto";
import { User, Clothes } from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import { mapTypeToSlot } from "../utils/slot.utils.js";
import {
  getImageStorageAdapter,
  isObjectStorageEnabled,
  hashBuffer,
} from "./imageStorage.service.js";
import { buildClothingObjectKey } from "../utils/objectKeyFactory.js";
import {
  beginIdempotentOperation,
  completeIdempotentOperation,
  fingerprintImageBuffer,
} from "./idempotency.service.js";
import { scheduleImagePipeline } from "./imageProcessingJob.service.js";
import { defaultStylingMetadata } from "../utils/normalizeClothingAnalysisResponse.js";
import { PROCESSING_IMAGE_PLACEHOLDER } from "../constants/imageProcessing.js";
import { logInfo, logWarn, hashUserId } from "../observability/logger.js";
import { withResolvedImageFields } from "../utils/resolveClothingImage.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const extForMime = (mime) => {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
};

/**
 * Create a pending clothing shell + presigned PUT for the source object.
 */
export const initDirectUpload = async ({
  auth0Id,
  contentType,
  contentLength,
  checksum,
  idempotencyKey,
  clientCropVerified = true,
  type = "T-shirt",
  colour = ["Black"],
  material = "Cotton",
  fit = "Regular",
  pattern = "Solid",
}) => {
  if (!isObjectStorageEnabled()) {
    throw {
      status: 400,
      code: "OBJECT_STORAGE_DISABLED",
      message: "Direct uploads require IMAGE_STORAGE_PROVIDER=s3",
    };
  }

  if (!ALLOWED_MIME.has(String(contentType || "").toLowerCase())) {
    throw { status: 400, code: "INVALID_MIME", message: "Unsupported image type" };
  }

  const storage = await getImageStorageAdapter();
  const maxBytes = storage.maxUploadBytes || 5_242_880;
  if (!contentLength || contentLength < 32 || contentLength > maxBytes) {
    throw {
      status: 400,
      code: "INVALID_SIZE",
      message: `File size must be between 32 and ${maxBytes} bytes`,
    };
  }

  await connectMongoDB();
  const user = await User.findOne({ auth0Id });
  if (!user) throw { status: 404, message: "User Not Found" };

  let idempotency = null;
  if (idempotencyKey) {
    const fingerprint = fingerprintImageBuffer(
      Buffer.from(`${checksum || ""}:${contentLength}:${contentType}`),
      { op: "clothing_upload_init" },
    );
    idempotency = await beginIdempotentOperation({
      auth0Id,
      operationType: "clothing_upload",
      idempotencyKey,
      requestFingerprint: fingerprint,
    });
    if (idempotency.kind === "replay") {
      return {
        status: 200,
        ...idempotency.body,
        replayed: true,
      };
    }
    if (
      idempotency.kind === "conflict" ||
      idempotency.kind === "in_progress"
    ) {
      throw {
        status: idempotency.statusCode || 409,
        message: idempotency.body?.message || "Idempotency conflict",
        code: idempotency.kind,
      };
    }
  }

  const clothingId = new (await import("mongoose")).default.Types.ObjectId();
  const contentHash =
    (checksum && String(checksum).replace(/[^a-f0-9]/gi, "").slice(0, 64)) ||
    crypto.randomBytes(16).toString("hex");
  const sourceKey = buildClothingObjectKey({
    userId: String(user._id),
    clothingId: String(clothingId),
    variant: "source",
    contentHash,
    ext: extForMime(contentType),
  });

  const { uploadUrl, expiresAt } = await storage.createUploadUrl({
    key: sourceKey,
    contentType,
    contentLength,
  });

  const clothing = await Clothes.create({
    _id: clothingId,
    userId: user._id,
    uniqueId: crypto.randomBytes(12).toString("hex"),
    type,
    imageSrc: PROCESSING_IMAGE_PLACEHOLDER,
    favourite: false,
    colour: Array.isArray(colour) ? colour : [colour],
    season: [],
    waterproof: false,
    slot: mapTypeToSlot(type),
    material,
    fit,
    pattern,
    stylingMetadata: defaultStylingMetadata(),
    imageStorage: {
      provider: "s3",
      status: "upload_pending",
      clientCropVerified: Boolean(clientCropVerified),
      cropMode: clientCropVerified ? "client_framed_rembg" : null,
      source: {
        key: sourceKey,
        contentType,
        bytes: contentLength,
        checksum: contentHash,
      },
      uploadedAt: null,
    },
  });

  user.clothes.push(clothing._id);
  await user.save();

  const body = {
    operationId: String(clothing._id),
    clothingId: String(clothing._id),
    uploadUrl,
    expiresAt,
    // objectKey omitted from browser-critical response surface when possible;
    // included for debugging/retry with same key — not a secret.
    objectKey: sourceKey,
    maxBytes,
    contentType,
  };

  if (idempotency?.kind === "execute" && idempotency.record?._id) {
    await completeIdempotentOperation(idempotency.record._id, {
      resultPayload: body,
      clothingId: clothing._id,
    });
  }

  logInfo("clothing_upload_init", {
    userIdHash: hashUserId(auth0Id),
    clothingId: String(clothing._id),
    contentType,
    contentLength,
    clientCropVerified: Boolean(clientCropVerified),
  });

  return { status: 200, ...body };
};

/**
 * Verify S3 source via HEAD, mark crop_pending, enqueue processing job.
 */
export const completeDirectUpload = async ({
  auth0Id,
  clothingId,
  idempotencyKey,
  metadata = {},
}) => {
  if (!isObjectStorageEnabled()) {
    throw {
      status: 400,
      code: "OBJECT_STORAGE_DISABLED",
      message: "Direct uploads require IMAGE_STORAGE_PROVIDER=s3",
    };
  }

  await connectMongoDB();
  const user = await User.findOne({ auth0Id });
  if (!user) throw { status: 404, message: "User Not Found" };

  const clothing = await Clothes.findOne({
    _id: clothingId,
    userId: user._id,
  });
  if (!clothing) throw { status: 404, message: "Clothing not found" };

  // Idempotent complete: already past upload
  if (
    clothing.imageStorage?.status === "ready" ||
    clothing.imageStorage?.status === "crop_pending" ||
    clothing.imageStorage?.status === "cropping" ||
    clothing.imageStorage?.status === "cropped" ||
    clothing.imageStorage?.status === "analyzing"
  ) {
    return {
      status: 200,
      message: "Upload already completed",
      clothing: withResolvedImageFields(clothing.toObject()),
      processingStatus: clothing.imageStorage.status,
      replayed: true,
    };
  }

  const sourceKey = clothing.imageStorage?.source?.key;
  if (!sourceKey) {
    throw { status: 400, message: "Missing source object key" };
  }

  const storage = await getImageStorageAdapter();
  const head = await storage.headObject(sourceKey);
  if (!head) {
    throw {
      status: 409,
      code: "OBJECT_MISSING",
      message: "Uploaded object not found — retry PUT then complete",
    };
  }

  const expectedBytes = clothing.imageStorage?.source?.bytes;
  if (
    expectedBytes != null &&
    head.contentLength != null &&
    Math.abs(head.contentLength - expectedBytes) > 1024
  ) {
    logWarn("clothing_upload_complete_size_mismatch", {
      userIdHash: hashUserId(auth0Id),
      clothingId: String(clothing._id),
      expectedBytes,
      actualBytes: head.contentLength,
    });
  }

  if (
    head.contentType &&
    !ALLOWED_MIME.has(String(head.contentType).toLowerCase().split(";")[0])
  ) {
    throw { status: 400, code: "INVALID_MIME", message: "Object content type rejected" };
  }

  const maxBytes = storage.maxUploadBytes || 5_242_880;
  if (head.contentLength != null && head.contentLength > maxBytes) {
    throw { status: 400, code: "INVALID_SIZE", message: "Object exceeds max size" };
  }

  // Apply optional form metadata from complete call
  if (metadata.type) {
    clothing.type = metadata.type;
    clothing.slot = mapTypeToSlot(metadata.type);
  }
  if (Array.isArray(metadata.colour)) clothing.colour = metadata.colour;
  if (metadata.material) clothing.material = metadata.material;
  if (metadata.fit) clothing.fit = metadata.fit;
  if (metadata.pattern) clothing.pattern = metadata.pattern;

  clothing.imageStorage = {
    ...(clothing.imageStorage?.toObject?.() || clothing.imageStorage || {}),
    provider: "s3",
    status: "crop_pending",
    uploadedAt: new Date(),
    source: {
      ...(clothing.imageStorage?.source || {}),
      key: sourceKey,
      contentType: head.contentType || clothing.imageStorage?.source?.contentType,
      bytes: head.contentLength ?? clothing.imageStorage?.source?.bytes,
    },
  };
  await clothing.save();

  scheduleImagePipeline(clothing._id, {
    auth0Id,
    clientCropVerified: Boolean(clothing.imageStorage.clientCropVerified),
    runAiAnalysis: false,
    idempotencyKey: idempotencyKey || null,
  });

  logInfo("clothing_upload_completed", {
    userIdHash: hashUserId(auth0Id),
    clothingId: String(clothing._id),
    processingStatus: "crop_pending",
    bytes: head.contentLength,
  });

  return {
    status: 200,
    message: "Upload verified — processing crop pipeline",
    clothing: withResolvedImageFields(clothing.toObject()),
    processingStatus: "crop_pending",
  };
};
