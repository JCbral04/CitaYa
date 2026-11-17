// Rutas /api/panel (issue #6)
import { Router } from "express";
import { resumen } from "../controllers/panel.js";

const router = Router();

router.get("/resumen", resumen);

export default router;
