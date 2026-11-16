// ============================================================
// CitaYa — Capa de acceso a datos y futura conexión con API REST
// ============================================================

import { servicios, citasHoy, citasPorPeriodo } from "./data.js";

export function obtenerServicios() {
  return servicios;
}

export function obtenerCitasHoy() {
  return citasHoy;
}

export function obtenerCitasPorPeriodo(periodo) {
  return citasPorPeriodo[periodo];
}