// ============================================================
// CitaYa — Capa de acceso a datos y conexión con API REST
// ============================================================

import { servicios as serviciosFallback, citasHoy, citasPorPeriodo } from "./data.js";

const API_BASE =
  window.location.port && window.location.port !== "3000"
    ? "http://localhost:3000/api"
    : "/api";

const SERVICIOS_URL = `${API_BASE}/servicios`;
const CITAS_URL = `${API_BASE}/citas`;
const PANEL_RESUMEN_URL = `${API_BASE}/panel/resumen`;

const STORAGE_SERVICIOS_KEY = "citaya_servicios_v1";
const STORAGE_CITAS_KEY = "citaya_citas_v1";
const ICONOS_DEFECTO = ["scissors", "brush", "sparkles", "hand"];

const TRANSICIONES_CITA = {
  pendiente: ["confirmada", "cancelada", "reprogramada"],
  confirmada: ["cancelada", "reprogramada"],
  reprogramada: ["confirmada", "cancelada"],
  cancelada: [],
};

// -------------------- Servicios --------------------

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

export async function obtenerServicios() {
  try {
    const respuesta = await fetch(SERVICIOS_URL);
    if (!respuesta.ok) return leerServiciosLocal();

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(lista)) return leerServiciosLocal();

    const normalizados = lista.map(normalizarServicio);
    guardarServiciosLocal(normalizados);
    return normalizados;
  } catch {
    return leerServiciosLocal();
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

  const actuales = leerServiciosLocal();
  const nuevoLocal = normalizarServicio(
    { id: Date.now(), ...bodyAPI, icon: datos.icon },
    actuales.length
  );

  try {
    const respuesta = await fetch(SERVICIOS_URL, {
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
      guardarServiciosLocal([...actuales, item]);
      return item;
    }
  } catch {
    // Persistencia local cuando la API no está disponible
  }

  guardarServiciosLocal([...actuales, nuevoLocal]);
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
    await fetch(`${SERVICIOS_URL}/${encodeURIComponent(servicioActual.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyAPI),
    });
  } catch {
    // Persistencia local cuando la API no está disponible
  }

  const actuales = leerServiciosLocal();
  const actualizados = actuales.map((s) =>
    String(s.id) === String(servicioActual.id)
      ? { ...s, duracion, duracion_min: duracion, precio, activo }
      : s
  );
  guardarServiciosLocal(actualizados);
  return actualizados.find((s) => String(s.id) === String(servicioActual.id));
}

export async function cambiarEstadoServicio(servicioActual, activo) {
  try {
    if (!activo) {
      await fetch(`${SERVICIOS_URL}/${encodeURIComponent(servicioActual.id)}`, {
        method: "DELETE",
      });
    } else {
      await actualizarServicio(servicioActual, { activo: true });
      return;
    }
  } catch {
    // Persistencia local cuando la API no está disponible
  }

  const actuales = leerServiciosLocal();
  const actualizados = actuales.map((s) =>
    String(s.id) === String(servicioActual.id) ? { ...s, activo } : s
  );
  guardarServiciosLocal(actualizados);
}

// -------------------- Citas --------------------

function normalizarHora(valor) {
  if (!valor) return "09:00";
  return String(valor).slice(0, 5);
}

function normalizarFecha(valor) {
  if (!valor) return new Date().toLocaleDateString("en-CA");
  return String(valor).slice(0, 10);
}

function normalizarCita(c, index = 0) {
  const hora = normalizarHora(c.hora_inicio ?? c.hora);
  const fecha = normalizarFecha(c.fecha);
  const cliente = c.cliente_nombre ?? c.cliente ?? "Cliente";
  return {
    id: c.id ?? c._id ?? index + 1,
    cliente,
    cliente_nombre: cliente,
    servicio_id: c.servicio_id ?? null,
    servicio: c.servicio_nombre ?? c.servicio ?? "Servicio",
    fecha,
    hora,
    hora_inicio: hora,
    estado: c.estado || "pendiente",
    precio: Number(c.precio) || 0,
  };
}

function leerCitasLocal() {
  try {
    const guardado = localStorage.getItem(STORAGE_CITAS_KEY);
    if (guardado) {
      const parsed = JSON.parse(guardado);
      if (Array.isArray(parsed)) return parsed.map(normalizarCita);
    }
  } catch {
    // Ignorar errores de acceso a storage
  }
  const inicial = citasHoy.map(normalizarCita);
  guardarCitasLocal(inicial);
  return inicial;
}

function guardarCitasLocal(lista) {
  try {
    localStorage.setItem(STORAGE_CITAS_KEY, JSON.stringify(lista));
  } catch {
    // Ignorar errores de acceso a storage
  }
}

export async function obtenerCitasHoy() {
  try {
    const respuesta = await fetch(CITAS_URL);
    if (!respuesta.ok) return leerCitasLocal();

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(lista)) return leerCitasLocal();

    const serviciosMap = new Map(
      leerServiciosLocal().map((s) => [String(s.id), s])
    );

    const normalizadas = lista.map((item, idx) => {
      const srv = serviciosMap.get(String(item.servicio_id));
      return normalizarCita(
        {
          ...item,
          servicio: item.servicio_nombre ?? item.servicio ?? srv?.nombre,
          precio: item.precio ?? srv?.precio,
        },
        idx
      );
    });

    guardarCitasLocal(normalizadas);
    return normalizadas;
  } catch {
    return leerCitasLocal();
  }
}

export async function crearCita(datos) {
  const actuales = leerCitasLocal();
  const hora = normalizarHora(datos.hora);
  const fecha = normalizarFecha(datos.fecha);

  const choque = actuales.some(
    (c) => c.estado !== "cancelada" && c.fecha === fecha && c.hora === hora
  );
  if (choque) {
    throw new Error("Horario no disponible");
  }

  const bodyAPI = {
    cliente_nombre: datos.cliente,
    servicio_id: datos.servicio_id,
    fecha,
    hora_inicio: hora,
    precio: Number(datos.precio) || 0,
    estado: "pendiente",
  };

  try {
    const respuesta = await fetch(CITAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyAPI),
    });

    if (respuesta.status === 409) {
      throw new Error("Horario no disponible");
    }

    if (!respuesta.ok) {
      const errBody = await respuesta.json().catch(() => ({}));
      throw new Error(errBody?.message || errBody?.error || "No se pudo registrar la cita.");
    }

    const creado = await respuesta.json();
    const item = normalizarCita(
      {
        ...(creado?.data || creado),
        cliente: datos.cliente,
        servicio: datos.servicio,
        precio: datos.precio,
      },
      actuales.length
    );
    guardarCitasLocal([...actuales, item]);
    return item;
  } catch (err) {
    if (err instanceof TypeError) {
      const nuevoLocal = normalizarCita(
        {
          id: Date.now(),
          cliente: datos.cliente,
          servicio_id: datos.servicio_id,
          servicio: datos.servicio,
          fecha,
          hora,
          estado: "pendiente",
          precio: datos.precio,
        },
        actuales.length
      );
      guardarCitasLocal([...actuales, nuevoLocal]);
      return nuevoLocal;
    }
    throw err;
  }
}

export async function cambiarEstadoCita(citaActual, nuevoEstado, extra = {}) {
  const permitidas = TRANSICIONES_CITA[citaActual.estado] || [];
  if (!permitidas.includes(nuevoEstado)) {
    throw new Error(`No se puede pasar una cita de "${citaActual.estado}" a "${nuevoEstado}".`);
  }

  const actuales = leerCitasLocal();
  const nuevaFecha = extra.fecha ? normalizarFecha(extra.fecha) : citaActual.fecha;
  const nuevaHora = extra.hora ? normalizarHora(extra.hora) : citaActual.hora;

  if (nuevoEstado === "reprogramada") {
    const choque = actuales.some(
      (c) =>
        String(c.id) !== String(citaActual.id) &&
        c.estado !== "cancelada" &&
        c.fecha === nuevaFecha &&
        c.hora === nuevaHora
    );
    if (choque) {
      throw new Error("Horario no disponible");
    }
  }

  const bodyAPI =
    nuevoEstado === "reprogramada"
      ? { estado: "reprogramada", fecha: nuevaFecha, hora_inicio: nuevaHora }
      : { estado: nuevoEstado };

  try {
    const respuesta = await fetch(
      `${CITAS_URL}/${encodeURIComponent(citaActual.id)}/estado`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyAPI),
      }
    );

    if (respuesta.status === 409) {
      throw new Error("Horario no disponible");
    }

    if (!respuesta.ok) {
      const errBody = await respuesta.json().catch(() => ({}));
      throw new Error(errBody?.message || errBody?.error || "No se pudo actualizar el estado.");
    }
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
  }

  const actualizadas = actuales.map((c) =>
    String(c.id) === String(citaActual.id)
      ? {
          ...c,
          estado: nuevoEstado,
          fecha: nuevaFecha,
          hora: nuevaHora,
          hora_inicio: nuevaHora,
        }
      : c
  );
  guardarCitasLocal(actualizadas);
  return actualizadas.find((c) => String(c.id) === String(citaActual.id));
}

// -------------------- Resumen del Panel (Issue #9 y #6) --------------------

function calcularResumenLocal() {
  const activas = leerCitasLocal().filter((c) => c.estado !== "cancelada");
  return {
    activas: activas.length,
    confirmadas: activas.filter((c) => c.estado === "confirmada").length,
    pendientes: activas.filter((c) => c.estado === "pendiente").length,
    ingresosEstimados: activas.reduce((sum, c) => sum + (Number(c.precio) || 0), 0),
  };
}

export async function obtenerResumenPanel() {
  try {
    const respuesta = await fetch(PANEL_RESUMEN_URL);
    if (!respuesta.ok) return calcularResumenLocal();

    const payload = await respuesta.json();
    const data = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
    if (!data || typeof data !== "object") return calcularResumenLocal();

    const activas = Number(data.activas ?? data.total ?? data.citas_hoy);
    const confirmadas = Number(data.confirmadas ?? data.citas_confirmadas);
    const pendientes = Number(data.pendientes ?? data.citas_pendientes);
    const ingresosEstimados = Number(
      data.ingresosEstimados ?? data.ingresos_estimados ?? data.ingresos
    );

    if ([activas, confirmadas, pendientes, ingresosEstimados].some((n) => Number.isNaN(n))) {
      return calcularResumenLocal();
    }

    return { activas, confirmadas, pendientes, ingresosEstimados };
  } catch {
    return calcularResumenLocal();
  }
}

export function obtenerCitasPorPeriodo(periodo) {
  return citasPorPeriodo[periodo];
}