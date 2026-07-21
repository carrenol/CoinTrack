# SPEC.md — Reto Técnico MonaBit: Dashboard Cripto

> Este documento es la fuente de verdad del proyecto. Cualquier tarea de desarrollo (manual o asistida por IA) debe alinearse a lo definido aquí. Si una decisión no está cubierta en este documento, debe registrarse en `DECISIONS.md` antes de implementarse.

---

## 1. Objetivo del proyecto

Construir una aplicación web **fullstack** que permita a un usuario autenticado consultar, visualizar y gestionar información del mercado de criptomonedas, a través de un dashboard privado.

La solución debe incluir: frontend, backend, base de datos, autenticación, integración con una API externa de datos cripto, y despliegue funcional en Google Cloud Run.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js |
| Base de datos | Supabase |
| Cloud / despliegue | Google Cloud Run |
| Autenticación | Login de usuario propio + Login con Google (OAuth) |
| API externa | CoinGecko |

> Librerías, frameworks o servicios complementarios están permitidos si aportan valor. Cualquier adición debe justificarse en `DECISIONS.md`.

**Stack elegido para este proyecto:** *(completar aquí una vez definido — ver `DECISIONS.md`)*
- Frontend: `[React 18 + Vite]`
- Base de datos: `[Supabase]`
- Proveedor cripto: `[CoinGecko]`
- Framework backend: `[Express]`
- Estrategia de despliegue: `[frontend y backend separados en dos servicios de Google Cloud Run]`

---

## 3. Funcionalidades mínimas de la aplicación

- [ ] Registro de usuario
- [ ] Login de usuario (email/password)
- [ ] Logout
- [ ] Login con Google
- [ ] Rutas privadas protegidas (frontend y backend)
- [ ] Gestión básica de usuarios (ver sección 5)
- [ ] Dashboard principal con el top 10 de criptomonedas
- [ ] KPIs relevantes del mercado
- [ ] Gráficas o visualizaciones
- [ ] Consumo de datos desde una API externa
- [ ] Persistencia de datos en base de datos
- [ ] Despliegue funcional en Google Cloud Run

---

## 4. Autenticación y usuarios

### Requisitos funcionales
- Crear cuenta (registro).
- Iniciar sesión.
- Cerrar sesión.
- Autenticación con Google (OAuth o mecanismo equivalente adecuado al stack elegido).

### Reglas
- Todas las rutas del dashboard y de gestión de usuarios deben estar protegidas: inaccesibles sin sesión válida, tanto en frontend (guard de rutas) como en backend (middleware de validación de sesión/token).
- No debe ser posible acceder a datos privados sin autenticación, ni siquiera llamando directamente al endpoint del backend.

---

## 5. Gestión de usuarios

Debe existir una sección donde se pueda:
- [ ] Ver usuarios registrados
- [ ] Crear un usuario
- [ ] Editar información básica
- [ ] Desactivar o eliminar un usuario

Roles, permisos o restricciones adicionales son opcionales, a criterio de diseño (documentar en `DECISIONS.md` si se implementan).

---

## 6. Dashboard cripto

El dashboard debe mostrar información **actualizada** del mercado, incluyendo:

- [ ] Top 10 de criptomonedas
- [ ] Precio actual (por cada moneda)
- [ ] Variación porcentual (por cada moneda)
- [ ] Market cap, volumen u otro indicador relevante (por cada moneda)
- [ ] KPIs generales del mercado (ej. market cap total, dominancia, variación promedio)
- [ ] Gráficas o visualizaciones
- [ ] Fecha y hora de última actualización de los datos

El proveedor de datos cripto es libre. La integración debe estar diseñada para ser **estable y mantenible** (no depender directamente del proveedor en el frontend; el backend debe actuar como intermediario).

---

## 7. Backend e integraciones

El backend debe exponer los endpoints necesarios para soportar toda la aplicación y encargarse de:

- [ ] Autenticación o validación de sesión (según el diseño elegido)
- [ ] Gestión de usuarios (CRUD)
- [ ] Comunicación con la base de datos
- [ ] Consumo de la API externa de criptomonedas
- [ ] Entrega de datos procesados al frontend
- [ ] Manejo adecuado de errores (incluyendo fallos de la API externa, rate limits, etc.)

**Restricción de diseño:** el frontend nunca debe llamar directamente a la API externa de criptomonedas; siempre debe pasar por el backend.

---

## 8. Base de datos

Usar **Firestore o Supabase** (definir cuál en `DECISIONS.md`).

Debe persistirse como mínimo:
- [ ] Usuarios
- [ ] Datos básicos de perfil
- [ ] Preferencias o configuración del usuario (si aplica)
- [ ] Cualquier otro dato adicional útil para la aplicación (ej. favoritos, cache de datos cripto)

El modelo de datos diseñado debe explicarse brevemente en el README final.

---

## 9. Seguridad

Buenas prácticas obligatorias:
- [ ] Manejo correcto de autenticación y sesiones (sin exponer tokens/secretos innecesariamente)
- [ ] Validación de permisos en cada ruta protegida (no confiar solo en el estado del frontend)
- [ ] Variables de entorno para toda configuración sensible — **nunca** secretos reales en el repositorio
- [ ] `.env.example` documentando qué variables se necesitan, con valores de ejemplo (no reales)
- [ ] Acceso a datos privados restringido correctamente a nivel de backend/base de datos

---

## 10. Despliegue (Google Cloud Run)

Entregables de esta sección:
- [ ] URL pública del frontend
- [ ] URL pública o endpoint del backend (si aplica según arquitectura elegida)
- [ ] Instrucciones básicas para ejecutar el proyecto localmente
- [ ] Instrucciones o resumen del proceso de despliegue realizado

La aplicación entregada debe poder probarse completamente desde una URL pública (flujo de login → dashboard → logout funcional en producción).

---

## 11. Uso de herramientas de IA

Se permite el uso de IA durante el desarrollo. Debe documentarse (ver `AI_LOG.md` y resumen en README):
- [ ] Qué herramientas de IA se usaron
- [ ] Para qué se usaron
- [ ] Qué partes se investigaron con ayuda de IA
- [ ] Qué decisiones técnicas se tomaron por criterio propio (no de la IA)
- [ ] Qué limitaciones o riesgos se detectaron en respuestas generadas por IA

---

## 12. Extras opcionales (no obligatorios)

Priorizar solo después de tener una solución funcional, clara y bien documentada:

- [ ] Roles de usuario
- [ ] Auditoría básica de acciones
- [ ] Tests
- [ ] CI/CD
- [ ] Cache de datos cripto
- [ ] Rate limiting
- [ ] Dark mode
- [ ] Búsqueda o filtros de criptomonedas
- [ ] Criptomonedas favoritas por usuario
- [ ] Alertas simples de precio
- [ ] Logs estructurados
- [ ] Health endpoint

---

## 13. Reglas para asistencia de IA en este repositorio

Estas reglas aplican a cualquier IDE o asistente de IA (incluyendo Antigravity) que trabaje sobre este código:

1. No modificar la lógica de autenticación, sesiones o seguridad sin mostrar antes el plan de cambios.
2. No agregar librerías, frameworks o servicios nuevos sin registrarlo primero en `DECISIONS.md`.
3. No exponer la API externa de criptomonedas directamente al frontend.
4. No commitear secretos, claves ni tokens reales bajo ninguna circunstancia.
5. Cada tarea debe resolverse de forma acotada (un endpoint, un componente, un servicio), no como refactors amplios no solicitados.
6. Toda decisión de arquitectura relevante debe quedar registrada en `DECISIONS.md`, no solo en el código.
