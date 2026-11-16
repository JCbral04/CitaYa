// ============================================================
// CitaYa — Módulo UI para el catálogo y registro de servicios
// ============================================================

import {
  obtenerServicios,
  crearServicio,
  actualizarServicio,
  cambiarEstadoServicio,
} from "../api.js";
import { formatoCOP } from "./panel.js";

let listaServicios = [];
let servicioEditandoId = null;
let eventosInicializados = false;

function mostrarMensaje(texto, tipo = "success") {
  const box = document.getElementById("serviceFeedback");
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

function pintarTarjetas() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  const ordenados = [...listaServicios].sort((a, b) => Number(b.activo) - Number(a.activo));

  grid.innerHTML = ordenados.map((s) => {
    const enEdicion = String(servicioEditandoId) === String(s.id);
    return `
      <article class="service-card ${s.activo ? "" : "is-inactive"}" data-id="${s.id}">
        <div class="service-head">
          <span class="service-icon"><i data-lucide="${s.icon || "scissors"}"></i></span>
          <h3>${s.nombre}</h3>
        </div>
        <p class="service-meta">
          <i data-lucide="clock"></i>${s.duracion} min
          ${s.activo ? "" : '<span class="status status-cancelada"><span class="dot"></span>Inactivo</span>'}
        </p>
        <p class="service-price">${formatoCOP(Number(s.precio) || 0)}</p>

        <button class="btn-outline" disabled title="Disponible cuando se active la reserva en línea">
          ${s.activo ? "Agendar" : "No disponible"}
        </button>

        <div class="service-actions">
          <button type="button" class="btn-sm" data-action="edit" data-id="${s.id}">
            <i data-lucide="pencil"></i>Editar
          </button>
          <button type="button" class="btn-sm ${s.activo ? "btn-danger" : ""}" data-action="toggle" data-id="${s.id}">
            <i data-lucide="${s.activo ? "ban" : "rotate-ccw"}"></i>${s.activo ? "Desactivar" : "Reactivar"}
          </button>
        </div>

        ${enEdicion ? `
          <div class="service-edit-box">
            <div class="service-edit-row">
              <input type="number" id="editDuracion-${s.id}" value="${s.duracion}" min="5" max="480" step="5" aria-label="Nueva duración en minutos">
              <input type="number" id="editPrecio-${s.id}" value="${s.precio}" min="1000" step="500" aria-label="Nuevo precio en pesos">
            </div>
            <div class="service-actions">
              <button type="button" class="btn-sm" data-action="save-edit" data-id="${s.id}">
                <i data-lucide="check"></i>Guardar
              </button>
              <button type="button" class="btn-sm" data-action="cancel-edit">Cancelar</button>
            </div>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function configurarEventos() {
  if (eventosInicializados) return;
  eventosInicializados = true;

  const toggleBtn = document.getElementById("toggleServiceFormBtn");
  const cancelBtn = document.getElementById("cancelServiceFormBtn");
  const form = document.getElementById("serviceForm");
  const grid = document.getElementById("servicesGrid");

  toggleBtn?.addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) document.getElementById("srvNombre")?.focus();
  });

  cancelBtn?.addEventListener("click", () => {
    form.reset();
    form.hidden = true;
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("srvNombre").value.trim();
    const duracion = Number(document.getElementById("srvDuracion").value);
    const precio = Number(document.getElementById("srvPrecio").value);
    const icon = document.getElementById("srvIcon").value || "scissors";

    if (nombre.length < 3) {
      mostrarMensaje("El nombre del servicio debe tener al menos 3 caracteres.", "error");
      return;
    }
    if (listaServicios.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
      mostrarMensaje("Ya existe un servicio registrado con ese nombre.", "error");
      return;
    }
    if (!Number.isFinite(duracion) || duracion < 5 || duracion > 480) {
      mostrarMensaje("Ingresa una duración válida entre 5 y 480 minutos.", "error");
      return;
    }
    if (!Number.isFinite(precio) || precio < 1000) {
      mostrarMensaje("El precio debe ser mayor o igual a $1.000 COP.", "error");
      return;
    }

    const creado = await crearServicio({ nombre, duracion, precio, icon });
    listaServicios.push(creado);
    form.reset();
    form.hidden = true;
    pintarTarjetas();
    mostrarMensaje(`Servicio "${creado.nombre}" registrado correctamente.`);
  });

  grid?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "edit") {
      servicioEditandoId = String(servicioEditandoId) === String(id) ? null : id;
      pintarTarjetas();
    } else if (action === "cancel-edit") {
      servicioEditandoId = null;
      pintarTarjetas();
    } else if (action === "save-edit") {
      const actual = listaServicios.find((s) => String(s.id) === String(id));
      if (!actual) return;

      const nuevaDuracion = Number(document.getElementById(`editDuracion-${id}`)?.value);
      const nuevoPrecio = Number(document.getElementById(`editPrecio-${id}`)?.value);

      if (!Number.isFinite(nuevaDuracion) || nuevaDuracion < 5 || nuevaDuracion > 480) {
        mostrarMensaje("La duración debe estar entre 5 y 480 minutos.", "error");
        return;
      }
      if (!Number.isFinite(nuevoPrecio) || nuevoPrecio < 1000) {
        mostrarMensaje("El precio debe ser mayor o igual a $1.000 COP.", "error");
        return;
      }

      await actualizarServicio(actual, { duracion: nuevaDuracion, precio: nuevoPrecio });
      listaServicios = listaServicios.map((s) =>
        String(s.id) === String(id)
          ? { ...s, duracion: nuevaDuracion, duracion_min: nuevaDuracion, precio: nuevoPrecio }
          : s
      );
      servicioEditandoId = null;
      pintarTarjetas();
      mostrarMensaje("Precio y duración actualizados correctamente.");
    } else if (action === "toggle") {
      const actual = listaServicios.find((s) => String(s.id) === String(id));
      if (!actual) return;
      const nuevoEstado = !actual.activo;

      await cambiarEstadoServicio(actual, nuevoEstado);
      listaServicios = listaServicios.map((s) =>
        String(s.id) === String(id) ? { ...s, activo: nuevoEstado } : s
      );
      pintarTarjetas();
      mostrarMensaje(
        nuevoEstado
          ? `Servicio "${actual.nombre}" reactivado.`
          : `Servicio "${actual.nombre}" desactivado correctamente.`
      );
    }
  });
}

export async function renderServicios() {
  listaServicios = await obtenerServicios();
  configurarEventos();
  pintarTarjetas();
}