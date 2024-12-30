import express from "express";
import { test } from "../controllers/userController.js";

const router = express.Router();

// Define routes

// router.post("/create", POST);
// router.post("/get", getData);
router.post("/login", test);

export default router;
