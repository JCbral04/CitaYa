// ============================================================
// CitaYa — Capa de acceso a datos y conexión con API REST
// ============================================================

import { servicios as serviciosFallback, citasHoy, citasPorPeriodo } from "./data.js";

const API_URL =
  window.location.port && window.location.port !== "3000"
    ? "http://localhost:3000/api/servicios"
    : "/api/servicios";

export async function obtenerServicios() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) {
      return serviciosFallback;
    }

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;

    if (!Array.isArray(lista)) {
      return serviciosFallback;
    }

    return lista.map((s) => ({
      ...s,
      icon: s.icon || s.icono || "scissors",
    }));
  } catch {
    // Fallback silencioso si la API no responde
    return serviciosFallback;
  }
}

export function obtenerCitasHoy() {
  return citasHoy;
}

export function obtenerCitasPorPeriodo(periodo) {
  return citasPorPeriodo[periodo];
}