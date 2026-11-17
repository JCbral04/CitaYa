// Validacion basica del body de cita (issue #4)
import { esFechaValida, esHoraValida, HORA_APERTURA, HORA_CIERRE } from "../utils/fechas.js";

export function validarCita(req, res, next) {
  const { cliente_nombre, servicio_id, fecha, hora_inicio } = req.body;
  const errores = [];

  if (!cliente_nombre || typeof cliente_nombre !== "string" || !cliente_nombre.trim()) {
    errores.push("cliente_nombre es obligatorio");
  }
  if (!Number.isInteger(servicio_id) || servicio_id <= 0) {
    errores.push("servicio_id debe ser un entero mayor que 0");
  }
  if (!esFechaValida(fecha)) {
    errores.push("fecha debe tener formato YYYY-MM-DD y no puede ser pasada");
  }
  if (!esHoraValida(hora_inicio)) {
    errores.push(`hora_inicio debe estar entre ${HORA_APERTURA} y ${HORA_CIERRE}`);
  }

  if (errores.length) {
    return res.status(400).json({ errores });
  }
  next();
}
