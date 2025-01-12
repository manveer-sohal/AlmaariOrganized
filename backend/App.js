import express from "express";
import clothesRoutes from "./routes/clothesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import cors from "cors";

//!!! unistall mongoose from front end !!!!
const app = express();
const port = 3001;

//middleware
app.use(cors());
app.use(express.json());

// app.use(bodyParser.json({ limit: "5mb" }));
// app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

app.use("/api/clothes", clothesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/weather", weatherRoutes);

//rip it
app.listen(port, () => {
  console.log(`App listening  on port ${port}`);
});
