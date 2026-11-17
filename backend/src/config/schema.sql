-- CitaYa - Esquema PostgreSQL (issue #2)

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'cliente'
                CHECK (rol IN ('admin', 'cliente')),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicios (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  duracion_min INT          NOT NULL CHECK (duracion_min > 0),
  precio       INT          NOT NULL CHECK (precio >= 0),
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citas (
  id             SERIAL PRIMARY KEY,
  cliente_nombre VARCHAR(100) NOT NULL,
  servicio_id    INT          NOT NULL REFERENCES servicios(id),
  fecha          DATE         NOT NULL,
  hora_inicio    TIME         NOT NULL,
  estado         VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'confirmada', 'reprogramada', 'cancelada')),
  precio         INT          NOT NULL,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);
