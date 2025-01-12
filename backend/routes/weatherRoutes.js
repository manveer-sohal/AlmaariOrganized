import express from "express";
import getWeather from "../controllers/weatherController.js";
const router = express.Router();

// Define routes

router.post("/getWeather", getWeather);

export default router;
