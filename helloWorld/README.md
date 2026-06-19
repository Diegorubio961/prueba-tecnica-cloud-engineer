# HelloWorld App

Aplicación web full-stack con autenticación JWT.  
**Stack:** Node.js + Express (backend) · Angular 17 (frontend) · Docker Compose (despliegue)

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Docker | 24.x |
| Docker Compose | 2.x (`docker compose`) |

> No se requiere Node.js ni Angular CLI instalados localmente — todo se ejecuta dentro de los contenedores.

---

## Levantar el proyecto

### 1. Clonar / abrir la carpeta del proyecto

```bash
cd helloWorld
```

### 2. Configurar variables de entorno

```bash
# El archivo .env ya viene creado con valores por defecto.
# Edítalo antes de levantar en producción:
```

Abre `.env` y cambia los valores según necesites (ver sección Variables de Entorno).

### 3. Construir y levantar

```bash
docker compose up --build
```

Este comando:
- Descarga las imágenes base (`node:20-alpine`, `nginx:alpine`)
- Instala dependencias del backend
- Compila el proyecto Angular (producción)
- Levanta ambos servicios conectados en red interna

### 4. Acceder a la aplicación

Abre tu navegador en: **http://localhost**

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/register` | Registro de usuario |
| `/login` | Inicio de sesión |
| `/dashboard` | Hello World (requiere sesión) |

### 5. Detener el proyecto

```bash
docker compose down
```

Para detener **y eliminar los datos persistidos** (base de datos):

```bash
docker compose down -v
```

---

## Variables de entorno

El archivo `.env` en la raíz del proyecto controla la configuración:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto interno del backend | `3000` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | `change_this_secret_in_production` |
| `JWT_EXPIRES_IN` | Tiempo de vida del token | `1h` |
| `APP_PORT` | Puerto en el host donde se expone la app | `80` |

> **Importante:** Cambia `JWT_SECRET` por una cadena larga y aleatoria antes de usar en producción.  
> Ejemplo: `openssl rand -hex 32`

---

## Estructura del proyecto

```
helloWorld/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── db/           # Configuración SQLite
│   │   ├── middleware/   # Auth JWT
│   │   └── routes/       # Rutas API
│   ├── server.js
│   └── Dockerfile
├── frontend/             # Angular 17 SPA
│   ├── src/app/
│   │   ├── core/         # Services + Guards
│   │   └── pages/        # Landing, Login, Register, Dashboard
│   ├── nginx.conf        # Proxy inverso + SPA routing
│   └── Dockerfile        # Multi-stage build
├── docker-compose.yml
├── .env                  # Variables de entorno
└── README.md
```

---

## Endpoints de la API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Registrar usuario |
| `POST` | `/api/auth/login` | No | Iniciar sesión |
| `GET` | `/api/auth/verify` | Bearer JWT | Verificar token |
| `GET` | `/api/health` | No | Health check |

---

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Reconstruir solo el backend
docker compose up --build backend

# Acceder al contenedor del backend
docker exec -it helloworld-backend sh

# Verificar estado de los contenedores
docker compose ps
```

---

## Datos persistentes

La base de datos SQLite se guarda en un volumen Docker llamado `backend_data`.  
Los datos **sobreviven** reinicios del contenedor. Para borrarlos:

```bash
docker compose down -v
```

---

## Notas de seguridad para producción

- Cambia `JWT_SECRET` por una clave fuerte (`openssl rand -hex 32`)
- Usa HTTPS con un reverse proxy (Nginx/Traefik) delante de la app
- No expongas el puerto `3000` del backend directamente al exterior
- Considera agregar rate limiting al endpoint de login
