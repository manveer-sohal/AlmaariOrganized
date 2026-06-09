import { removeData as removeDataService } from "../services/clothes.service.js";
import { uploadData as uploadDataService } from "../services/clothes.service.js";
import { deleteOutfit as deleteOutfitService } from "../services/clothes.service.js";
import { getOutfits as getOutfitsService } from "../services/clothes.service.js";
import { getData as getDataService } from "../services/clothes.service.js";
import { createOutfit as createOutfitService } from "../services/clothes.service.js";
import { updateClothing as updateClothingService } from "../services/clothes.service.js";
import { validateClothingUpdatePayload } from "../utils/clothingValidation.utils.js";

import dotenv from "dotenv";
import { parseStringField } from "../utils/parseClothesFields.js";
dotenv.config();

export const removeData = async (request, response) => {
  const { auth0Id, uniqueId, clothingId } = request.body;

  if (!auth0Id) {
    return response.status(400).json({ error: "auth0Id is required" });
  }
  let result = null;
  try {
    result = await removeDataService({ auth0Id, uniqueId, clothingId });
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
  try {
    const { auth0Id } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

    let result = await getOutfitsService({ auth0Id });
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
  console.log("List clothes");

  try {
    const { auth0Id, numberOfClothes = 40, page = 1 } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

    let result = await getDataService({ auth0Id, numberOfClothes, page });
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
  console.log("Creating Outfit");
  try {
    const {
      auth0Id,
      name,
      colour,
      season,
      waterproof,
      outfit_items,
    } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

    let result = await createOutfitService({
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
  const { auth0Id, uniqueId } = request.body;
  try {
    let result = await deleteOutfitService({ auth0Id, uniqueId });
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
  try {
    const {
      auth0Id,
      type,
      colour,
      season,
      waterproof,
      favourite,
      material,
      fit,
      pattern,
    } = request.body;

    const file = request.file;

    if (!file) {
      console.log("No file uploaded");
      return response.status(400).json({ error: "No file uploaded" });
    }

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

    let result = await uploadDataService({
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
    });

    return response
      .status(result.status || 200)
      .json({ message: result.message, clothing: result.clothing });
  } catch (e) {
    console.error(e);
    return response.status(e.status || 500).json({
      error: e.error || "Failed to add clothes",
    });
  }
};

export const updateData = async (request, response) => {
  try {
    const {
      auth0Id,
      uniqueId,
      clothingId,
      type,
      colour,
      material,
      fit,
      pattern,
      slot,
    } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

    const parseColour = (() => {
      try {
        return JSON.parse(colour || "[]");
      } catch (_) {
        return Array.isArray(colour) ? colour : [];
      }
    })();

    const validation = validateClothingUpdatePayload({
      type,
      colour: parseColour,
      material: parseStringField(material),
      fit: parseStringField(fit),
      pattern: parseStringField(pattern),
      slot,
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
