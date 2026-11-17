// Consultas SQL de citas (issue #4)
import { query } from "../config/db.js";

const SELECT_CITA = `
  SELECT c.*, s.nombre AS servicio
  FROM citas c
  JOIN servicios s ON s.id = c.servicio_id
`;

export const listarCitas = () =>
  query(`${SELECT_CITA} ORDER BY c.fecha DESC, c.hora_inicio`);

export const obtenerCita = (id) =>
  query(`${SELECT_CITA} WHERE c.id = $1`, [id]);

export const obtenerServicio = (servicio_id) =>
  query("SELECT * FROM servicios WHERE id = $1 AND activo = TRUE", [servicio_id]);

export const crearCita = ({ cliente_nombre, servicio_id, fecha, hora_inicio, precio }) =>
  query(
    `INSERT INTO citas (cliente_nombre, servicio_id, fecha, hora_inicio, estado, precio)
     VALUES ($1, $2, $3, $4, 'pendiente', $5)
     RETURNING *`,
    [cliente_nombre, servicio_id, fecha, hora_inicio, precio]
  );

export const cambiarEstado = (id, estado) =>
  query(
    `UPDATE citas SET estado = $1, actualizado_en = now()
     WHERE id = $2 RETURNING *`,
    [estado, id]
  );

export const reprogramarCita = (id, fecha, hora_inicio) =>
  query(
    `UPDATE citas
     SET estado = 'reprogramada', fecha = $1, hora_inicio = $2, actualizado_en = now()
     WHERE id = $3 RETURNING *`,
    [fecha, hora_inicio, id]
  );
