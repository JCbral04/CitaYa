// ============================================================
// CitaYa — Capa de acceso a datos y conexión con API REST
// ============================================================

import { servicios as serviciosFallback, citasHoy, citasPorPeriodo } from "./data.js";

const API_BASE_URL = window.CITAYA_API_BASE ?? "/api";
const SERVICIOS_URL = `${API_BASE_URL}/servicios`;
const CITAS_URL = `${API_BASE_URL}/citas`;
const PANEL_RESUMEN_URL = `${API_BASE_URL}/panel/resumen`;

const STORAGE_SERVICIOS_KEY = "citaya_servicios_v1";
const STORAGE_CITAS_KEY = "citaya_citas_v1";
const REQUEST_TIMEOUT_MS = 6000;

const ICONOS_PERMITIDOS = new Set(["scissors", "brush", "sparkles", "hand"]);
const ICONOS_DEFECTO = ["scissors", "brush", "sparkles", "hand"];

const TRANSICIONES_CITA = {
  pendiente: ["confirmada", "cancelada", "reprogramada"],
  confirmada: ["cancelada", "reprogramada"],
  reprogramada: ["confirmada", "cancelada"],
  cancelada: [],
};

// -------------------- Utilidades comunes --------------------

export function obtenerFechaLocalISO(fechaRef = new Date()) {
  const year = fechaRef.getFullYear();
  const month = String(fechaRef.getMonth() + 1).padStart(2, "0");
  const day = String(fechaRef.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function horaAMinutos(horaStr) {
  const [h, m] = String(horaStr || "00:00").slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function normalizarIcono(icono, index = 0) {
  if (typeof icono === "string" && ICONOS_PERMITIDOS.has(icono)) {
    return icono;
  }
  return ICONOS_DEFECTO[index % ICONOS_DEFECTO.length];
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

// -------------------- Servicios --------------------

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

export async function obtenerServicios() {
  try {
    const respuesta = await fetchConTimeout(SERVICIOS_URL);
    if (!respuesta.ok) {
      return { data: leerServiciosLocal(), source: "fallback" };
    }

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(lista)) {
      return { data: leerServiciosLocal(), source: "fallback" };
    }

    const normalizados = lista.map(normalizarServicio);
    guardarServiciosLocal(normalizados);
    return { data: normalizados, source: "api" };
  } catch {
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
    if (!esErrorDeRed(error)) throw error;
    const actuales = leerServiciosLocal();
    const nuevoLocal = normalizarServicio(
      { id: Date.now(), ...bodyAPI, icon },
      actuales.length
    );
    guardarServiciosLocal([...actuales, nuevoLocal]);
    return { data: nuevoLocal, source: "local" };
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
    if (!esErrorDeRed(error)) throw error;
    const actuales = leerServiciosLocal();
    const actualizados = actuales.map((s) =>
      String(s.id) === String(servicioActual.id)
        ? { ...s, duracion, duracion_min: duracion, precio, activo }
        : s
    );
    guardarServiciosLocal(actualizados);
    const actualizado = actualizados.find((s) => String(s.id) === String(servicioActual.id));
    return { data: actualizado, source: "local" };
  }
}

export async function cambiarEstadoServicio(servicioActual, activo) {
  return actualizarServicio(servicioActual, { activo: Boolean(activo) });
}

// -------------------- Citas --------------------

function normalizarHora(valor) {
  if (!valor) return "09:00";
  return String(valor).slice(0, 5);
}

function normalizarFecha(valor) {
  if (!valor) return obtenerFechaLocalISO();
  return String(valor).slice(0, 10);
}

function obtenerDuracionServicioPorId(servicioId, duracionExplicita) {
  if (Number(duracionExplicita) > 0) return Number(duracionExplicita);
  const srv = leerServiciosLocal().find((s) => String(s.id) === String(servicioId));
  return Number(srv?.duracion_min ?? srv?.duracion) || 30;
}

function normalizarCita(c, index = 0) {
  const hora = normalizarHora(c.hora_inicio ?? c.hora);
  const fecha = normalizarFecha(c.fecha);
  const cliente = String(c.cliente_nombre ?? c.cliente ?? "Cliente");
  const duracion = obtenerDuracionServicioPorId(c.servicio_id, c.duracion_min ?? c.duracion);
  return {
    id: c.id ?? c._id ?? index + 1,
    cliente,
    cliente_nombre: cliente,
    servicio_id: c.servicio_id ?? null,
    servicio: String(c.servicio_nombre ?? c.servicio ?? "Servicio"),
    recurso_id: c.recurso_id ?? c.barbero_id ?? null,
    fecha,
    hora,
    hora_inicio: hora,
    duracion,
    duracion_min: duracion,
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
  const hoy = obtenerFechaLocalISO();
  const inicial = citasHoy.map((c, idx) => normalizarCita({ ...c, fecha: hoy }, idx));
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

function existeSolapamientoHorario(listaCitas, { fecha, hora, duracion, recursoId = null, excluirId = null }) {
  const inicioNueva = horaAMinutos(hora);
  const finNueva = inicioNueva + (Number(duracion) || 30);

  return listaCitas.some((c) => {
    if (excluirId !== null && String(c.id) === String(excluirId)) return false;
    if (c.estado === "cancelada") return false;
    if (c.fecha !== fecha) return false;
    if ((c.recurso_id ?? null) !== (recursoId ?? null)) return false;

    const inicioExistente = horaAMinutos(c.hora);
    const finExistente = inicioExistente + (Number(c.duracion) || 30);
    return inicioNueva < finExistente && finNueva > inicioExistente;
  });
}

export async function obtenerTodasLasCitas() {
  try {
    const respuesta = await fetchConTimeout(CITAS_URL);
    if (!respuesta.ok) {
      return { data: leerCitasLocal(), source: "fallback" };
    }

    const payload = await respuesta.json();
    const lista = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(lista)) {
      return { data: leerCitasLocal(), source: "fallback" };
    }

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
          duracion: item.duracion_min ?? item.duracion ?? srv?.duracion,
        },
        idx
      );
    });

    guardarCitasLocal(normalizadas);
    return { data: normalizadas, source: "api" };
  } catch {
    return { data: leerCitasLocal(), source: "fallback" };
  }
}

export async function obtenerCitasHoy() {
  const hoy = obtenerFechaLocalISO();
  const { data, source } = await obtenerTodasLasCitas();
  const delDia = data
    .filter((c) => c.fecha === hoy)
    .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));
  return { data: delDia, source };
}

export async function crearCita(datos) {
  const actuales = leerCitasLocal();
  const hora = normalizarHora(datos.hora);
  const fecha = normalizarFecha(datos.fecha);
  const duracion = obtenerDuracionServicioPorId(datos.servicio_id, datos.duracion);

  if (
    existeSolapamientoHorario(actuales, {
      fecha,
      hora,
      duracion,
      recursoId: datos.recurso_id ?? null,
    })
  ) {
    throw new Error("Horario no disponible: se solapa con otra cita activa.");
  }

  const bodyAPI = {
    cliente_nombre: String(datos.cliente).trim(),
    servicio_id: datos.servicio_id,
    fecha,
    hora_inicio: hora,
    duracion_min: duracion,
    precio: Number(datos.precio) || 0,
    estado: "pendiente",
  };

  try {
    const respuesta = await fetchConTimeout(CITAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyAPI),
    });

    if (respuesta.status === 409) {
      throw new Error("Horario no disponible: el servidor reportó un conflicto de horario.");
    }

    if (!respuesta.ok) {
      throw new Error(await extraerMensajeError(respuesta, "No se pudo registrar la cita"));
    }

    const creado = await respuesta.json();
    const item = normalizarCita(
      {
        ...(creado?.data || creado),
        cliente: datos.cliente,
        servicio: datos.servicio,
        precio: datos.precio,
        duracion,
      },
      actuales.length
    );
    guardarCitasLocal([...actuales, item]);
    return { data: item, source: "api" };
  } catch (err) {
    if (esErrorDeRed(err)) {
      throw new Error(
        "Sin conexión con el servidor: no se pudo confirmar la reserva. Verifica que el backend esté encendido e inténtalo de nuevo."
      );
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
  const duracion = obtenerDuracionServicioPorId(citaActual.servicio_id, citaActual.duracion);

  if (nuevoEstado === "reprogramada") {
    if (
      existeSolapamientoHorario(actuales, {
        fecha: nuevaFecha,
        hora: nuevaHora,
        duracion,
        recursoId: citaActual.recurso_id ?? null,
        excluirId: citaActual.id,
      })
    ) {
      throw new Error("Horario no disponible: la reprogramación se solapa con otra cita.");
    }
  }

  const bodyAPI =
    nuevoEstado === "reprogramada"
      ? { estado: "reprogramada", fecha: nuevaFecha, hora_inicio: nuevaHora }
      : { estado: nuevoEstado };

  try {
    const respuesta = await fetchConTimeout(
      `${CITAS_URL}/${encodeURIComponent(citaActual.id)}/estado`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyAPI),
      }
    );

    if (respuesta.status === 409) {
      throw new Error("Horario no disponible: el servidor reportó un conflicto de horario.");
    }

    if (!respuesta.ok) {
      throw new Error(await extraerMensajeError(respuesta, "No se pudo actualizar el estado"));
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
    const actualizada = actualizadas.find((c) => String(c.id) === String(citaActual.id));
    return { data: actualizada, source: "api" };
  } catch (err) {
    if (esErrorDeRed(err)) {
      throw new Error(
        "Sin conexión con el servidor: no se pudo guardar el cambio de estado. Inténtalo de nuevo."
      );
    }
    throw err;
  }
}

// -------------------- Resumen del Panel --------------------

function parsearEnteroNoNegativo(valor) {
  if (valor === null || valor === undefined || valor === "" || typeof valor === "boolean") {
    return null;
  }
  const num = Number(valor);
  return Number.isInteger(num) && num >= 0 ? num : null;
}

function parsearMontoNoNegativo(valor) {
  if (valor === null || valor === undefined || valor === "" || typeof valor === "boolean") {
    return null;
  }
  const num = Number(valor);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function calcularResumenLocal() {
  const hoy = obtenerFechaLocalISO();
  const activas = leerCitasLocal().filter(
    (c) => c.fecha === hoy && c.estado !== "cancelada"
  );
  return {
    activas: activas.length,
    confirmadas: activas.filter((c) => c.estado === "confirmada").length,
    pendientes: activas.filter((c) => c.estado === "pendiente").length,
    ingresosEstimados: activas.reduce((sum, c) => sum + (Number(c.precio) || 0), 0),
  };
}

export async function obtenerResumenPanel() {
  try {
    const respuesta = await fetchConTimeout(PANEL_RESUMEN_URL);
    if (!respuesta.ok) {
      return { data: calcularResumenLocal(), source: "fallback" };
    }

    const payload = await respuesta.json();
    const data = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { data: calcularResumenLocal(), source: "fallback" };
    }

    const activas = parsearEnteroNoNegativo(data.activas ?? data.total ?? data.citas_hoy);
    const confirmadas = parsearEnteroNoNegativo(data.confirmadas ?? data.citas_confirmadas);
    const pendientes = parsearEnteroNoNegativo(data.pendientes ?? data.citas_pendientes);
    const ingresosEstimados = parsearMontoNoNegativo(
      data.ingresosEstimados ?? data.ingresos_estimados ?? data.ingresos
    );

    if ([activas, confirmadas, pendientes, ingresosEstimados].some((v) => v === null)) {
      return { data: calcularResumenLocal(), source: "fallback" };
    }

    return {
      data: { activas, confirmadas, pendientes, ingresosEstimados },
      source: "api",
    };
  } catch {
    return { data: calcularResumenLocal(), source: "fallback" };
  }
}

export function obtenerCitasPorPeriodo(periodo) {
  return citasPorPeriodo[periodo];
}