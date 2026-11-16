// ============================================================
// CitaYa — Módulo UI para el catálogo y registro de servicios
// ============================================================

import { obtenerServicios } from "../api.js";
import { formatoCOP } from "./panel.js";

export async function renderServicios() {
  const servicios = await obtenerServicios();
  document.getElementById("servicesGrid").innerHTML = servicios.map((s) => `
    <article class="service-card">
      <div class="service-head">
        <span class="service-icon"><i data-lucide="${s.icon || "scissors"}"></i></span>
        <h3>${s.nombre}</h3>
      </div>
      <p class="service-meta"><i data-lucide="clock"></i>${s.duracion} min</p>
      <p class="service-price">${formatoCOP(Number(s.precio) || 0)}</p>
      <button class="btn-outline" disabled title="Disponible cuando se active la reserva en línea">Agendar</button>
    </article>
  `).join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}