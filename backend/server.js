if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}
import app from "./App.js";

const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on ${port}`);
});
