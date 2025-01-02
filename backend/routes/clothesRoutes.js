import express from "express";
import { getData, uploadData } from "../controllers/clothesController.js";

const router = express.Router();

// Define routes

router.post("/listClothes", getData);
router.post("/upload", uploadData);
export default router;
