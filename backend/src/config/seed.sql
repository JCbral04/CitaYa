-- CitaYa - Datos de semilla (equivalentes a js/data.js)

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Barberia El Corte', 'admin@citaya.co', 'hash-demo-pendiente-auth', 'admin');

INSERT INTO servicios (nombre, duracion_min, precio) VALUES
('Corte de cabello', 30, 15000),
('Arreglo de barba', 20, 10000),
('Corte + barba',    45, 22000),
('Manicura',         40, 18000);

INSERT INTO citas (cliente_nombre, servicio_id, fecha, hora_inicio, estado, precio) VALUES
('Carlos Perez', 1, CURRENT_DATE, '09:00', 'confirmada',   15000),
('Andres Gomez', 3, CURRENT_DATE, '10:30', 'pendiente',    22000),
('Luis Torres',  2, CURRENT_DATE, '12:00', 'confirmada',   10000),
('Javier Ruiz',  1, CURRENT_DATE, '15:00', 'reprogramada', 15000),
('Mario Diaz',   4, CURRENT_DATE, '17:30', 'cancelada',    18000);
