// ============================================================
// CitaYa — Módulo UI para la gestión y listado de citas
// ============================================================

import { obtenerCitasHoy } from "../api.js";

const CLASES_ESTADO = {
  confirmada:   "status-confirmada",
  pendiente:    "status-pendiente",
  reprogramada: "status-reprogramada",
  cancelada:    "status-cancelada",
};

export function renderCitas() {
  const citas = obtenerCitasHoy();
  document.getElementById("apptList").innerHTML = citas.map((c) => `
    <li class="appt">
      <span class="appt-time">${c.hora}</span>
      <div class="appt-info">
        <strong>${c.cliente}</strong>
        <span>${c.servicio}</span>
      </div>
      <span class="status ${CLASES_ESTADO[c.estado]}"><span class="dot"></span>${c.estado}</span>
    </li>
  `).join("");
}