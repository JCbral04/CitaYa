// ============================================================
// CitaYa — Módulo UI del catálogo y CRUD visual de servicios
// ============================================================

import {
  obtenerServicios,
  crearServicio,
  actualizarServicio,
  cambiarEstadoServicio,
} from "../api.js";
import { formatoCOP } from "./panel.js";

const ICONOS_PERMITIDOS = new Set(["scissors", "brush", "sparkles", "hand"]);

let listaServicios = [];
let editandoId = null;
let eventosInicializados = false;
let procesando = false;

function crearIconoLucide(nombre, fallback = "scissors") {
  const iconoSeguro = ICONOS_PERMITIDOS.has(nombre) ? nombre : fallback;
  const i = document.createElement("i");
  i.setAttribute("data-lucide", iconoSeguro);
  return i;
}

function validarNumeroEntero(valor, { min, max, paso, etiqueta }) {
  if (!Number.isInteger(valor) || valor < min || (max !== undefined && valor > max)) {
    return `${etiqueta} debe ser un número entero entre ${min}${max !== undefined ? ` y ${max}` : ""}.`;
  }
  if (paso && valor % paso !== 0) {
    return `${etiqueta} debe ser múltiplo de ${paso}.`;
  }
  return null;
}

function mostrarMensaje(texto, tipo = "success") {
  const box = document.getElementById("serviceFeedback");
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
  aviso.textContent = "Modo sin conexión (solo lectura): mostrando catálogo local de respaldo.";
}

function crearTarjetaServicio(s) {
  const idSeguro = String(s.id);
  const enEdicion = String(editandoId) === idSeguro;

  const card = document.createElement("article");
  card.className = `service-card${s.activo ? "" : " is-inactive"}`;
  card.setAttribute("data-id", idSeguro);

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
  meta.append(
    crearIconoLucide("clock", "clock"),
    document.createTextNode(`${s.duracion} min`)
  );

  const precio = document.createElement("p");
  precio.className = "service-price";
  precio.textContent = formatoCOP(Number(s.precio) || 0);

  const btnEstado = document.createElement("button");
  btnEstado.type = "button";
  btnEstado.className = "btn-outline";
  btnEstado.disabled = !s.activo;
  btnEstado.textContent = s.activo ? "Disponible" : "Inactivo";

  card.append(head, meta, precio, btnEstado);

  const actions = document.createElement("div");
  actions.className = "service-actions";

  const btnEdit = document.createElement("button");
  btnEdit.type = "button";
  btnEdit.className = "btn-sm";
  btnEdit.setAttribute("data-srv-action", "edit");
  btnEdit.setAttribute("data-id", idSeguro);
  btnEdit.disabled = procesando;
  btnEdit.append(crearIconoLucide("pencil", "pencil"), document.createTextNode("Editar"));

  const btnToggle = document.createElement("button");
  btnToggle.type = "button";
  btnToggle.className = `btn-sm ${s.activo ? "btn-danger" : "btn-success"}`;
  btnToggle.setAttribute("data-srv-action", "toggle");
  btnToggle.setAttribute("data-id", idSeguro);
  btnToggle.disabled = procesando;
  btnToggle.append(
    crearIconoLucide(s.activo ? "eye-off" : "rotate-ccw", "pencil"),
    document.createTextNode(s.activo ? "Desactivar" : "Reactivar")
  );

  actions.append(btnEdit, btnToggle);
  card.appendChild(actions);

  if (enEdicion) {
    const editBox = document.createElement("div");
    editBox.className = "service-edit-box";

    const editRow = document.createElement("div");
    editRow.className = "service-edit-row";

    const inputDur = document.createElement("input");
    inputDur.type = "number";
    inputDur.id = `editDur-${idSeguro}`;
    inputDur.value = String(s.duracion);
    inputDur.min = "5";
    inputDur.max = "480";
    inputDur.step = "5";
    inputDur.setAttribute("aria-label", "Nueva duración en minutos");

    const inputPrecio = document.createElement("input");
    inputPrecio.type = "number";
    inputPrecio.id = `editPrecio-${idSeguro}`;
    inputPrecio.value = String(s.precio);
    inputPrecio.min = "1000";
    inputPrecio.step = "500";
    inputPrecio.setAttribute("aria-label", "Nuevo precio en COP");

    editRow.append(inputDur, inputPrecio);

    const editActions = document.createElement("div");
    editActions.className = "service-actions";

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn-sm btn-success";
    btnSave.setAttribute("data-srv-action", "save-edit");
    btnSave.setAttribute("data-id", idSeguro);
    btnSave.disabled = procesando;
    btnSave.append(crearIconoLucide("check", "check"), document.createTextNode("Guardar"));

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "btn-sm";
    btnCancel.setAttribute("data-srv-action", "cancel-edit");
    btnCancel.disabled = procesando;
    btnCancel.textContent = "Cancelar";

    editActions.append(btnSave, btnCancel);
    editBox.append(editRow, editActions);
    card.appendChild(editBox);
  }

  return card;
}

function pintarTarjetas() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  grid.replaceChildren();

  if (listaServicios.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "card-sub";
    vacio.textContent = "No hay servicios registrados en este momento.";
    grid.appendChild(vacio);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const servicio of listaServicios) {
    fragment.appendChild(crearTarjetaServicio(servicio));
  }
  grid.appendChild(fragment);

  if (window.lucide) lucide.createIcons();
}

function configurarEventos() {
  if (eventosInicializados) return;
  eventosInicializados = true;

  const toggleBtn = document.getElementById("toggleServiceFormBtn");
  const cancelBtn = document.getElementById("cancelServiceFormBtn");
  const form = document.getElementById("serviceForm");
  const submitBtn = form?.querySelector('button[type="submit"]');
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
    if (procesando) return;

    const nombre = document.getElementById("srvNombre").value.trim();
    const duracion = Number(document.getElementById("srvDuracion").value);
    const precio = Number(document.getElementById("srvPrecio").value);
    const icon = document.getElementById("srvIcon").value;

    if (nombre.length < 3) {
      mostrarMensaje("El nombre del servicio debe tener al menos 3 caracteres.", "error");
      return;
    }

    const errDuracion = validarNumeroEntero(duracion, {
      min: 5,
      max: 480,
      paso: 5,
      etiqueta: "La duración",
    });
    if (errDuracion) {
      mostrarMensaje(errDuracion, "error");
      return;
    }

    const errPrecio = validarNumeroEntero(precio, {
      min: 1000,
      paso: 500,
      etiqueta: "El precio",
    });
    if (errPrecio) {
      mostrarMensaje(errPrecio, "error");
      return;
    }

    procesando = true;
    if (submitBtn) submitBtn.disabled = true;

    try {
      const { data: creado } = await crearServicio({ nombre, duracion, precio, icon });
      listaServicios.push(creado);
      form.reset();
      form.hidden = true;
      pintarTarjetas();
      mostrarMensaje(`Servicio "${creado.nombre}" registrado correctamente.`);
    } catch (error) {
      mostrarMensaje(error.message || "No se pudo registrar el servicio.", "error");
    } finally {
      procesando = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  grid?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-srv-action]");
    if (!btn || procesando) return;

    const action = btn.dataset.srvAction;
    const id = btn.dataset.id;

    if (action === "edit") {
      editandoId = String(editandoId) === String(id) ? null : id;
      pintarTarjetas();
      return;
    }

    if (action === "cancel-edit") {
      editandoId = null;
      pintarTarjetas();
      return;
    }

    const actual = listaServicios.find((s) => String(s.id) === String(id));
    if (!actual) return;

    if (action === "save-edit") {
      const nuevaDuracion = Number(document.getElementById(`editDur-${id}`)?.value);
      const nuevoPrecio = Number(document.getElementById(`editPrecio-${id}`)?.value);

      const errDuracion = validarNumeroEntero(nuevaDuracion, {
        min: 5,
        max: 480,
        paso: 5,
        etiqueta: "La duración",
      });
      if (errDuracion) {
        mostrarMensaje(errDuracion, "error");
        return;
      }

      const errPrecio = validarNumeroEntero(nuevoPrecio, {
        min: 1000,
        paso: 500,
        etiqueta: "El precio",
      });
      if (errPrecio) {
        mostrarMensaje(errPrecio, "error");
        return;
      }

      procesando = true;
      pintarTarjetas();

      try {
        const { data: actualizado } = await actualizarServicio(actual, {
          duracion: nuevaDuracion,
          precio: nuevoPrecio,
        });
        listaServicios = listaServicios.map((s) =>
          String(s.id) === String(id) ? actualizado : s
        );
        editandoId = null;
        mostrarMensaje(`Servicio "${actual.nombre}" actualizado correctamente.`);
      } catch (error) {
        mostrarMensaje(error.message || "No se pudo actualizar el servicio.", "error");
      } finally {
        procesando = false;
        pintarTarjetas();
      }
      return;
    }

    if (action === "toggle") {
      const nuevoEstado = !actual.activo;
      procesando = true;
      pintarTarjetas();

      try {
        const { data: actualizado } = await cambiarEstadoServicio(actual, nuevoEstado);
        listaServicios = listaServicios.map((s) =>
          String(s.id) === String(id) ? actualizado : s
        );
        if (!nuevoEstado && String(editandoId) === String(id)) {
          editandoId = null;
        }
        mostrarMensaje(
          `Servicio "${actual.nombre}" ${nuevoEstado ? "reactivado" : "desactivado"} correctamente.`
        );
      } catch (error) {
        mostrarMensaje(error.message || "No se pudo cambiar el estado del servicio.", "error");
      } finally {
        procesando = false;
        pintarTarjetas();
      }
    }
  });
}

export async function renderServicios() {
  const { data, source } = await obtenerServicios();
  listaServicios = data;
  mostrarAvisoOrigen(source);
  configurarEventos();
  pintarTarjetas();
}