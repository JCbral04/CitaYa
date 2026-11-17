// Validacion basica del body de servicio (issue #3)
export function validarServicio(req, res, next) {
  const { nombre, duracion_min, precio } = req.body;
  const errores = [];

  if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
    errores.push("nombre es obligatorio");
  }
  if (!Number.isInteger(duracion_min) || duracion_min <= 0) {
    errores.push("duracion_min debe ser un entero mayor que 0");
  }
  if (typeof precio !== "number" || Number.isNaN(precio) || precio < 0) {
    errores.push("precio debe ser un numero mayor o igual a 0");
  }

  if (errores.length) {
    return res.status(400).json({ errores });
  }
  next();
}
