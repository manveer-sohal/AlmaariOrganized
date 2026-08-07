import { removeData as removeDataService } from "../services/clothes.service.js";
import { uploadData as uploadDataService } from "../services/clothes.service.js";
import { deleteOutfit as deleteOutfitService } from "../services/clothes.service.js";
import { getOutfits as getOutfitsService } from "../services/clothes.service.js";
import { getData as getDataService } from "../services/clothes.service.js";
import { createOutfit as createOutfitService } from "../services/clothes.service.js";
import { updateClothing as updateClothingService } from "../services/clothes.service.js";
import { replaceClothingImage as replaceClothingImageService } from "../services/clothes.service.js";
import {
  seedSampleWardrobe as seedSampleWardrobeService,
  clearSampleWardrobe as clearSampleWardrobeService,
} from "../services/clothes.service.js";
import { retryStyleEnrichmentForUser } from "../services/stylingEnrichment.service.js";
import { validateClothingUpdatePayload } from "../utils/clothingValidation.utils.js";
import { cropImage, toBase64 } from "../services/image.service.js";
import {
  initDirectUpload,
  completeDirectUpload,
} from "../services/directUpload.service.js";

import dotenv from "dotenv";
import { parseStringField } from "../utils/parseClothesFields.js";
dotenv.config();

export const initClothesUpload = async (request, response) => {
  const auth0Id = request.auth?.sub;
  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  try {
    const result = await initDirectUpload({
      auth0Id,
      contentType: request.body?.contentType,
      contentLength: Number(request.body?.contentLength),
      checksum: request.body?.checksum,
      idempotencyKey:
        request.get("Idempotency-Key") || request.body?.idempotencyKey,
      clientCropVerified: request.body?.clientCropVerified !== false,
      type: request.body?.type || "T-shirt",
      colour: request.body?.colour || ["Black"],
      material: request.body?.material || "Cotton",
      fit: request.body?.fit || "Regular",
      pattern: request.body?.pattern || "Solid",
    });
    return response.status(result.status || 200).json(result);
  } catch (e) {
    return response.status(e.status || 500).json({
      error: e.message || e.error || "Upload init failed",
      code: e.code,
    });
  }
};

export const completeClothesUpload = async (request, response) => {
  const auth0Id = request.auth?.sub;
  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  try {
    const clothingId =
      request.body?.clothingId || request.body?.operationId;
    const result = await completeDirectUpload({
      auth0Id,
      clothingId,
      idempotencyKey:
        request.get("Idempotency-Key") || request.body?.idempotencyKey,
      metadata: {
        type: request.body?.type,
        colour: request.body?.colour,
        material: request.body?.material,
        fit: request.body?.fit,
        pattern: request.body?.pattern,
      },
    });
    return response.status(result.status || 200).json(result);
  } catch (e) {
    return response.status(e.status || 500).json({
      error: e.message || e.error || "Upload complete failed",
      code: e.code,
    });
  }
};

export const removeData = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const { uniqueId, clothingId } = request.body;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await removeDataService({ auth0Id, uniqueId, clothingId });
    return response
      .status(200)
      .json({ message: result.message, Clothes: result.Clothes });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to remove clothing item",
      details: e.details || null,
    });
  }
};

export const getOutfits = async (request, response) => {
  const auth0Id = request.auth?.sub;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await getOutfitsService({ auth0Id });
    return response.status(result.status || 200).json(result.outfits);
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to fetch user data",
      details: e.details || null,
    });
  }
};

export const getData = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const { numberOfClothes = 40, page = 1 } = request.body;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await getDataService({ auth0Id, numberOfClothes, page });
    return response
      .status(result.status || 200)
      .json({ Clothes: result.clothes });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.error || "Failed to fetch user data",
    });
  }
};

export const createOutfit = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const { name, colour, season, waterproof, outfit_items } = request.body;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await createOutfitService({
      auth0Id,
      name,
      colour,
      season,
      waterproof,
      outfit_items,
    });

    return response
      .status(result.status || 200)
      .json({ message: result.message, outfit: result.outfit });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to create outfit",
      details: e.details || null,
    });
  }
};

export const deleteOutfit = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const { uniqueId } = request.body;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await deleteOutfitService({ auth0Id, uniqueId });
    return response
      .status(result.status || 200)
      .json({ message: result.message, outfit: result.outfit });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to delete outfit",
      details: e.details,
    });
  }
};

export const uploadData = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const {
    type,
    colour,
    season,
    waterproof,
    favourite,
    material,
    fit,
    pattern,
    imageAlreadyCropped,
    styleCategory,
    occasionTags,
    analysisSnapshot,
  } = request.body;

  const file = request.file;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  if (!file) {
    return response.status(400).json({ error: "No file uploaded" });
  }

  const {
    beginIdempotentOperation,
    completeIdempotentOperation,
    failIdempotentOperation,
    fingerprintImageBuffer,
    validateIdempotencyKey,
  } = await import("../services/idempotency.service.js");

  const rawKey =
    request.get("Idempotency-Key") || request.body?.idempotencyKey || null;
  let idempotency = null;

  if (rawKey) {
    const keyCheck = validateIdempotencyKey(rawKey);
    if (!keyCheck.ok) {
      return response
        .status(400)
        .json({ error: `Invalid Idempotency-Key (${keyCheck.reason})` });
    }
    const fingerprint = fingerprintImageBuffer(file.buffer, {
      type,
      colour,
      material,
      fit,
      pattern,
      op: "clothing_upload",
    });
    idempotency = await beginIdempotentOperation({
      auth0Id,
      operationType: "clothing_upload",
      idempotencyKey: keyCheck.value,
      requestFingerprint: fingerprint,
    });
    if (idempotency.kind === "replay" || idempotency.kind === "conflict" || idempotency.kind === "in_progress") {
      return response.status(idempotency.statusCode).json(idempotency.body);
    }
  }

  try {
    const parseColour = (() => {
      try {
        return JSON.parse(colour || "[]");
      } catch (_) {
        return Array.isArray(colour) ? colour : [];
      }
    })();

    const parseSeason = (() => {
      try {
        return JSON.parse(season || "[]");
      } catch (_) {
        return Array.isArray(season) ? season : [];
      }
    })();
    const parseMaterial = parseStringField(material);
    const parseFit = parseStringField(fit);
    const parsePattern = parseStringField(pattern);
    const alreadyCropped =
      imageAlreadyCropped === true || String(imageAlreadyCropped) === "true";

    const parseOccasionTags = (() => {
      if (occasionTags == null || occasionTags === "") return undefined;
      try {
        return JSON.parse(occasionTags);
      } catch (_) {
        return Array.isArray(occasionTags) ? occasionTags : undefined;
      }
    })();

    const parseAnalysisSnapshot = (() => {
      if (analysisSnapshot == null || analysisSnapshot === "") return undefined;
      if (typeof analysisSnapshot === "object") return analysisSnapshot;
      try {
        return JSON.parse(analysisSnapshot);
      } catch (_) {
        return undefined;
      }
    })();

    const result = await uploadDataService({
      auth0Id,
      type,
      colour: parseColour,
      season: parseSeason,
      waterproof,
      favourite,
      file,
      material: parseMaterial,
      fit: parseFit,
      pattern: parsePattern,
      imageAlreadyCropped: alreadyCropped,
      styleCategory:
        styleCategory != null && styleCategory !== ""
          ? parseStringField(styleCategory)
          : undefined,
      occasionTags: parseOccasionTags,
      analysisSnapshot: parseAnalysisSnapshot,
    });

    const body = {
      message: result.message,
      clothing: result.clothing,
      timing: result.timing,
    };

    if (idempotency?.kind === "execute" && idempotency.record?._id) {
      await completeIdempotentOperation(idempotency.record._id, {
        resultPayload: body,
        clothingId: result.clothing?._id || null,
      });
    }

    return response.status(result.status || 200).json(body);
  } catch (e) {
    if (idempotency?.kind === "execute" && idempotency.record?._id) {
      await failIdempotentOperation(idempotency.record._id, {
        errorCode: "upload_failed",
        errorMessage: e.error || e.message || "Failed to add clothes",
        terminal: (e.status || 500) < 500,
      }).catch(() => {});
    }
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.error || e.message || "Failed to add clothes",
    });
  }
};

export const cropImageForClient = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const file = request.file;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  if (!file) {
    return response.status(400).json({ error: "No file uploaded" });
  }

  try {
    const mode =
      request.body?.mode === "rembg_only" ? "rembg_only" : "subject_square";
    const base64 = await toBase64(file.buffer);
    const croppedBase64 = await cropImage(base64, { mode });
    // Downstream may return raw base64 or a data URL.
    const raw = String(croppedBase64).includes(",")
      ? String(croppedBase64).split(",").pop()
      : String(croppedBase64);
    const buffer = Buffer.from(raw, "base64");

    response.setHeader("Content-Type", "image/png");
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).send(buffer);
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to crop image",
      details: e.details || null,
    });
  }
};

export const updateData = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const {
    uniqueId,
    clothingId,
    type,
    colour,
    material,
    fit,
    pattern,
    slot,
    styleCategory,
    occasionTags,
  } = request.body;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const parseColour = (() => {
      try {
        return JSON.parse(colour || "[]");
      } catch (_) {
        return Array.isArray(colour) ? colour : [];
      }
    })();

    const parseOccasionTags = (() => {
      if (occasionTags === undefined) return undefined;
      if (typeof occasionTags === "string") {
        try {
          return JSON.parse(occasionTags);
        } catch (_) {
          return occasionTags;
        }
      }
      return occasionTags;
    })();

    const validation = validateClothingUpdatePayload({
      type,
      colour: parseColour,
      material: parseStringField(material),
      fit: parseStringField(fit),
      pattern: parseStringField(pattern),
      slot,
      styleCategory,
      occasionTags: parseOccasionTags,
    });

    if (!validation.ok) {
      return response.status(400).json({
        error: "Invalid clothing metadata",
        details: validation.errors,
      });
    }

    const result = await updateClothingService({
      auth0Id,
      uniqueId,
      clothingId,
      updates: validation.data,
    });

    return response.status(result.status || 200).json({
      message: result.message,
      clothing: result.clothing,
    });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to update clothing item",
      details: e.details || null,
    });
  }
};

export const replaceImageData = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const { uniqueId, clothingId, imageAlreadyCropped } = request.body;
  const file = request.file;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  if (!file) {
    return response.status(400).json({ error: "No file uploaded" });
  }

  try {
    const alreadyCropped =
      imageAlreadyCropped === true || String(imageAlreadyCropped) === "true";

    const result = await replaceClothingImageService({
      auth0Id,
      uniqueId,
      clothingId,
      file,
      imageAlreadyCropped: alreadyCropped,
    });

    return response.status(result.status || 200).json({
      message: result.message,
      clothing: result.clothing,
    });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to update clothing image",
      details: e.details || null,
    });
  }
};

export const retryStyleEnrichment = async (request, response) => {
  const auth0Id = request.auth?.sub;
  const clothingId = request.params.id;

  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  if (!clothingId) {
    return response.status(400).json({ error: "Clothing id is required" });
  }

  try {
    const result = await retryStyleEnrichmentForUser({
      auth0Id,
      clothingId,
    });
    return response.status(202).json(result);
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to retry style enrichment",
      code: e.code,
      retryAfterMs: e.retryAfterMs,
    });
  }
};

export const seedSampleWardrobe = async (request, response) => {
  const auth0Id = request.auth?.sub;
  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await seedSampleWardrobeService({ auth0Id });
    return response.status(result.status || 200).json({
      message: result.message,
      created: result.created,
      count: result.count,
      clothes: result.clothes,
    });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to seed sample wardrobe",
      details: e.details || null,
    });
  }
};

export const clearSampleWardrobe = async (request, response) => {
  const auth0Id = request.auth?.sub;
  if (!auth0Id) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await clearSampleWardrobeService({ auth0Id });
    return response.status(result.status || 200).json({
      message: result.message,
      removed: result.removed,
    });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.message || "Failed to clear sample wardrobe",
      details: e.details || null,
    });
  }
};
