import express from "express";
import {
  getData,
  uploadData,
  removeData,
  updateData,
  createOutfit,
  getOutfits,
  deleteOutfit,
} from "../controllers/clothesController.js";
import uploadMiddleware from "../middleware/upload.middleware.js";
import { validateImageFile } from "../middleware/validateImageFile.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadRateLimiter } from "../middleware/rateLimiters.js";

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
router.post("/remove", removeData);
router.post("/update", updateData);
router.post("/createOutfit", createOutfit);
router.post("/deleteOutfit", deleteOutfit);

export default router;
