// Rutas /api/servicios (issue #3)
import { Router } from "express";
import { listar, obtener, crear, actualizar, eliminar } from "../controllers/servicios.js";
import { validarServicio } from "../middlewares/validateServicio.js";

const router = Router();

router.get("/", listar);
router.get("/:id", obtener);
router.post("/", validarServicio, crear);
router.put("/:id", validarServicio, actualizar);
router.delete("/:id", eliminar);

export default router;
