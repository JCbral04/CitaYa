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

async function init() {
  inicializarSidebar();
  inicializarGrafica();

  const modulos = [
    ["indicadores", renderIndicadores()],
    ["citas", renderCitas()],
    ["servicios", renderServicios()],
  ];

  const resultados = await Promise.allSettled(modulos.map(([, promesa]) => promesa));
  resultados.forEach((res, idx) => {
    if (res.status === "rejected") {
      console.error(`Error al inicializar módulo "${modulos[idx][0]}":`, res.reason);
    }
  });

  if (window.lucide) lucide.createIcons();
}

init();