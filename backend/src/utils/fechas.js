// Validaciones de fecha y hora del negocio (issue #4)
// Horario de atencion: 08:00 a 19:00, de lunes a sabado

const HORA_APERTURA = "08:00";
const HORA_CIERRE = "19:00";

export function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return fecha >= hoy;
}

export function esHoraValida(hora) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return false;
  return hora >= HORA_APERTURA && hora < HORA_CIERRE;
}

export { HORA_APERTURA, HORA_CIERRE };
