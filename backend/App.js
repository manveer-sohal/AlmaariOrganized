import express from "express";
import clothesRoutes from "./routes/clothesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import cors from "cors";

//!!! unistall mongoose from front end !!!!
const app = express();
const port = process.env.PORT || 3001;
app.set("trust proxy", 1); // so req.ip works behind Cloudflare

//middleware
app.use(
  cors({ origin: process.env.CORS_ORIGIN?.split(","), credentials: true })
);
app.use(express.json());

// app.use(bodyParser.json({ limit: "5mb" }));
// app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

app.use("/api/clothes", clothesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/weather", weatherRoutes);

app.get("/healthz", (_req, res) => res.send("ok!"));
app.get("/", (_req, res) => res.send("Go to /healthz for health check"));

//rip it
app.listen(port, () => {
  console.log(`App listening  on port ${port}`);
});
