// Logica del panel del dia (issue #6)
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { resumenDelDia } from "../models/panel.js";

export const resumen = asyncHandler(async (req, res) => {
  const { rows } = await resumenDelDia();
  const r = rows[0];
  res.json({
    activas: Number(r.activas),
    confirmadas: Number(r.confirmadas),
    pendientes: Number(r.pendientes),
    ingresosEstimados: Number(r.ingresos_estimados),
  });
});
