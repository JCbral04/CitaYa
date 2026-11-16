// ============================================================
// CitaYa — Módulo UI para la gestión y listado de citas
// ============================================================

import {
  obtenerCitasHoy,
  obtenerServicios,
  crearCita,
  cambiarEstadoCita,
} from "../api.js";
import { renderIndicadores } from "./panel.js";

const CLASES_ESTADO = {
  confirmada:   "status-confirmada",
  pendiente:    "status-pendiente",
  reprogramada: "status-reprogramada",
  cancelada:    "status-cancelada",
};

const HORA_APERTURA = "08:00";
const HORA_CIERRE = "19:00";

let listaCitas = [];
let listaServiciosActivos = [];
let reprogramandoId = null;
let eventosInicializados = false;

function obtenerHoyISO() {
  return new Date().toLocaleDateString("en-CA");
}

function obtenerHoraActual() {
  const ahora = new Date();
  const hh = String(ahora.getHours()).padStart(2, "0");
  const mm = String(ahora.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function validarFechaHora(fecha, hora) {
  if (!fecha) return "Selecciona una fecha para la cita.";
  if (!hora) return "Selecciona una hora para la cita.";

  const hoy = obtenerHoyISO();
  if (fecha < hoy) {
    return "La fecha no puede ser anterior a hoy.";
  }
  if (hora < HORA_APERTURA || hora > HORA_CIERRE) {
    return `La hora debe estar dentro del horario de atención (${HORA_APERTURA} a ${HORA_CIERRE}).`;
  }
  if (fecha === hoy && hora <= obtenerHoraActual()) {
    return "Para hoy debes elegir una hora futura.";
  }
  return null;
}

function mostrarMensaje(texto, tipo = "success") {
  const box = document.getElementById("apptFeedback");
  if (!box) return;

  box.hidden = false;
  box.className = `form-feedback ${tipo === "error" ? "is-error" : "is-success"}`;
  box.innerHTML = `<i data-lucide="${tipo === "error" ? "alert-circle" : "check-circle-2"}"></i><span>${texto}</span>`;
  if (window.lucide) lucide.createIcons();

  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.hidden = true;
  }, 4500);
}

async function cargarSelectServicios() {
  const select = document.getElementById("apptServicio");
  if (!select) return;

  const todos = await obtenerServicios();
  listaServiciosActivos = todos.filter((s) => s.activo);

  select.innerHTML = listaServiciosActivos.length
    ? listaServiciosActivos
        .map(
          (s) =>
            `<option value="${s.id}">${s.nombre} (${s.duracion} min · $${Number(s.precio).toLocaleString("es-CO")})</option>`
        )
        .join("")
    : '<option value="">No hay servicios activos</option>';
}

function pintarListaCitas() {
  const list = document.getElementById("apptList");
  if (!list) return;

  const ordenadas = [...listaCitas].sort((a, b) =>
    `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
  );

  list.innerHTML = ordenadas.map((c) => {
    const puedeConfirmar = c.estado === "pendiente" || c.estado === "reprogramada";
    const puedeReprogramar = c.estado !== "cancelada";
    const puedeCancelar = c.estado !== "cancelada";
    const enReprogramacion = String(reprogramandoId) === String(c.id);

    return `
      <li class="appt" data-id="${c.id}">
        <span class="appt-time">${c.hora}</span>
        <div class="appt-info">
          <strong>${c.cliente}</strong>
          <span>${c.servicio} · ${c.fecha}</span>
        </div>
        <span class="status ${CLASES_ESTADO[c.estado] || "status-pendiente"}">
          <span class="dot"></span>${c.estado}
        </span>

        ${c.estado !== "cancelada" ? `
          <div class="appt-actions">
            ${puedeConfirmar ? `
              <button type="button" class="btn-sm btn-success" data-appt-action="confirmar" data-id="${c.id}">
                <i data-lucide="check"></i>Confirmar
              </button>
            ` : ""}
            ${puedeReprogramar ? `
              <button type="button" class="btn-sm" data-appt-action="reprogramar" data-id="${c.id}">
                <i data-lucide="calendar-clock"></i>Reprogramar
              </button>
            ` : ""}
            ${puedeCancelar ? `
              <button type="button" class="btn-sm btn-danger" data-appt-action="cancelar" data-id="${c.id}">
                <i data-lucide="x"></i>Cancelar
              </button>
            ` : ""}
          </div>
        ` : ""}

        ${enReprogramacion ? `
          <div class="appt-reschedule-box">
            <div class="appt-reschedule-row">
              <input type="date" id="repFecha-${c.id}" value="${c.fecha}" min="${obtenerHoyISO()}" aria-label="Nueva fecha">
              <input type="time" id="repHora-${c.id}" value="${c.hora}" min="${HORA_APERTURA}" max="${HORA_CIERRE}" aria-label="Nueva hora">
            </div>
            <div class="service-actions">
              <button type="button" class="btn-sm" data-appt-action="save-reprogramar" data-id="${c.id}">
                <i data-lucide="check"></i>Guardar cambio
              </button>
              <button type="button" class="btn-sm" data-appt-action="cancel-reprogramar">Cerrar</button>
            </div>
          </div>
        ` : ""}
      </li>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function configurarEventos() {
  if (eventosInicializados) return;
  eventosInicializados = true;

  const toggleBtn = document.getElementById("toggleApptFormBtn");
  const topbarBtn = document.getElementById("topbarNewApptBtn");
  const cancelBtn = document.getElementById("cancelApptFormBtn");
  const form = document.getElementById("apptForm");
  const list = document.getElementById("apptList");
  const fechaInput = document.getElementById("apptFecha");

  async function abrirFormulario() {
    await cargarSelectServicios();
    if (fechaInput) {
      const hoy = obtenerHoyISO();
      fechaInput.min = hoy;
      if (!fechaInput.value) fechaInput.value = hoy;
    }
    form.hidden = false;
    document.getElementById("apptCliente")?.focus();
  }

  toggleBtn?.addEventListener("click", async () => {
    if (form.hidden) {
      await abrirFormulario();
    } else {
      form.hidden = true;
    }
  });

  topbarBtn?.addEventListener("click", async () => {
    await abrirFormulario();
  });

  cancelBtn?.addEventListener("click", () => {
    form.reset();
    form.hidden = true;
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cliente = document.getElementById("apptCliente").value.trim();
    const servicioId = document.getElementById("apptServicio").value;
    const fecha = document.getElementById("apptFecha").value;
    const hora = document.getElementById("apptHora").value;

    if (cliente.length < 3) {
      mostrarMensaje("Ingresa el nombre del cliente (mínimo 3 caracteres).", "error");
      return;
    }

    const servicioObj = listaServiciosActivos.find(
      (s) => String(s.id) === String(servicioId)
    );
    if (!servicioObj) {
      mostrarMensaje("Selecciona un servicio disponible.", "error");
      return;
    }

    const errorHorario = validarFechaHora(fecha, hora);
    if (errorHorario) {
      mostrarMensaje(errorHorario, "error");
      return;
    }

    try {
      const creada = await crearCita({
        cliente,
        servicio_id: servicioObj.id,
        servicio: servicioObj.nombre,
        precio: servicioObj.precio,
        fecha,
        hora,
      });

      listaCitas.push(creada);
      form.reset();
      form.hidden = true;
      pintarListaCitas();
      await renderIndicadores();
      mostrarMensaje(`Cita agendada para ${creada.cliente} a las ${creada.hora}.`);
    } catch (err) {
      mostrarMensaje(err.message || "No se pudo agendar la cita.", "error");
    }
  });

  list?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-appt-action]");
    if (!btn) return;

    const action = btn.dataset.apptAction;
    const id = btn.dataset.id;

    if (action === "reprogramar") {
      reprogramandoId = String(reprogramandoId) === String(id) ? null : id;
      pintarListaCitas();
      return;
    }

    if (action === "cancel-reprogramar") {
      reprogramandoId = null;
      pintarListaCitas();
      return;
    }

    const actual = listaCitas.find((c) => String(c.id) === String(id));
    if (!actual) return;

    try {
      if (action === "confirmar") {
        const actualizada = await cambiarEstadoCita(actual, "confirmada");
        listaCitas = listaCitas.map((c) =>
          String(c.id) === String(id) ? actualizada : c
        );
        pintarListaCitas();
        await renderIndicadores();
        mostrarMensaje(`Cita de ${actual.cliente} confirmada.`);
      } else if (action === "cancelar") {
        const actualizada = await cambiarEstadoCita(actual, "cancelada");
        listaCitas = listaCitas.map((c) =>
          String(c.id) === String(id) ? actualizada : c
        );
        if (String(reprogramandoId) === String(id)) reprogramandoId = null;
        pintarListaCitas();
        await renderIndicadores();
        mostrarMensaje(`Cita de ${actual.cliente} cancelada.`);
      } else if (action === "save-reprogramar") {
        const nuevaFecha = document.getElementById(`repFecha-${id}`)?.value;
        const nuevaHora = document.getElementById(`repHora-${id}`)?.value;

        const errorHorario = validarFechaHora(nuevaFecha, nuevaHora);
        if (errorHorario) {
          mostrarMensaje(errorHorario, "error");
          return;
        }

        const actualizada = await cambiarEstadoCita(actual, "reprogramada", {
          fecha: nuevaFecha,
          hora: nuevaHora,
        });
        listaCitas = listaCitas.map((c) =>
          String(c.id) === String(id) ? actualizada : c
        );
        reprogramandoId = null;
        pintarListaCitas();
        await renderIndicadores();
        mostrarMensaje(
          `Cita de ${actual.cliente} reprogramada para ${nuevaFecha} a las ${nuevaHora}.`
        );
      }
    } catch (err) {
      mostrarMensaje(err.message || "No se pudo actualizar la cita.", "error");
    }
  });
}

export async function renderCitas() {
  listaCitas = await obtenerCitasHoy();
  await cargarSelectServicios();
  configurarEventos();
  pintarListaCitas();
}