// ============================================================
// CitaYa — Capa de acceso a datos y conexión con API REST
// ============================================================

import { servicios as serviciosFallback, citasPorPeriodo } from "./data.js";

const API_BASE_URL = window.CITAYA_API_BASE ?? "/api";
const SERVICIOS_URL = `${API_BASE_URL}/servicios`;
const STORAGE_SERVICIOS_KEY = "citaya_servicios_v1";
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

function leerServiciosLocal() {
  try {
    const guardado = localStorage.getItem(STORAGE_SERVICIOS_KEY);
    if (guardado) {
      const parsed = JSON.parse(guardado);
      if (Array.isArray(parsed)) return parsed.map(normalizarServicio);
    }
  } catch {
    // Ignorar errores de acceso a storage
  }
  const inicial = serviciosFallback.map(normalizarServicio);
  guardarServiciosLocal(inicial);
  return inicial;
}

function guardarServiciosLocal(lista) {
  try {
    localStorage.setItem(STORAGE_SERVICIOS_KEY, JSON.stringify(lista));
  } catch {
    // Ignorar errores de acceso a storage
  }
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

function esErrorDeRed(error) {
  return error instanceof TypeError || error?.name === "AbortError";
}

async function extraerMensajeError(respuesta, fallbackMsg) {
  try {
    const body = await respuesta.json();
    return body?.message || body?.error || `${fallbackMsg} (HTTP ${respuesta.status})`;
  } catch {
    return `${fallbackMsg} (HTTP ${respuesta.status})`;
  }
}

export async function obtenerServicios() {
  try {
    const respuesta = await fetchConTimeout(SERVICIOS_URL);
    if (!respuesta.ok) {
      console.warn(`[CitaYa] GET /servicios devolvió HTTP ${respuesta.status}. Usando respaldo local de solo lectura.`);
      return { data: leerServiciosLocal(), source: "fallback" };
    }

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(lista)) {
      console.warn("[CitaYa] Estructura inesperada en /servicios. Usando respaldo local de solo lectura.");
      return { data: leerServiciosLocal(), source: "fallback" };
    }

    const normalizados = lista.map(normalizarServicio);
    guardarServiciosLocal(normalizados);
    return { data: normalizados, source: "api" };
  } catch (error) {
    console.warn("[CitaYa] API de servicios no disponible. Usando respaldo local de solo lectura.", error);
    return { data: leerServiciosLocal(), source: "fallback" };
  }
}

export async function crearServicio(datos) {
  const duracion = Number(datos.duracion);
  const precio = Number(datos.precio);
  const icon = normalizarIcono(datos.icon);

  const bodyAPI = {
    nombre: String(datos.nombre).trim(),
    duracion,
    duracion_min: duracion,
    precio,
    activo: true,
  };

  try {
    const respuesta = await fetchConTimeout(SERVICIOS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyAPI),
    });

    if (!respuesta.ok) {
      throw new Error(await extraerMensajeError(respuesta, "No se pudo registrar el servicio"));
    }

    const creado = await respuesta.json();
    const actuales = leerServiciosLocal();
    const item = normalizarServicio(
      { ...(creado?.data || creado || bodyAPI), icon },
      actuales.length
    );
    guardarServiciosLocal([...actuales, item]);
    return { data: item, source: "api" };
  } catch (error) {
    if (esErrorDeRed(error)) {
      throw new Error(
        "Sin conexión con el servidor: no se pudo registrar el servicio. Verifica que el backend esté encendido e inténtalo de nuevo."
      );
    }
    throw error;
  }
}

export async function actualizarServicio(servicioActual, cambios) {
  const duracion = Number(cambios.duracion ?? servicioActual.duracion);
  const precio = Number(cambios.precio ?? servicioActual.precio);
  const activo = cambios.activo ?? servicioActual.activo;

  const bodyAPI = {
    nombre: servicioActual.nombre,
    duracion,
    duracion_min: duracion,
    precio,
    activo,
  };

  try {
    const respuesta = await fetchConTimeout(
      `${SERVICIOS_URL}/${encodeURIComponent(servicioActual.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyAPI),
      }
    );

    if (!respuesta.ok) {
      throw new Error(await extraerMensajeError(respuesta, "No se pudo actualizar el servicio"));
    }

    const actuales = leerServiciosLocal();
    const actualizados = actuales.map((s) =>
      String(s.id) === String(servicioActual.id)
        ? { ...s, duracion, duracion_min: duracion, precio, activo }
        : s
    );
    guardarServiciosLocal(actualizados);
    const actualizado = actualizados.find((s) => String(s.id) === String(servicioActual.id));
    return { data: actualizado, source: "api" };
  } catch (error) {
    if (esErrorDeRed(error)) {
      throw new Error(
        "Sin conexión con el servidor: no se pudieron guardar los cambios del servicio. Inténtalo de nuevo."
      );
    }
    throw error;
  }
}

export async function cambiarEstadoServicio(servicioActual, activo) {
  // Desactivación y reactivación lógica vía PUT para conservar integridad referencial
  return actualizarServicio(servicioActual, { activo: Boolean(activo) });
}

export function obtenerCitasPorPeriodo(periodo) {
  return citasPorPeriodo[periodo];
}