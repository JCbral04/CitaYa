// ============================================================
// CitaYa — Capa de acceso a datos y conexión con API REST
// ============================================================

import { servicios as serviciosFallback, citasPorPeriodo } from "./data.js";

const API_BASE_URL = window.CITAYA_API_BASE ?? "/api";
const SERVICIOS_URL = `${API_BASE_URL}/servicios`;
const REQUEST_TIMEOUT_MS = 6000;
const ICONOS_PERMITIDOS = new Set(["scissors", "brush", "sparkles", "hand"]);
const ICONOS_DEFECTO = ["scissors", "brush", "sparkles", "hand"];

function normalizarIcono(icono, index = 0) {
  if (typeof icono === "string" && ICONOS_PERMITIDOS.has(icono)) {
    return icono;
  }
  return ICONOS_DEFECTO[index % ICONOS_DEFECTO.length];
}

function normalizarServicio(s, index = 0) {
  const duracion = Number(s.duracion_min ?? s.duracion) || 30;
  return {
    id: s.id ?? s._id ?? index + 1,
    nombre: String(s.nombre ?? "Servicio"),
    duracion,
    duracion_min: duracion,
    precio: Number(s.precio) || 0,
    icon: normalizarIcono(s.icon ?? s.icono, index),
    activo: s.activo !== false,
  };
}

async function fetchConTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function obtenerServicios() {
  const fallbackNormalizado = serviciosFallback.map(normalizarServicio);

  try {
    const respuesta = await fetchConTimeout(SERVICIOS_URL);
    if (!respuesta.ok) {
      console.warn(`[CitaYa] API /servicios respondió HTTP ${respuesta.status}. Usando respaldo local.`);
      return { data: fallbackNormalizado, source: "fallback" };
    }

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(lista)) {
      console.warn("[CitaYa] Respuesta inválida en /servicios. Usando respaldo local.");
      return { data: fallbackNormalizado, source: "fallback" };
    }

    return {
      data: lista.map(normalizarServicio),
      source: "api",
    };
  } catch (error) {
    console.warn("[CitaYa] No fue posible conectar con /api/servicios. Usando respaldo local.", error);
    return { data: fallbackNormalizado, source: "fallback" };
  }
}

export function obtenerCitasPorPeriodo(periodo) {
  return citasPorPeriodo[periodo];
}