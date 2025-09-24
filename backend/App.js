import express from "express";
import cors from "cors";

//!!! unistall mongoose from front end !!!!
const app = express();
const port = process.env.PORT || 8080;
app.set("trust proxy", 1); // so req.ip works behind Cloudflare
app.all(/^\/(__ok|healthz|health)$/, (_req, res) => res.status(200).send("ok"));

app.get("/__ok", (_req, res) => res.status(200).send("ok"));

app.get("/healthz", (_req, res) =>
  res.status(200).send("ok! All systems go!!")
);
app.get("/health", (_req, res) => res.status(200).send("ok"));
app.head("/health", (_req, res) => res.sendStatus(200));

app.get("/", (_req, res) => res.send("Go to /health for health check"));

//middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(express.json());

// app.use(bodyParser.json({ limit: "5mb" }));
// app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

//rip it
app.listen(port, "0.0.0.0", async () => {
  console.log(`App listening  on port ${port}`);

  try {
    const { default: clothesRoutes } = await import(
      "./routes/clothesRoutes.js"
    );
    const { default: userRoutes } = await import("./routes/userRoutes.js");
    const { default: weatherRoutes } = await import(
      "./routes/weatherRoutes.js"
    );

    app.use("/api/clothes", clothesRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/weather", weatherRoutes);

    console.log("Routes mounted");
  } catch (e) {
    console.error("Failed to mount routes:", e);
  }
});
