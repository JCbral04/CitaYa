-- Migracion 001 (issue #5): prevenir dobles reservas
-- Solo una cita ACTIVA por servicio, fecha y hora.
-- Las canceladas liberan el horario (por eso el indice es parcial).

CREATE UNIQUE INDEX IF NOT EXISTS idx_cita_unica_activa
ON citas (servicio_id, fecha, hora_inicio)
WHERE estado <> 'cancelada';
