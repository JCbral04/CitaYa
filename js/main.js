// ============================================================
// CitaYa — Punto de entrada principal (Módulos ES)
// ============================================================

import { renderIndicadores, inicializarGrafica } from "./ui/panel.js";
import { renderCitas } from "./ui/citas.js";
import { renderServicios } from "./ui/servicios.js";

function inicializarSidebar() {
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
}

function init() {
  inicializarSidebar();
  renderIndicadores();
  renderCitas();
  inicializarGrafica();

  if (window.lucide) lucide.createIcons();

  renderServicios().catch((error) => {
    console.error("Error al renderizar servicios:", error);
  });
}

init();