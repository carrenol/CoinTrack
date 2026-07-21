# CoinTrack — Dashboard Cripto

**CoinTrack** es una aplicación web fullstack que permite a usuarios autenticados consultar, visualizar y gestionar información del mercado de criptomonedas en tiempo real. Desarrollado como reto técnico para Monabit.

---

## 📋 Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Arquitectura General](#arquitectura-general)
3. [Instalación Local](#instalación-local)
4. [Variables de Entorno](#variables-de-entorno)
5. [Proveedor Cripto: CoinGecko](#proveedor-cripto-coingecko)
6. [Modelo de Datos](#modelo-de-datos)
7. [Autenticación y Seguridad](#autenticación-y-seguridad)
8. [Uso de Herramientas de IA](#uso-de-herramientas-de-ia)
9. [Limitaciones Conocidas y Mejoras Futuras](#limitaciones-conocidas-y-mejoras-futuras)
10. [Despliegue en Google Cloud Run](#despliegue-en-google-cloud-run)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript + TailwindCSS |
| Backend | Node.js + Express 5 + TypeScript |
| Base de datos / Auth | Supabase (PostgreSQL + Auth) |
| API externa cripto | CoinGecko API v3 |
| Despliegue | Google Cloud Run (monorepo unificado en Docker) |
| Contenedor | Docker multi-stage build |

---

## Arquitectura General

```
+-------------------------------------------------------------+
|                     Google Cloud Run                        |
|                                                             |
|  +-------------------------------------------------------+  |
|  |            Express Server (Node.js)                   |  |
|  |                                                       |  |
|  |  +----------------+  +----------------------------+  |  |
|  |  |  Static SPA    |  |        REST API             |  |  |
|  |  | (React/Vite)   |  |  /api/auth   /api/coins     |  |  |
|  |  | /index.html    |  |  /api/admin  /api/favorites |  |  |
|  |  +----------------+  +-------------+--------------+  |  |
|  +------------------------------------------+-----------+  |
|                                             |               |
+---------------------------------------------+---------------+
                                              |
              +-------------------------------+---------------+
              |                               |               |
              v                               v               v
      +---------------+          +------------------+  +-----------+
      |   Supabase    |          |  Supabase Auth   |  | CoinGecko |
      |  (PostgreSQL) |          |  (JWT + OAuth)   |  |  API v3   |
      +---------------+          +------------------+  +-----------+
```

### Descripción de capas

**Frontend (React + Vite)**
- SPA construida con React 19, React Router v7 y TailwindCSS.
- Se sirve como archivos estáticos directamente desde el servidor Express en producción.
- Se comunica exclusivamente con el backend propio (`/api/*`); **nunca** llama directamente a APIs externas.
- Gestión de sesión vía Supabase Auth JS SDK (tokens JWT almacenados en `localStorage`).
- Rutas protegidas con guards de navegación basados en el estado de sesión.

**Backend (Express + Node.js)**
- Sirve la API REST y los archivos estáticos del frontend.
- Actúa como intermediario entre el cliente y CoinGecko, validando sesión antes de entregar datos.
- Usa dos clientes de Supabase:
  - `supabase` (anon key): para operaciones públicas y validación de tokens.
  - `supabaseAdmin` (service role key): para operaciones privilegiadas (gestión de usuarios, admin).
- Middlewares globales: `helmet` (cabeceras de seguridad), `cors` (origen controlado), `morgan` (logging HTTP).

**Base de datos (Supabase / PostgreSQL)**
- Almacena perfiles de usuario, configuración y favoritos.
- Supabase Auth gestiona el registro, login y OAuth con Google.

**Despliegue (Docker + Cloud Run)**
- Build multi-stage: compila cliente y servidor por separado, genera imagen final ligera (`node:22-alpine`).
- Un solo contenedor sirve tanto el frontend estático como la API en el mismo puerto (8080).

---

## Instalación Local

### Prerrequisitos

- **Node.js** v20+ ([descargar](https://nodejs.org))
- **npm** v10+
- Cuenta en [Supabase](https://supabase.com) con un proyecto creado

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd CoinTrack
```

### 2. Configurar el servidor (backend)

```bash
cd server
cp .env.example .env
# Editar .env con tus credenciales de Supabase (ver sección Variables de Entorno)
npm install
npm run dev
```

El servidor arrancará en `http://localhost:3001`.

### 3. Configurar el cliente (frontend)

En otra terminal:

```bash
cd client
# Crear .env con las variables necesarias
# (ver plantilla en la sección Variables de Entorno)
npm install
npm run dev
```

El cliente arrancará en `http://localhost:5173`.

### 4. Verificar que todo funciona

- Frontend: `http://localhost:5173`
- Health check del backend: `http://localhost:3001/health`

### Ejecución con Docker (opcional)

```bash
# Desde la raíz del proyecto
docker build -t cointrack .
docker run -p 8080:8080 \
  -e SUPABASE_URL=https://tu-proyecto.supabase.co/rest/v1/ \
  -e SUPABASE_ANON_KEY=tu-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key \
  cointrack
```

La app estará disponible en `http://localhost:8080`.

---

## Variables de Entorno

### Servidor (`server/.env`)

Copia `server/.env.example` y completa los valores reales:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto en que escucha el servidor | `3001` |
| `SUPABASE_URL` | URL base de tu proyecto Supabase | `https://xxxx.supabase.co/rest/v1/` |
| `SUPABASE_ANON_KEY` | Llave pública (anon) de Supabase | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave de servicio (privilegiada) de Supabase | `eyJhbGci...` |
| `CLIENT_URL` | URL del frontend (para CORS en producción) | `https://tu-frontend.run.app` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |

> ⚠️ **Nunca** subas el archivo `.env` real al repositorio. La `SUPABASE_SERVICE_ROLE_KEY` tiene permisos de administrador sobre tu base de datos.

### Cliente (`client/.env`)

Crea el archivo `client/.env` con el siguiente contenido:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (sin `/rest/v1/`) | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Llave pública (anon) de Supabase | `eyJhbGci...` |
| `VITE_API_URL` | URL base del backend (vacía = relativa en producción) | `http://localhost:3001` |

> En producción (Docker/Cloud Run), `VITE_API_URL` se deja vacía para que las llamadas a `/api/*` sean relativas al mismo dominio del servidor.

---

## Proveedor Cripto: CoinGecko

Se eligió **CoinGecko API v3** como fuente de datos de criptomonedas por las siguientes razones:

- **Sin API key requerida** para el tier gratuito, lo que elimina fricción en el setup inicial.
- **Datos completos**: precio, market cap, volumen, variación porcentual (1h, 24h, 7d), sparkline de 7 días, imagen del logo.
- **Alta disponibilidad y confiabilidad**: es uno de los agregadores de datos cripto más usados en la industria.
- **Documentación excelente** con endpoints claros y estables.

### Endpoint utilizado

```
GET https://api.coingecko.com/api/v3/coins/markets
  ?vs_currency=usd
  &order=market_cap_desc
  &per_page=10
  &sparkline=true
```

Retorna el **Top 10 de criptomonedas** ordenadas por capitalización de mercado, incluyendo datos de sparkline para gráficas.

### Patrón de integración

El frontend **nunca** llama directamente a CoinGecko. La ruta es:

```
Cliente React → GET /api/coins/top → Express Server → CoinGecko API → respuesta al cliente
```

Esto permite:
- Cachear respuestas en el servidor en el futuro (rate limit de CoinGecko: 10-30 req/min en el tier gratuito).
- Cambiar de proveedor cripto sin tocar el frontend.
- Proteger la API key si se migra a un plan de pago.

---

## Modelo de Datos

La base de datos es **PostgreSQL gestionada por Supabase**. Las tablas principales son:

### `profiles`

Extiende la tabla `auth.users` de Supabase con información adicional del perfil.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` (PK) | Referencia a `auth.users.id` |
| `full_name` | `text` | Nombre completo del usuario |
| `avatar_url` | `text` | URL del avatar (Google OAuth o personalizada) |
| `email` | `text` | Email (sincronizado desde auth) |
| `role` | `text` | Rol del usuario: `user` o `admin` |
| `active` | `boolean` | Estado de la cuenta (desactivación suave) |
| `created_at` | `timestamptz` | Fecha de creación |
| `updated_at` | `timestamptz` | Fecha de última actualización |

### `user_favorites`

Almacena las criptomonedas marcadas como favoritas por cada usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` (PK) | Identificador único del favorito |
| `user_id` | `uuid` (FK) | Referencia a `profiles.id` |
| `coin_id` | `text` | ID de CoinGecko (ej. `bitcoin`, `ethereum`) |
| `created_at` | `timestamptz` | Fecha en que se marcó como favorito |

### Relaciones

```
auth.users (Supabase Auth)
    |
    | 1:1
    v
profiles
    |
    | 1:N
    v
user_favorites
```

> Los datos de mercado de criptomonedas (precios, market cap, etc.) **no se persisten** en la base de datos; se consultan en tiempo real desde CoinGecko en cada request.

---

## Autenticación y Seguridad

### Flujo de autenticación

```
1. Usuario ingresa credenciales en LoginPage
2. Supabase Auth SDK (cliente) → devuelve JWT (access_token)
3. El token se almacena en localStorage (gestionado por Supabase SDK)
4. Cada request al backend incluye: Authorization: Bearer <token>
5. Middleware authenticateUser en Express:
   a. Extrae el token del header Authorization
   b. Valida el token con supabase.auth.getUser(token)
   c. Verifica que profiles.active === true
   d. Adjunta el objeto user al request (req.user)
6. El handler del endpoint ejecuta si pasa el middleware
```

### Métodos de autenticación soportados

- **Email/Password**: registro y login propio.
- **Google OAuth**: login con cuenta de Google, gestionado por Supabase Auth.
- **Callback de OAuth**: ruta `/auth/callback` en el frontend procesa el redirect de Google.

### Protección de rutas

| Nivel | Mecanismo |
|---|---|
| Frontend | Guard de navegación en React Router: redirige a `/login` si no hay sesión activa |
| Backend (usuario) | Middleware `authenticateUser` en todas las rutas `/api/auth/*`, `/api/coins/*`, `/api/favorites/*` |
| Backend (admin) | Middleware `requireAdmin` adicional: verifica `profiles.role === 'admin'` en `/api/admin/*` |

### Medidas de seguridad implementadas

- **`helmet`**: configura cabeceras HTTP de seguridad (X-Frame-Options, X-Content-Type-Options, etc.).
- **`cors`**: restringe el origen permitido; en producción solo acepta `CLIENT_URL`.
- **Service Role Key separada**: las operaciones de admin (listar/eliminar usuarios de `auth.users`) usan `supabaseAdmin` con la service role key, nunca expuesta al cliente.
- **Desactivación suave de cuentas**: el campo `profiles.active` permite bloquear acceso sin eliminar el registro. El middleware lo verifica en cada request autenticado.
- **Sin secretos en el repositorio**: toda configuración sensible está en `.env` (excluido de git vía `.gitignore`).
- **Validación de permisos en el backend**: ningún dato privado es accesible sin token válido, independientemente del estado del frontend.

---

## Uso de Herramientas de IA

Durante el desarrollo de este proyecto se utilizó **Antigravity (Google DeepMind)** como asistente de programación dentro del IDE.

### Para qué se usó la IA

| Área | Uso |
|---|---|
| Scaffolding inicial | Generación de la estructura base del proyecto (Express + React + TypeScript) |
| Componentes React | Creación de componentes de UI (DashboardPage, AdminPanel, LoginPage) |
| Middleware de auth | Revisión y refinamiento del flujo de validación de tokens con Supabase |
| Rutas de favoritos | Implementación del CRUD completo de `user_favorites` |
| Dockerfile | Diseño del build multi-stage para producción en Cloud Run |
| Documentación | Generación del README y documentación de variables de entorno |
| Depuración | Diagnóstico de errores de CORS, tipado de TypeScript y configuración de Supabase |

### Qué partes se decidieron sin IA

- Selección de Supabase como BaaS (base de datos + autenticación integrada).
- Decisión de arquitectura monorepo con servidor Express sirviendo el frontend estático en producción.
- Elección de CoinGecko como proveedor cripto (sin API key en tier gratuito).
- Diseño del esquema de roles (`admin` / `user`) y el campo `active` para desactivación suave.
- Definición de las reglas de seguridad descritas en `SPEC.md`.

### Limitaciones y riesgos detectados en respuestas de IA

- La IA ocasionalmente sugirió exponer la API de CoinGecko directamente en el frontend, lo cual contradice la restricción de diseño del SPEC. Se rechazaron esas sugerencias.
- Algunas implementaciones generadas requirieron ajuste manual en el tipado de TypeScript (especialmente `req.user` en Express).
- La IA no siempre propuso automáticamente el `.env.example` ni tomó en cuenta restricciones del `.gitignore`.

---

## Limitaciones Conocidas y Mejoras Futuras

### Limitaciones conocidas

| # | Limitación | Impacto |
|---|---|---|
| 1 | **Sin caché en datos de CoinGecko**: cada visita al dashboard hace una request a CoinGecko. Rate limit: ~10-30 req/min en tier gratuito. | Puede generar errores 429 con múltiples usuarios simultáneos. |
| 2 | **Sin rate limiting en el backend propio**: cualquier IP puede hacer peticiones ilimitadas a `/api/*`. | Vulnerabilidad a abuso o DDoS básico. |
| 3 | **Sin tests automatizados**: no existen tests unitarios, de integración ni E2E. | Mayor riesgo de regresiones al modificar el código. |
| 4 | **Roles simplificados**: solo existe `admin` y `user`, sin permisos granulares. | Escalabilidad limitada si se requieren roles intermedios. |
| 5 | **Dashboard sin actualización automática**: los datos de mercado solo se refrescan al cargar la página. | Datos potencialmente desactualizados en sesiones largas. |
| 6 | **Sin CI/CD configurado**: los despliegues son manuales vía `gcloud` CLI. | Mayor probabilidad de errores en el proceso de deploy. |
| 7 | **Inyección de variables en runtime**: el servidor inyecta `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el HTML en cada request. | Solución frágil; preferible usar variables Vite en build time. |

### Mejoras futuras

- [ ] **Caché con TTL** para respuestas de CoinGecko (Redis o caché en memoria con `node-cache`).
- [ ] **Rate limiting** en el backend con `express-rate-limit`.
- [ ] **Tests automatizados**: Jest para el backend, Vitest + Testing Library para el frontend.
- [ ] **CI/CD**: GitHub Actions con build, test y deploy automático a Cloud Run.
- [ ] **Polling o WebSocket** para actualización de precios en tiempo real en el dashboard.
- [ ] **Búsqueda y filtrado** de criptomonedas más allá del Top 10.
- [ ] **Alertas de precio**: notificaciones cuando una cripto supere o baje de un umbral definido por el usuario.
- [ ] **Logs estructurados**: reemplazar `console.log` con una librería como `pino` o `winston`.
- [ ] **Dark mode persistente**: guardar la preferencia de tema en `profiles` o `localStorage`.
- [ ] **Auditoría de acciones**: registro de quién hizo qué en el panel de administración.
- [ ] **Soporte multi-divisa**: permitir ver precios en EUR, MXN, etc.

---

## Despliegue en Google Cloud Run

### Estrategia

El proyecto usa un **Dockerfile multi-stage** que genera una imagen única con el servidor Express sirviendo tanto la API como el frontend estático. Esto simplifica el despliegue a un solo servicio en Cloud Run.

### Pasos de despliegue

```bash
# 1. Configurar el proyecto de GCP
gcloud config set project TU_PROJECT_ID

# 2. Construir y subir la imagen
gcloud builds submit --tag gcr.io/TU_PROJECT_ID/cointrack .

# 3. Desplegar en Cloud Run
gcloud run deploy cointrack \
  --image gcr.io/TU_PROJECT_ID/cointrack \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "SUPABASE_URL=https://xxxx.supabase.co/rest/v1/,SUPABASE_ANON_KEY=...,SUPABASE_SERVICE_ROLE_KEY=..."
```

> Las variables de entorno sensibles se inyectan en el paso de despliegue y **no** forman parte de la imagen Docker.

---

*Generado como parte del reto técnico Monabit — CoinTrack Dashboard Cripto.*
