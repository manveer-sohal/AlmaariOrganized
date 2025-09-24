import express from "express";
import { getWeather } from "../controllers/weatherController.js";
const router = express.Router();

// Allow both POST and GET to call the same controller.
// If it's a GET, map query params into req.body so the controller works unchanged.
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

// Support GET /getWeather?city=... as well as POST /getWeather with JSON body
router.get("/getWeather", getWeather);
router.post("/getWeather", getWeather);

export default router;
