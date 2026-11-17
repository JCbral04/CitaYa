// Agregados del panel del dia (issue #6)
import { query } from "../config/db.js";

export const resumenDelDia = () =>
  query(
    `SELECT
       COUNT(*) FILTER (WHERE estado <> 'cancelada')                 AS activas,
       COUNT(*) FILTER (WHERE estado = 'confirmada')                 AS confirmadas,
       COUNT(*) FILTER (WHERE estado = 'pendiente')                  AS pendientes,
       COALESCE(SUM(precio) FILTER (WHERE estado <> 'cancelada'), 0) AS ingresos_estimados
     FROM citas
     WHERE fecha = CURRENT_DATE`
  );
