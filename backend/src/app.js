import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import routes from "./routes/index.js";
import serviciosRoutes from "./routes/servicios.js";
import citasRoutes from "./routes/citas.js";
import panelRoutes from "./routes/panel.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "../..");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use("/api", routes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/panel", panelRoutes);

app.use(express.static(frontendDir));

app.use(notFound);
app.use(errorHandler);

export default app;