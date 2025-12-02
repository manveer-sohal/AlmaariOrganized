import express from "express";
import {
  getData,
  uploadData,
  removeData,
  uploadMiddleware,
  createOutfit,
  getOutfits,
  deleteOutfit,
} from "../controllers/clothesController.js";

const router = express.Router();

// Define routes
router.post("/getOutfits", getOutfits);
router.post("/listClothes", getData);
router.post("/upload", uploadMiddleware, uploadData);
router.post("/remove", removeData);
router.post("/createOutfit", createOutfit);
router.post("/deleteOutfit", deleteOutfit);
export default router;
