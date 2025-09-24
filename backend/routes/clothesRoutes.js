import express from "express";
import {
  getData,
  uploadData,
  removeData,
  uploadMiddleware,
  createOutfit,
} from "../controllers/clothesController.js";

const router = express.Router();

// Define routes

router.post("/listClothes", getData);
router.post("/upload", uploadMiddleware, uploadData);
router.post("/remove", removeData);

router.post("/createOutfit", createOutfit);

export default router;
