// ============================================================
// CitaYa — Lógica e interactividad del prototipo
// ============================================================

const CLASES_ESTADO = {
  confirmada:   "status-confirmada",
  pendiente:    "status-pendiente",
  reprogramada: "status-reprogramada",
  cancelada:    "status-cancelada",
};

const formatoCOP = (valor) => "$" + valor.toLocaleString("es-CO");

// ---------- Indicadores del panel del día ----------
function renderIndicadores() {
  const activas = citasHoy.filter((c) => c.estado !== "cancelada");
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
      valor: formatoCOP(activas.reduce((sum, c) => sum + c.precio, 0)),
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
}

// ---------- Listado de próximas citas ----------
function renderCitas() {
  document.getElementById("apptList").innerHTML = citasHoy.map((c) => `
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

// ---------- Catálogo de servicios ----------
function renderServicios() {
  document.getElementById("servicesGrid").innerHTML = servicios.map((s) => `
    <article class="service-card">
      <div class="service-head">
        <span class="service-icon"><i data-lucide="${s.icon}"></i></span>
        <h3>${s.nombre}</h3>
      </div>
      <p class="service-meta"><i data-lucide="clock"></i>${s.duracion} min</p>
      <p class="service-price">${formatoCOP(s.precio)}</p>
      <button class="btn-outline" disabled title="Disponible cuando se active la reserva en línea">Agendar</button>
    </article>
  `).join("");
}

// ---------- Gráfica interactiva con cambio de periodo ----------
let chartCitas;

function renderGrafica(periodo) {
  const config = citasPorPeriodo[periodo];
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

document.querySelectorAll(".seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".seg-btn.active").classList.remove("active");
    btn.classList.add("active");
    renderGrafica(btn.dataset.period);
  });
});

// ---------- Sidebar móvil ----------
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");

function cerrarSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
});
overlay.addEventListener("click", cerrarSidebar);
document.querySelectorAll(".nav-item").forEach((link) =>
  link.addEventListener("click", cerrarSidebar)
);

// ---------- Inicialización ----------
renderIndicadores();
renderCitas();
renderServicios();
renderGrafica("week");
lucide.createIcons();