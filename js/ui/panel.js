// ============================================================
// CitaYa — Módulo UI del panel del día (indicadores y gráfica)
// ============================================================

import { obtenerCitasHoy, obtenerCitasPorPeriodo } from "../api.js";

export const formatoCOP = (valor) => "$" + valor.toLocaleString("es-CO");

export async function renderIndicadores() {
  const citas = await obtenerCitasHoy();
  const activas = citas.filter((c) => c.estado !== "cancelada");
  const indicadores = [
    {
      icono: "calendar-days", tinte: "blue",
      titulo: "Citas de hoy",
      valor: activas.length,
      detalle: "activas en la agenda",
    },
    {
      icono: "check-circle-2", tinte: "emerald",
      titulo: "Confirmadas",
      valor: activas.filter((c) => c.estado === "confirmada").length,
      detalle: "listas para atender",
    },
    {
      icono: "clock", tinte: "amber",
      titulo: "Pendientes",
      valor: activas.filter((c) => c.estado === "pendiente").length,
      detalle: "por confirmar",
    },
    {
      icono: "wallet", tinte: "sky",
      titulo: "Ingresos estimados",
      valor: formatoCOP(activas.reduce((sum, c) => sum + (Number(c.precio) || 0), 0)),
      detalle: "ingresos del día",
    },
  ];

  document.getElementById("statsGrid").innerHTML = indicadores.map((i) => `
    <article class="stat-card">
      <div class="stat-top">
        <span class="stat-icon ${i.tinte}"><i data-lucide="${i.icono}"></i></span>
        <div>
          <p class="stat-label">${i.titulo}</p>
          <p class="stat-value">${i.valor}</p>
        </div>
      </div>
      <p class="stat-foot">${i.detalle}</p>
    </article>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

let chartCitas;

export function renderGrafica(periodo) {
  const config = obtenerCitasPorPeriodo(periodo);
  if (chartCitas) chartCitas.destroy();

  chartCitas = new Chart(document.getElementById("chartCitas"), {
    type: "bar",
    data: {
      labels: config.labels,
      datasets: [{
        label: "Citas",
        data: config.data,
        backgroundColor: "#2563EB",
        hoverBackgroundColor: "#1D4ED8",
        borderRadius: 6,
        maxBarThickness: 44,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#64748B", font: { family: "Inter", size: 12 } },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: "#F1F5F9" },
          ticks: { color: "#64748B", stepSize: 1, font: { family: "Inter", size: 12 } },
        },
      },
    },
  });
}

export function inicializarGrafica() {
  renderGrafica("week");
  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".seg-btn.active").classList.remove("active");
      btn.classList.add("active");
      renderGrafica(btn.dataset.period);
    });
  });
}