// ============================================================
// CitaYa — Módulo UI del catálogo de servicios (renderizado seguro)
// ============================================================

import { obtenerServicios } from "../api.js";
import { formatoCOP } from "./panel.js";

const ICONOS_PERMITIDOS = new Set(["scissors", "brush", "sparkles", "hand"]);

function crearIconoLucide(nombre) {
  const iconoSeguro = ICONOS_PERMITIDOS.has(nombre) ? nombre : "scissors";
  const i = document.createElement("i");
  i.setAttribute("data-lucide", iconoSeguro);
  return i;
}

function mostrarAvisoOrigen(source) {
  const seccion = document.getElementById("servicios");
  if (!seccion) return;

  let aviso = document.getElementById("servicesSourceNotice");
  if (source !== "fallback") {
    if (aviso) aviso.remove();
    return;
  }

  if (!aviso) {
    aviso = document.createElement("p");
    aviso.id = "servicesSourceNotice";
    aviso.className = "card-sub";
    aviso.style.marginBottom = "14px";
    const grid = document.getElementById("servicesGrid");
    seccion.insertBefore(aviso, grid);
  }
  aviso.textContent = "Mostrando catálogo local de respaldo (sin conexión con la API).";
}

function crearTarjetaServicio(s) {
  const card = document.createElement("article");
  card.className = "service-card";
  card.setAttribute("data-id", String(s.id));

  const head = document.createElement("div");
  head.className = "service-head";

  const iconWrap = document.createElement("span");
  iconWrap.className = "service-icon";
  iconWrap.appendChild(crearIconoLucide(s.icon));

  const titulo = document.createElement("h3");
  titulo.textContent = s.nombre;

  head.append(iconWrap, titulo);

  const meta = document.createElement("p");
  meta.className = "service-meta";
  const clockIcon = document.createElement("i");
  clockIcon.setAttribute("data-lucide", "clock");
  meta.append(clockIcon, document.createTextNode(`${s.duracion} min`));

  const precio = document.createElement("p");
  precio.className = "service-price";
  precio.textContent = formatoCOP(Number(s.precio) || 0);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-outline";
  btn.disabled = !s.activo;
  btn.textContent = s.activo ? "Disponible" : "No disponible";

  card.append(head, meta, precio, btn);
  return card;
}

export async function renderServicios() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  const { data: servicios, source } = await obtenerServicios();
  mostrarAvisoOrigen(source);

  grid.replaceChildren();

  if (servicios.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "card-sub";
    vacio.textContent = "No hay servicios registrados en este momento.";
    grid.appendChild(vacio);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const servicio of servicios) {
    fragment.appendChild(crearTarjetaServicio(servicio));
  }
  grid.appendChild(fragment);

  if (window.lucide) lucide.createIcons();
}