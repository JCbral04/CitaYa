// ============================================================
// CitaYa — Datos simulados para el prototipo inicial
// En fases posteriores estos datos vendrán de la API REST
// ============================================================

const HOY_ISO = new Date().toLocaleDateString("en-CA");

export const servicios = [
  { id: 1, nombre: "Corte de cabello", duracion: 30, duracion_min: 30, precio: 15000, icon: "scissors", activo: true },
  { id: 2, nombre: "Arreglo de barba", duracion: 20, duracion_min: 20, precio: 10000, icon: "brush",    activo: true },
  { id: 3, nombre: "Corte + barba",    duracion: 45, duracion_min: 45, precio: 22000, icon: "sparkles", activo: true },
  { id: 4, nombre: "Manicura",         duracion: 40, duracion_min: 40, precio: 18000, icon: "hand",     activo: true },
];

export const citasHoy = [
  { id: 1, fecha: HOY_ISO, hora: "09:00", hora_inicio: "09:00", cliente: "Carlos Pérez", cliente_nombre: "Carlos Pérez", servicio_id: 1, servicio: "Corte de cabello", estado: "confirmada",   precio: 15000 },
  { id: 2, fecha: HOY_ISO, hora: "10:30", hora_inicio: "10:30", cliente: "Andrés Gómez", cliente_nombre: "Andrés Gómez", servicio_id: 3, servicio: "Corte + barba",    estado: "pendiente",    precio: 22000 },
  { id: 3, fecha: HOY_ISO, hora: "12:00", hora_inicio: "12:00", cliente: "Luis Torres",  cliente_nombre: "Luis Torres",  servicio_id: 2, servicio: "Arreglo de barba", estado: "confirmada",   precio: 10000 },
  { id: 4, fecha: HOY_ISO, hora: "15:00", hora_inicio: "15:00", cliente: "Javier Ruiz",  cliente_nombre: "Javier Ruiz",  servicio_id: 1, servicio: "Corte de cabello", estado: "reprogramada", precio: 15000 },
  { id: 5, fecha: HOY_ISO, hora: "17:30", hora_inicio: "17:30", cliente: "Mario Díaz",   cliente_nombre: "Mario Díaz",   servicio_id: 4, servicio: "Manicura",         estado: "cancelada",    precio: 18000 },
];

// Datos para la gráfica interactiva (por periodo)
export const citasPorPeriodo = {
  week: {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    data: [5, 8, 6, 9, 11, 4, 0],
  },
  month: {
    labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
    data: [22, 28, 31, 26],
  },
};