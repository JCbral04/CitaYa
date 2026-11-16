// ============================================================
// CitaYa — Módulo UI de citas del día y gestión de estados
// ============================================================

import {
  obtenerCitasHoy,
  obtenerServicios,
  crearCita,
  cambiarEstadoCita,
  obtenerFechaLocalISO,
} from "../api.js";
import { renderIndicadores } from "./panel.js";

const APERTURA_MIN = 8 * 60;  // 08:00
const CIERRE_MIN = 19 * 60;   // 19:00
const ESTADOS_PERMITIDOS = new Set(["pendiente", "confirmada", "reprogramada", "cancelada"]);

let listaCitas = [];
let serviciosDisponibles = [];
let reprogramandoId = null;
let eventosInicializados = false;
let procesandoCita = false;

function horaAMinutos(horaStr) {
  const [h, m] = String(horaStr || "").slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function crearIconoLucide(nombre) {
  const i = document.createElement("i");
  i.setAttribute("data-lucide", nombre);
  return i;
}

function mostrarMensaje(texto, tipo = "success") {
  const box = document.getElementById("appointmentFeedback");
  if (!box) return;

  box.hidden = false;
  box.className = `form-feedback ${tipo === "error" ? "is-error" : "is-success"}`;

  const span = document.createElement("span");
  span.textContent = texto;

  box.replaceChildren(
    crearIconoLucide(tipo === "error" ? "alert-circle" : "check-circle-2"),
    span
  );

  if (window.lucide) lucide.createIcons();

  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.hidden = true;
  }, 4500);
}

function mostrarAvisoOrigen(source) {
  const list = document.getElementById("appointmentsList");
  const parent = list?.parentElement;
  if (!parent) return;

  let aviso = document.getElementById("appointmentsSourceNotice");
  if (source !== "fallback") {
    if (aviso) aviso.remove();
    return;
  }

  if (!aviso) {
    aviso = document.createElement("p");
    aviso.id = "appointmentsSourceNotice";
    aviso.className = "card-sub";
    aviso.style.marginBottom = "10px";
    parent.insertBefore(aviso, list);
  }
  aviso.textContent = "Mostrando agenda local de respaldo (sin conexión con la API).";
}

function validarFechaHora(fecha, hora, duracionMin = 30) {
  if (!fecha || !hora) {
    return "Selecciona fecha y hora válidas.";
  }

  const hoy = obtenerFechaLocalISO();
  if (fecha < hoy) {
    return "No se pueden agendar citas en fechas pasadas.";
  }

  const inicioMin = horaAMinutos(hora);
  if (!Number.isFinite(inicioMin)) {
    return "La hora seleccionada no es válida.";
  }

  const duracion = Number(duracionMin) || 30;
  const finMin = inicioMin + duracion;

  if (inicioMin < APERTURA_MIN || inicioMin >= CIERRE_MIN) {
    return "El horario de atención es de 08:00 a 19:00.";
  }

  if (finMin > CIERRE_MIN) {
    return `El servicio (${duracion} min) termina después del cierre de las 19:00.`;
  }

  if (fecha === hoy) {
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    if (inicioMin <= minutosActuales) {
      return "La hora de la cita debe ser posterior a la hora actual.";
    }
  }

  return null;
}

function crearBotonAccion(accion, idSeguro, texto, variante = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-sm${variante ? ` ${variante}` : ""}`;
  btn.setAttribute("data-appt-action", accion);
  btn.setAttribute("data-id", idSeguro);
  btn.disabled = procesandoCita;
  btn.textContent = texto;
  return btn;
}

function crearItemCita(c) {
  const idSeguro = String(c.id);
  const estadoSeguro = ESTADOS_PERMITIDOS.has(c.estado) ? c.estado : "pendiente";
  const enReprogramacion = String(reprogramandoId) === idSeguro;

  const li = document.createElement("li");
  li.className = "appt";
  li.setAttribute("data-id", idSeguro);

  const timeSpan = document.createElement("span");
  timeSpan.className = "appt-time";
  timeSpan.textContent = c.hora;

  const infoDiv = document.createElement("div");
  infoDiv.className = "appt-info";

  const clienteStrong = document.createElement("strong");
  clienteStrong.textContent = c.cliente;

  const detalleSpan = document.createElement("span");
  detalleSpan.textContent = `${c.servicio} · ${c.fecha}`;

  infoDiv.append(clienteStrong, detalleSpan);

  const statusSpan = document.createElement("span");
  statusSpan.className = `status status-${estadoSeguro}`;
  const dot = document.createElement("span");
  dot.className = "dot";
  statusSpan.append(dot, document.createTextNode(estadoSeguro));

  li.append(timeSpan, infoDiv, statusSpan);

  if (estadoSeguro !== "cancelada") {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "appt-actions";

    if (estadoSeguro === "pendiente" || estadoSeguro === "reprogramada") {
      actionsDiv.appendChild(crearBotonAccion("confirmar", idSeguro, "Confirmar", "btn-success"));
    }
    actionsDiv.appendChild(crearBotonAccion("reprogramar", idSeguro, "Reprogramar"));
    actionsDiv.appendChild(crearBotonAccion("cancelar", idSeguro, "Cancelar", "btn-danger"));

    li.appendChild(actionsDiv);
  }

  if (enReprogramacion) {
    const box = document.createElement("div");
    box.className = "appt-reschedule-box";

    const row = document.createElement("div");
    row.className = "appt-reschedule-row";

    const inputFecha = document.createElement("input");
    inputFecha.type = "date";
    inputFecha.id = `reprogFecha-${idSeguro}`;
    inputFecha.value = c.fecha;
    inputFecha.min = obtenerFechaLocalISO();
    inputFecha.setAttribute("aria-label", "Nueva fecha");

    const inputHora = document.createElement("input");
    inputHora.type = "time";
    inputHora.id = `reprogHora-${idSeguro}`;
    inputHora.value = c.hora;
    inputHora.min = "08:00";
    inputHora.max = "19:00";
    inputHora.setAttribute("aria-label", "Nueva hora");

    row.append(inputFecha, inputHora);

    const rowActions = document.createElement("div");
    rowActions.className = "appt-actions";
    rowActions.append(
      crearBotonAccion("guardar-reprog", idSeguro, "Guardar", "btn-success"),
      crearBotonAccion("cancelar-reprog", idSeguro, "Cerrar")
    );

    box.append(row, rowActions);
    li.appendChild(box);
  }

  return li;
}

function pintarListaCitas() {
  const list = document.getElementById("appointmentsList");
  if (!list) return;

  list.replaceChildren();

  if (listaCitas.length === 0) {
    const empty = document.createElement("li");
    empty.className = "appt";
    const span = document.createElement("span");
    span.className = "card-sub";
    span.textContent = "No hay citas programadas para hoy.";
    empty.appendChild(span);
    list.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const cita of listaCitas) {
    fragment.appendChild(crearItemCita(cita));
  }
  list.appendChild(fragment);
}

function cargarSelectServicios() {
  const select = document.getElementById("apptServicio");
  if (!select) return;

  const activos = serviciosDisponibles.filter((s) => s.activo !== false);
  select.replaceChildren();

  for (const s of activos) {
    const option = document.createElement("option");
    option.value = String(s.id);
    option.textContent = `${s.nombre} (${s.duracion} min)`;
    select.appendChild(option);
  }
}

async function refrescarCitas() {
  const { data, source } = await obtenerCitasHoy();
  listaCitas = data;
  mostrarAvisoOrigen(source);
  pintarListaCitas();
}

function configurarEventos() {
  if (eventosInicializados) return;
  eventosInicializados = true;

  const openBtn = document.getElementById("openAppointmentFormBtn");
  const cancelBtn = document.getElementById("cancelAppointmentFormBtn");
  const form = document.getElementById("appointmentForm");
  const submitBtn = form?.querySelector('button[type="submit"]');
  const list = document.getElementById("appointmentsList");

  const abrirFormulario = async () => {
    const { data } = await obtenerServicios();
    serviciosDisponibles = data;
    cargarSelectServicios();
    const fechaInput = document.getElementById("apptFecha");
    if (fechaInput) {
      const hoy = obtenerFechaLocalISO();
      fechaInput.min = hoy;
      if (!fechaInput.value) fechaInput.value = hoy;
    }
    form.hidden = false;
    document.getElementById("apptCliente")?.focus();
  };

  openBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    abrirFormulario();
  });

  cancelBtn?.addEventListener("click", () => {
    form.reset();
    form.hidden = true;
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (procesandoCita) return;

    const cliente = document.getElementById("apptCliente").value.trim();
    const servicioId = document.getElementById("apptServicio").value;
    const fecha = document.getElementById("apptFecha").value;
    const hora = document.getElementById("apptHora").value;

    if (cliente.length < 2) {
      mostrarMensaje("Ingresa el nombre del cliente (mínimo 2 caracteres).", "error");
      return;
    }

    const servicioObj = serviciosDisponibles.find((s) => String(s.id) === String(servicioId));
    if (!servicioObj) {
      mostrarMensaje("Selecciona un servicio válido.", "error");
      return;
    }

    const errorFechaHora = validarFechaHora(fecha, hora, servicioObj.duracion);
    if (errorFechaHora) {
      mostrarMensaje(errorFechaHora, "error");
      return;
    }

    procesandoCita = true;
    if (submitBtn) submitBtn.disabled = true;

    try {
      await crearCita({
        cliente,
        servicio_id: servicioObj.id,
        servicio: servicioObj.nombre,
        duracion: servicioObj.duracion,
        fecha,
        hora,
        precio: servicioObj.precio,
      });

      form.reset();
      form.hidden = true;
      await refrescarCitas();
      await renderIndicadores();
      mostrarMensaje(`Cita agendada para ${cliente} el ${fecha} a las ${hora}.`);
    } catch (err) {
      mostrarMensaje(err.message || "No se pudo agendar la cita.", "error");
    } finally {
      procesandoCita = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  list?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-appt-action]");
    if (!btn || procesandoCita) return;

    const action = btn.dataset.apptAction;
    const id = btn.dataset.id;

    if (action === "reprogramar") {
      reprogramandoId = String(reprogramandoId) === String(id) ? null : id;
      pintarListaCitas();
      return;
    }

    if (action === "cancelar-reprog") {
      reprogramandoId = null;
      pintarListaCitas();
      return;
    }

    const citaActual = listaCitas.find((c) => String(c.id) === String(id));
    if (!citaActual) return;

    if (action === "confirmar" || action === "cancelar") {
      const nuevoEstado = action === "confirmar" ? "confirmada" : "cancelada";
      procesandoCita = true;
      pintarListaCitas();

      try {
        await cambiarEstadoCita(citaActual, nuevoEstado);
        if (String(reprogramandoId) === String(id)) reprogramandoId = null;
        await refrescarCitas();
        await renderIndicadores();
        mostrarMensaje(
          `Cita de ${citaActual.cliente} marcada como ${nuevoEstado}.`
        );
      } catch (err) {
        mostrarMensaje(err.message || "No se pudo actualizar la cita.", "error");
      } finally {
        procesandoCita = false;
        pintarListaCitas();
      }
      return;
    }

    if (action === "guardar-reprog") {
      const nuevaFecha = document.getElementById(`reprogFecha-${id}`)?.value;
      const nuevaHora = document.getElementById(`reprogHora-${id}`)?.value;

      const errorFechaHora = validarFechaHora(nuevaFecha, nuevaHora, citaActual.duracion);
      if (errorFechaHora) {
        mostrarMensaje(errorFechaHora, "error");
        return;
      }

      procesandoCita = true;
      pintarListaCitas();

      try {
        await cambiarEstadoCita(citaActual, "reprogramada", {
          fecha: nuevaFecha,
          hora: nuevaHora,
        });
        reprogramandoId = null;
        await refrescarCitas();
        await renderIndicadores();
        mostrarMensaje(
          `Cita de ${citaActual.cliente} reprogramada para ${nuevaFecha} a las ${nuevaHora}.`
        );
      } catch (err) {
        mostrarMensaje(err.message || "No se pudo reprogramar la cita.", "error");
      } finally {
        procesandoCita = false;
        pintarListaCitas();
      }
    }
  });
}

export async function renderCitas() {
  const [citasRes, serviciosRes] = await Promise.all([
    obtenerCitasHoy(),
    obtenerServicios(),
  ]);
  listaCitas = citasRes.data;
  serviciosDisponibles = serviciosRes.data;
  mostrarAvisoOrigen(citasRes.source);
  cargarSelectServicios();
  configurarEventos();
  pintarListaCitas();
}