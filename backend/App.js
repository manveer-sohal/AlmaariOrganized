import express from "express";
import cors from "cors";
import clothesRoutes from "./routes/clothesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import aiStylistRoutes from "./routes/aiStylistRoutes.js";

//!!! unistall mongoose from front end !!!!
const app = express();
const port = process.env.PORT || 8080;
app.all(/^\/(__ok|healthz|health)$/, (_req, res) => res.status(200).send("ok"));

app.get("/__ok", (_req, res) => res.status(200).send("ok"));

app.get("/healthz", (_req, res) =>
  res.status(200).send("ok! All systems go!!"),
);
app.get("/health", (_req, res) => res.status(200).send("ok"));
app.head("/health", (_req, res) => res.sendStatus(200));

app.get("/", (_req, res) => res.send("Go to /health for health check"));

//middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  }),
);
app.use(express.json());

// app.use(bodyParser.json({ limit: "5mb" }));
// app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

//rip it
// Mount routes BEFORE starting the server to avoid cold-start race conditions
app.use("/api/clothes", clothesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/aiStylist", aiStylistRoutes);

export default app;
