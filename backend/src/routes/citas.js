// Rutas /api/citas (issue #4)
import { Router } from "express";
import { listar, obtener, crear, cambiarEstado } from "../controllers/citas.js";
import { validarCita } from "../middlewares/validateCita.js";

const router = Router();

router.get("/", listar);
router.get("/:id", obtener);
router.post("/", validarCita, crear);
router.patch("/:id/estado", cambiarEstado);

export default router;
