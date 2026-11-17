// Pruebas de la API con node:test (issue #7)
// Usa una base exclusiva citaya_test derivada de DATABASE_URL (sin tocar la de desarrollo)
import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pg from "pg";

const baseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";
const adminUrl = baseUrl.replace(/\/[^/]+$/, "/postgres");
const testDbUrl = baseUrl.replace(/\/[^/]+$/, "/citaya_test");

let server;
let base;

async function prepararBdPruebas() {
  // Crear la BD de pruebas si no existe
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  const { rows } = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'citaya_test'");
  if (!rows.length) {
    await admin.query("CREATE DATABASE citaya_test");
  }
  await admin.end();

  // Apuntar el proceso a la BD de pruebas
  process.env.DATABASE_URL = testDbUrl;

  // Esquema + datos limpios y deterministicos
  const pool = new pg.Pool({ connectionString: testDbUrl });
  const schema = readFileSync(new URL("../src/config/schema.sql", import.meta.url), "utf8");
  const migracion = readFileSync(new URL("../src/config/migracion_001_doble_reserva.sql", import.meta.url), "utf8");
  const seed = readFileSync(new URL("../src/config/seed.sql", import.meta.url), "utf8");
  await pool.query(schema);
  await pool.query(migracion);
  await pool.query("TRUNCATE usuarios, servicios, citas RESTART IDENTITY CASCADE");
  await pool.query(seed);
  await pool.end();
}

async function api(ruta, opciones = {}) {
  const res = await fetch(`${base}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  await prepararBdPruebas();
  const { default: app } = await import("../src/app.js");
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

test("GET /api/health responde ok", async () => {
  const { status, body } = await api("/api/health");
  assert.equal(status, 200);
  assert.equal(body.status, "ok");
});

test("servicios: lista los 4 de semilla", async () => {
  const { status, body } = await api("/api/servicios");
  assert.equal(status, 200);
  assert.equal(body.length, 4);
  assert.equal(body[0].nombre, "Corte de cabello");
});

test("servicios: crea con 201 y valida con 400", async () => {
  const creado = await api("/api/servicios", {
    method: "POST",
    body: JSON.stringify({ nombre: "Tinte", duracion_min: 60, precio: 35000 }),
  });
  assert.equal(creado.status, 201);
  assert.equal(creado.body.precio, 35000);

  const invalido = await api("/api/servicios", {
    method: "POST",
    body: JSON.stringify({ nombre: "", duracion_min: -5, precio: "gratis" }),
  });
  assert.equal(invalido.status, 400);
  assert.ok(invalido.body.errores.length >= 3);
});

test("servicios: no elimina si tiene citas asociadas (409)", async () => {
  const { status, body } = await api("/api/servicios/1", { method: "DELETE" });
  assert.equal(status, 409);
  assert.match(body.error, /citas asociadas/);
});

test("citas: crea con precio del servicio (201)", async () => {
  const { body: citas } = await api("/api/citas");
  const hoy = citas.find((c) => c.id === 1).fecha.slice(0, 10);

  const creada = await api("/api/citas", {
    method: "POST",
    body: JSON.stringify({
      cliente_nombre: "Cliente Test",
      servicio_id: 2,
      fecha: hoy,
      hora_inicio: "18:00",
    }),
  });
  assert.equal(creada.status, 201);
  assert.equal(creada.body.estado, "pendiente");
  assert.equal(creada.body.precio, 10000);
});

test("citas: rechaza doble reserva del mismo horario (409)", async () => {
  const { body: citas } = await api("/api/citas");
  const hoy = citas.find((c) => c.id === 1).fecha.slice(0, 10);

  const duplicada = await api("/api/citas", {
    method: "POST",
    body: JSON.stringify({
      cliente_nombre: "Doble Test",
      servicio_id: 1,
      fecha: hoy,
      hora_inicio: "09:00",
    }),
  });
  assert.equal(duplicada.status, 409);
  assert.match(duplicada.body.error, /Horario no disponible/);
});

test("citas: rechaza datos invalidos (400)", async () => {
  const { status, body } = await api("/api/citas", {
    method: "POST",
    body: JSON.stringify({ cliente_nombre: "", servicio_id: 1, fecha: "2020-01-01", hora_inicio: "25:00" }),
  });
  assert.equal(status, 400);
  assert.ok(body.errores.length >= 3);
});

test("citas: transicion invalida desde cancelada (409)", async () => {
  const { status, body } = await api("/api/citas/5/estado", {
    method: "PATCH",
    body: JSON.stringify({ estado: "confirmada" }),
  });
  assert.equal(status, 409);
  assert.match(body.error, /Transicion no permitida/);
});

test("citas: reprogramar con fecha futura (200)", async () => {
  const futura = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const { status, body } = await api("/api/citas/1/estado", {
    method: "PATCH",
    body: JSON.stringify({ estado: "reprogramada", fecha: futura, hora_inicio: "11:00" }),
  });
  assert.equal(status, 200);
  assert.equal(body.estado, "reprogramada");
});

test("panel: resumen del dia tras las operaciones de los tests", async () => {
  const { status, body } = await api("/api/panel/resumen");
  assert.equal(status, 200);
  // Hoy quedan: cita 2 (pendiente 22000), cita 3 (confirmada 10000),
  // cita 4 (reprogramada 15000) y la creada en el test 5 (pendiente 10000).
  // La cita 1 se reprogramo a otra fecha y la 5 esta cancelada.
  assert.equal(body.activas, 4);
  assert.equal(body.confirmadas, 1);
  assert.equal(body.pendientes, 2);
  assert.equal(body.ingresosEstimados, 57000);
});
