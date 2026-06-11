import express from "express";
import { getWeather } from "../controllers/weatherController.js";
import { weatherRateLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

function normalizeBodyFromQuery(req, _res, next) {
  if (req.method === "GET") {
    const hasBody = req.body && Object.keys(req.body).length > 0;
    if (!hasBody && req.query && Object.keys(req.query).length > 0) {
      req.body = { ...req.query };
    }
  }
  next();
}

router.use(normalizeBodyFromQuery);
router.use(weatherRateLimiter);

router.get("/getWeather", getWeather);
router.post("/getWeather", getWeather);

export default router;
