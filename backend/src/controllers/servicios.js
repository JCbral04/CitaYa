// Logica de negocio de servicios (issue #3)
import { asyncHandler } from "../middlewares/asyncHandler.js";
import * as modelo from "../models/servicios.js";

export const listar = asyncHandler(async (req, res) => {
  const { rows } = await modelo.listarServicios();
  res.json(rows);
});

export const obtener = asyncHandler(async (req, res) => {
  const { rows } = await modelo.obtenerServicio(req.params.id);
  if (!rows.length) {
    return res.status(404).json({ error: "Servicio no encontrado" });
  }
  res.json(rows[0]);
});

export const crear = asyncHandler(async (req, res) => {
  const { rows } = await modelo.crearServicio(req.body);
  res.status(201).json(rows[0]);
});

export const actualizar = asyncHandler(async (req, res) => {
  const { nombre, duracion_min, precio, activo } = req.body;
  const { rows } = await modelo.actualizarServicio(req.params.id, {
    nombre,
    duracion_min,
    precio,
    activo: activo ?? true,
  });
  if (!rows.length) {
    return res.status(404).json({ error: "Servicio no encontrado" });
  }
  res.json(rows[0]);
});

export const eliminar = asyncHandler(async (req, res) => {
  try {
    const { rows } = await modelo.eliminarServicio(req.params.id);
    if (!rows.length) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }
    res.json({ mensaje: "Servicio eliminado", servicio: rows[0] });
  } catch (err) {
    // 23503: servicio con citas asociadas (violacion de FK)
    if (err.code === "23503") {
      return res.status(409).json({
        error: "No se puede eliminar: el servicio tiene citas asociadas",
      });
    }
    throw err;
  }
});
