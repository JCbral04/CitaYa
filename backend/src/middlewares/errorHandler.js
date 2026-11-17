// Manejo centralizado de errores (500 por defecto)
export default function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
}
