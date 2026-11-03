# CitaYa - Agenda inteligente de citas

Agenda inteligente de citas para pequeños negocios( barberias, peluquerias, talleres)
**Asignatura:** Ingeniería Web 2 · Universidad Manuela Beltrán · Aprendizaje Basado en Proyectos (ABP)

**Integrantes:**
- Juan Esteban Cabral Bautista
- Steven Rusinque Gutiérrez

## Descripcion del proyecto

CitaYa es una aplicación web progresiva (PWA), la cual esta dirigida a pequeños negocios de servicios (como podrian ser barberías, peluquerías, talleres etc...) que centraliza la reserva, consulta y administración de citas en una sola plataforma, reemplazando la gestión manual por llamadas y chats desordenados.

## Objetivo

El objetivo que tiene la app es diseñar e implementar una aplicación web progresiva que automatice procesos como lo serian la reserva, gestión y recordatorio de citas de pequeños negocios de servicios, reduciendo las inasistencias de clientes y optimizando el tiempo de atención.

## Estado actual
El estado actual del proyecto se puede evidenciar mejor en **[bitacora](/docs/BITACORA.md)**

## Tecnologias

- HTML5 · CSS3 · JavaScript (ES6)
- [Chart.js 4](https://www.chartjs.org/) (vía CDN) para la gráfica interactiva
- Git y GitHub para el control de versiones

## Estructura de carpetas (Estructura inicial)

```
CitaYa/
├── README.md
├── assets/
├── css/
│   └── style.css
├── docs/
│   ├── BITACORA.md
│   └── UI_GUIDELINEs.md
├── index.html
└── js/
    ├── app.js
    └── data.js
```

## Como ejecutar?

1. Clonar el repositorio:
` git clone https://github.com/JCbral04/CitaYa`
2. Una vez en la carpeta en la que clonamos el repositorio tenemos 2 opciones
    - Opcion 1: Abrir directamente el archivo `index.html`.
    - Opcion 2: Levantar un servidor local de dos formas:
        - ` npx serve .`
        - ` python -m http.server 8000`
3. Una vez el servidor levantado simplemente vamos al navegador y ponemos
```bash
http://localhost:3000 
#o dependiendo del puerto escogido. 
http://localhost:8000
```
## Alcance

**Incluye (esta fase):** interfaz del panel del negocio, indicadores visuales, gráfica interactiva, listado de citas y catálogo de servicios con datos simulados.

**Queda fuera (fases posteriores):** API REST (Node.js + Express), base de datos PostgreSQL, autenticación y control de acceso por roles, reserva en línea por parte del cliente, recordatorios por WhatsApp e instalación PWA.

## Roadmap

1. [x] Ficha técnica e idea del proyecto (S13)
2. [x] Repositorio y prototipo web inicial (S14)
3. [] Backend: API REST con Node.js + Express
4. [] Base de datos PostgreSQL y persistencia
5. [] Autenticación y control de acceso por roles
6. [] Reserva en línea y despliegue como PWA