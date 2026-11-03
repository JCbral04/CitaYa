# CitaYa — UI Guidelines

**Versión:** 1.0 · **Proyecto:** CitaYa (Ingeniería Web 2) · **Ámbito:** prototipo frontend `index.html` + `css/style.css`

Guía de diseño que define el sistema visual de CitaYa. Todo cambio de UI debe respetar estos tokens y patrones para mantener consistencia entre entregas.

---

## 1. Sistema cromático — Regla 60-30-10

| Rol | Token | Hex | Uso |
|---|---|---|---|
| **60% Fondo** | `--bg` | `#F8FAFC` | Lienzo principal de la aplicación. Nunca usar blanco puro `#FFFFFF` como fondo de página. |
| **30% Estructura** | `--text` / `--sidebar` | `#0F172A` | Tipografía principal, sidebar, texto de títulos y banner de bienvenida. |
| **10% Acento** | `--accent` | `#2563EB` | **Solo** acciones primarias y elementos interactivos activos: botón "Reservar cita", marca del logo, barras de la gráfica, item activo del menú (con transparencia), iconos de tips. |

### Colores de apoyo (no son acento)

| Token | Hex | Uso |
|---|---|---|
| `--surface` | `#FFFFFF` | Fondo de tarjetas y superficies elevadas. |
| `--border` | `#E2E8F0` | Bordes de tarjetas, divisores y contornos de botones. |
| `--border-soft` | `#F1F5F9` | Separadores internos sutiles (listas). |
| `--muted` | `#64748B` | Texto secundario, subtítulos, ticks de gráfica. |
| `--accent-dark` | `#1D4ED8` | Hover del botón primario y de las barras. |
| `--accent-soft` | `#EFF6FF` | Fondos tenues de iconos destacados. |

### Estados semánticos (badges de citas)

| Estado | Fondo | Texto/Punto |
|---|---|---|
| Confirmada | `#ECFDF5` | `#059669` |
| Pendiente | `#FFFBEB` | `#D97706` |
| Reprogramada | `#F0F9FF` | `#0284C7` |
| Cancelada | `#FFF1F2` | `#E11D48` |

> **Regla de oro:** el acento `#2563EB` nunca se usa para fondos de sección ni para texto largo. Si todo resalta, nada resalta.

---

## 2. Tipografía

**Familia única:** Inter (Google Fonts), con fallback `system-ui`.

| Elemento | Peso | Tamaño | Notas |
|---|---|---|---|
| Título de página (`h1` topbar) | 700 | 1.28rem | `letter-spacing: -0.01em` |
| Títulos de tarjeta (`h2`) | 700 | ~1.02rem | Siempre acompañados de `card-sub` |
| Bienvenida (`h2` banner) | 700 | 1.25rem | Texto blanco sobre pizarra |
| Marca (`brand-name`) | 700 | 1.25rem | "CitaYa" en el sidebar |
| Valores de indicadores | 800 | 1.65rem | `letter-spacing: -0.02em` |
| Cuerpo / textos | 400–500 | 0.84–0.96rem | Color `--text` o `--muted` |
| Labels de indicadores | 600 | 0.76rem | `uppercase` + `letter-spacing: 0.06em` |

Subtítulos (`card-sub`, `stat-foot`, `side-role`): gris `--muted`, peso 400.

---

## 3. Espaciado, radios y sombras

**Tokens de espacio (múltiplos de 4/8):** secciones de contenido separadas por `24px` (`gap: 24px` en `.content`), tarjetas internas `padding: 20–26px`, retícula de indicadores con `gap: 18px`.

| Token | Valor | Uso |
|---|---|---|
| `--radius` | `14px` | Tarjetas principales, banner, panel |
| Radio interno | `10–12px` | Botones, iconos, badges, inputs |
| `--shadow-card` | `0 1px 3px rgba(15,23,42,.07)` | Tarjetas con borde |
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,.05)` | Botón activo del segmented |

**Prohibido:** sombras grandes o difuminadas (`0 10px 30px...`), bordes gruesos, fondos saturados en tarjetas. La profundidad se logra con borde sutil + sombra casi imperceptible.

---

## 4. Layout — App shell

```
┌──────────┬────────────────────────────────┐
│ Sidebar  │  Topbar (título + CTA)          │
│ 256px    ├────────────────────────────────┤
│ #0F172A  │  Welcome banner                 │
│          │  Stats grid (4 indicadores)     │
│          │  Gráfica (3fr) │ Citas (2fr)    │
│          │  Servicios                     │
│          │  Recomendaciones               │
└──────────┴────────────────────────────────┘
```

- **Sidebar:** fija (`sticky`), ancho `256px`, fondo `--sidebar`. En móvil (`≤900px`) se convierte en panel off-canvas con overlay oscuro.
- **Contenido:** `padding: 32px 36px`, columnas con `minmax(0, ...)` para evitar desbordes.
- Retícula principal de gráfica + citas: `3fr / 2fr`, colapsa a 1 columna en `≤1100px`.

---

## 5. Componentes

### 5.1 Botones

| Variante | Clase | Uso |
|---|---|---|
| Primario | `.btn-primary` | Única acción principal por vista ("Reservar cita"). Fondo `--accent`, hover `--accent-dark`. |
| Contorno | `.btn-outline` | Acciones secundarias dentro de tarjetas. Borde `--border`, texto `--accent`, hover con `--accent-soft`. |
| Icono | `.icon-btn` | Solo móvil (menú hamburguesa). |

Estados: `disabled` en `.btn-outline` → fondo `--bg`, texto `#94A3B8`, cursor `not-allowed`.

### 5.2 Tarjetas

| Clase | Uso |
|---|---|
| `.card` | Contenedor genérico de sección (gráfica, citas, servicios). Borde `--border` + shadow-card. |
| `.stat-card` | Indicadores del panel: icono en cuadrado tintado + label + valor grande + pie. |
| `.service-card` | Servicio del catálogo: icono, duración, precio, botón. |
| `.tip-card` | Recomendaciones: icono en `--accent-soft` + título + descripción. |

### 5.3 Badges de estado (`.status`)

Píldora con punto de color (`<span class="dot">`) + texto. Las cuatro clases están en la tabla del punto 1. Texto en minúscula con `text-transform: capitalize`.

### 5.4 Segmented control (`.segmented`)

Toggle de periodos de la gráfica: fondo `--bg`, borde `--border`, botón activo con superficie blanca + `--shadow-sm`. Un solo activo a la vez.

### 5.5 Navegación (`.nav-item`)

Color base `#94A3B8`, hover con fondo `rgba(148,163,184,.08)`. **Activo:** fondo `rgba(37,99,235,.16)`, texto blanco, icono `#60A5FA`.

---

## 6. Iconografía

- **Librería única:** Lucide (CDN), `stroke-width: 2`, color heredado del texto.
- Tamaños: navegación `18px`, iconos de tarjeta `19–20px`, meta-información `14–15px`.
- Todo icono se inserta como `<i data-lucide="nombre"></i>` y se renderiza con `lucide.createIcons()` **después de cada render dinámico** (por eso la llamada final en `app.js`).
- Un icono por concepto en todo el producto (ej. citas siempre `calendar-days`, no mezclar con `calendar`).

---

## 7. Gráficas (Chart.js)

- Tipo: barras verticales, `borderRadius: 6`, `maxBarThickness: 44`.
- Serie única: `#2563EB`, hover `#1D4ED8`. Leyenda oculta (el título de tarjeta ya lo explica).
- Ejes: grid horizontal `#F1F5F9`, grid vertical oculto, ticks `--muted` en Inter 12px, eje Y `beginAtZero` con `stepSize: 1`.
- Contenedor con altura fija (`300px`) y `maintainAspectRatio: false`.

---

## 8. Responsive

| Breakpoint | Cambio |
|---|---|
| `≤1100px` | Gráfica + citas pasan a una sola columna. |
| `≤900px` | Sidebar off-canvas (hamburguesa + overlay), topbar compacto, paddings reducidos. |

Probar siempre en: escritorio (1440px), tablet (768px) y móvil (375px).

---

## 9. Anti-patrones (lo que NO se hace en CitaYa)

-  Degradados chillones o fondos de color saturado en tarjetas.
-  Bordes negros gruesos o sombras pesadas.
-  Mezclar familias de iconos o emojis decorativos.
-  Usar el acento para fondos de sección o párrafos completos.
-  Botones o enlaces sin acción real; si una función no existe aún, el control va `disabled` con tooltip que lo indique.
-  Listas planas sin jerarquía: toda sección lleva título + subtítulo.
-  Prometer "tiempo real" en textos: la sincronización real llega con el backend (fase posterior).

---

*Guía elaborada por Juan Esteban Cabral Bautista y Steven Rusinque Gutiérrez — Universidad Manuela Beltrán, Ingeniería Web 2 (2026).*
