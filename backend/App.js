import express from "express";
import clothesRoutes from "./routes/clothesRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import cors from "cors";

//!!! unistall mongoose from front end !!!!
const app = express();
const port = 3001;

//middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/clothes", clothesRoutes);
app.use("/api/users", userRoutes);

//rip it
app.listen(port, () => {
  console.log(`App listening  on port ${port}`);
});
