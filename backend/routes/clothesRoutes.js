import express from "express";
import {
  getData,
  uploadData,
  removeData,
  updateData,
  createOutfit,
  getOutfits,
  deleteOutfit,
  cropImageForClient,
  retryStyleEnrichment,
} from "../controllers/clothesController.js";
import uploadMiddleware from "../middleware/upload.middleware.js";
import { validateImageFile } from "../middleware/validateImageFile.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  uploadRateLimiter,
  styleEnrichmentRetryLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.use(requireAuth);

router.post("/getOutfits", getOutfits);
router.post("/listClothes", getData);
router.post(
  "/upload",
  uploadRateLimiter,
  uploadMiddleware,
  validateImageFile,
  uploadData,
);
router.post(
  "/crop",
  uploadRateLimiter,
  uploadMiddleware,
  validateImageFile,
  cropImageForClient,
);
router.post("/remove", removeData);
router.post("/update", updateData);
router.post(
  "/:id/style-enrichment/retry",
  styleEnrichmentRetryLimiter,
  retryStyleEnrichment,
);
router.post("/createOutfit", createOutfit);
router.post("/deleteOutfit", deleteOutfit);

export default router;
