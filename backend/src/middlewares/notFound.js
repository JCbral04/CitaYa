// 404 para rutas no registradas
export default function notFound(req, res) {
  res.status(404).json({ error: "Ruta no encontrada" });
}
