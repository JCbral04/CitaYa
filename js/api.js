// ============================================================
// CitaYa — Capa de acceso a datos y conexión con API REST
// ============================================================

import { servicios as serviciosFallback, citasHoy, citasPorPeriodo } from "./data.js";

const API_URL =
  window.location.port && window.location.port !== "3000"
    ? "http://localhost:3000/api/servicios"
    : "/api/servicios";

const STORAGE_KEY = "citaya_servicios_v1";
const ICONOS_DEFECTO = ["scissors", "brush", "sparkles", "hand"];

function normalizarServicio(s, index = 0) {
  const duracion = Number(s.duracion_min ?? s.duracion) || 30;
  return {
    id: s.id ?? s._id ?? index + 1,
    nombre: s.nombre,
    duracion,
    duracion_min: duracion,
    precio: Number(s.precio) || 0,
    icon: s.icon || s.icono || ICONOS_DEFECTO[index % ICONOS_DEFECTO.length],
    activo: s.activo !== false,
  };
}

function leerLocal() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      const parsed = JSON.parse(guardado);
      if (Array.isArray(parsed)) return parsed.map(normalizarServicio);
    }
  } catch {
    // Ignorar errores de acceso a storage
  }
  const inicial = serviciosFallback.map(normalizarServicio);
  guardarLocal(inicial);
  return inicial;
}

function guardarLocal(lista) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // Ignorar errores de acceso a storage
  }
}

export async function obtenerServicios() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) return leerLocal();

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(lista)) return leerLocal();

    const normalizados = lista.map(normalizarServicio);
    guardarLocal(normalizados);
    return normalizados;
  } catch {
    return leerLocal();
  }
}

export async function crearServicio(datos) {
  const duracion = Number(datos.duracion);
  const precio = Number(datos.precio);
  const bodyAPI = {
    nombre: datos.nombre,
    duracion,
    duracion_min: duracion,
    precio,
    activo: true,
  };

  const actuales = leerLocal();
  const nuevoLocal = normalizarServicio(
    { id: Date.now(), ...bodyAPI, icon: datos.icon },
    actuales.length
  );

  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyAPI),
    });
    if (respuesta.ok) {
      const creado = await respuesta.json();
      const item = normalizarServicio(
        { ...(creado?.data || creado || nuevoLocal), icon: datos.icon },
        actuales.length
      );
      guardarLocal([...actuales, item]);
      return item;
    }
  } catch {
    // Persistencia local cuando la API no está disponible
  }

  guardarLocal([...actuales, nuevoLocal]);
  return nuevoLocal;
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
    await fetch(`${API_URL}/${encodeURIComponent(servicioActual.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyAPI),
    });
  } catch {
    // Persistencia local cuando la API no está disponible
  }

  const actuales = leerLocal();
  const actualizados = actuales.map((s) =>
    String(s.id) === String(servicioActual.id)
      ? { ...s, duracion, duracion_min: duracion, precio, activo }
      : s
  );
  guardarLocal(actualizados);
  return actualizados.find((s) => String(s.id) === String(servicioActual.id));
}

export async function cambiarEstadoServicio(servicioActual, activo) {
  try {
    if (!activo) {
      await fetch(`${API_URL}/${encodeURIComponent(servicioActual.id)}`, {
        method: "DELETE",
      });
    } else {
      await actualizarServicio(servicioActual, { activo: true });
      return;
    }
  } catch {
    // Persistencia local cuando la API no está disponible
  }

  const actuales = leerLocal();
  const actualizados = actuales.map((s) =>
    String(s.id) === String(servicioActual.id) ? { ...s, activo } : s
  );
  guardarLocal(actualizados);
}

export function obtenerCitasHoy() {
  return citasHoy;
}

export function obtenerCitasPorPeriodo(periodo) {
  return citasPorPeriodo[periodo];
}