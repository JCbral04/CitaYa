// Consultas SQL de servicios (issue #3)
import { query } from "../config/db.js";

export const listarServicios = () =>
  query("SELECT * FROM servicios WHERE activo = TRUE ORDER BY id");

export const obtenerServicio = (id) =>
  query("SELECT * FROM servicios WHERE id = $1", [id]);

export const crearServicio = ({ nombre, duracion_min, precio }) =>
  query(
    "INSERT INTO servicios (nombre, duracion_min, precio) VALUES ($1, $2, $3) RETURNING *",
    [nombre.trim(), duracion_min, precio]
  );

export const actualizarServicio = (id, { nombre, duracion_min, precio, activo }) =>
  query(
    `UPDATE servicios
     SET nombre = $1, duracion_min = $2, precio = $3, activo = $4
     WHERE id = $5
     RETURNING *`,
    [nombre.trim(), duracion_min, precio, activo, id]
  );

export const eliminarServicio = (id) =>
  query("DELETE FROM servicios WHERE id = $1 RETURNING *", [id]);
