// Logica de negocio de citas con maquina de estados (issues #4 y #5)
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { esFechaValida, esHoraValida, HORA_APERTURA, HORA_CIERRE } from "../utils/fechas.js";
import * as modelo from "../models/citas.js";

// Transiciones permitidas entre estados
const TRANSICIONES = {
  pendiente: ["confirmada", "cancelada", "reprogramada"],
  confirmada: ["cancelada", "reprogramada"],
  reprogramada: ["confirmada", "cancelada"],
  cancelada: [],
};

// 23505 = violacion del indice unico parcial (doble reserva, issue #5)
function esDobleReserva(err) {
  return err.code === "23505";
}

const MENSAJE_OCUPADO =
  "Horario no disponible: ya existe una cita activa en ese servicio, fecha y hora";

export const listar = asyncHandler(async (req, res) => {
  const { rows } = await modelo.listarCitas();
  res.json(rows);
});

export const obtener = asyncHandler(async (req, res) => {
  const { rows } = await modelo.obtenerCita(req.params.id);
  if (!rows.length) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }
  res.json(rows[0]);
});

export const crear = asyncHandler(async (req, res) => {
  const { cliente_nombre, servicio_id, fecha, hora_inicio } = req.body;

  // El precio lo toma del servicio en la BD (integridad de datos)
  const { rows: serv } = await modelo.obtenerServicio(servicio_id);
  if (!serv.length) {
    return res.status(404).json({ error: "Servicio no encontrado o inactivo" });
  }

  try {
    const { rows } = await modelo.crearCita({
      cliente_nombre: cliente_nombre.trim(),
      servicio_id,
      fecha,
      hora_inicio,
      precio: serv[0].precio,
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (esDobleReserva(err)) {
      return res.status(409).json({ error: MENSAJE_OCUPADO });
    }
    throw err;
  }
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const { estado: nuevo, fecha, hora_inicio } = req.body;

  const { rows } = await modelo.obtenerCita(req.params.id);
  if (!rows.length) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }
  const cita = rows[0];

  // Regla 1: la transicion debe estar permitida
  const permitidos = TRANSICIONES[cita.estado] || [];
  if (!permitidos.includes(nuevo)) {
    return res.status(409).json({
      error: `Transicion no permitida: ${cita.estado} -> ${nuevo}`,
    });
  }

  // Regla 2: reprogramar exige fecha y hora validas
  if (nuevo === "reprogramada") {
    const errores = [];
    if (!esFechaValida(fecha)) {
      errores.push("fecha futura valida requerida (YYYY-MM-DD)");
    }
    if (!esHoraValida(hora_inicio)) {
      errores.push(`hora_inicio debe estar entre ${HORA_APERTURA} y ${HORA_CIERRE}`);
    }
    if (errores.length) {
      return res.status(422).json({ errores });
    }

    try {
      const { rows: upd } = await modelo.reprogramarCita(req.params.id, fecha, hora_inicio);
      return res.json(upd[0]);
    } catch (err) {
      if (esDobleReserva(err)) {
        return res.status(409).json({ error: MENSAJE_OCUPADO });
      }
      throw err;
    }
  }

  const { rows: upd } = await modelo.cambiarEstado(req.params.id, nuevo);
  res.json(upd[0]);
});
