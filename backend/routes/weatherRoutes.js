import express from "express";
import getWeather from "../controllers/weatherController.js";
const router = express.Router();

// Define routes

router.post("/getWeater", getWeather);

export default router;
