// ============================================================
// CitaYa — Datos simulados para el prototipo inicial
// En fases posteriores estos datos vendrán de la API REST
// ============================================================

export const servicios = [
  { id: 1, nombre: "Corte de cabello", duracion: 30, duracion_min: 30, precio: 15000, icon: "scissors", activo: true },
  { id: 2, nombre: "Arreglo de barba", duracion: 20, duracion_min: 20, precio: 10000, icon: "brush",    activo: true },
  { id: 3, nombre: "Corte + barba",    duracion: 45, duracion_min: 45, precio: 22000, icon: "sparkles", activo: true },
  { id: 4, nombre: "Manicura",         duracion: 40, duracion_min: 40, precio: 18000, icon: "hand",     activo: true },
];

export const citasHoy = [
  { hora: "09:00", cliente: "Carlos Pérez", servicio: "Corte de cabello", estado: "confirmada",   precio: 15000 },
  { hora: "10:30", cliente: "Andrés Gómez", servicio: "Corte + barba",    estado: "pendiente",    precio: 22000 },
  { hora: "12:00", cliente: "Luis Torres",  servicio: "Arreglo de barba", estado: "confirmada",   precio: 10000 },
  { hora: "15:00", cliente: "Javier Ruiz",  servicio: "Corte de cabello", estado: "reprogramada", precio: 15000 },
  { hora: "17:30", cliente: "Mario Díaz",   servicio: "Manicura",         estado: "cancelada",    precio: 18000 },
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