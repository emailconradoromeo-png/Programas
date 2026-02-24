# EGINMOTEG - Plataforma Inmobiliaria de Guinea Ecuatorial

Plataforma inmobiliaria inteligente para Guinea Ecuatorial. Permite la publicacion, busqueda y gestion de propiedades con soporte multilingue (Espanol/Frances), multi-moneda (XAF/EUR/USD) y busqueda geoespacial.

## Stack Tecnologico

- **Backend**: Django 5.x + Django REST Framework + PostgreSQL/PostGIS + Redis + Celery
- **Frontend**: Next.js 14+ + TypeScript + Tailwind CSS + React Query
- **Infraestructura**: Docker Compose + Nginx

## Inicio Rapido

### 1. Clonar y configurar

```bash
git clone <repo-url>
cd EGINMOTEG
cp .env.example .env
# Editar .env con tus valores
```

### 2. Levantar con Docker

```bash
docker-compose up --build
```

Servicios disponibles:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **API Docs (Swagger)**: http://localhost:8000/api/docs/
- **Admin Django**: http://localhost:8000/admin/

### 3. Ejecutar migraciones y crear superusuario

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

## Estructura del Proyecto

```
EGINMOTEG/
├── backend/           # Django API
│   ├── apps/
│   │   ├── accounts/  # Usuarios, autenticacion, KYC
│   │   ├── properties/# Catalogo de propiedades
│   │   ├── listings/  # Anuncios y favoritos
│   │   ├── search/    # Busqueda y filtros geoespaciales
│   │   ├── messaging/ # Chat y notificaciones
│   │   ├── payments/  # Suscripciones y pagos
│   │   ├── contracts/ # Contratos (placeholder)
│   │   └── core/      # Utilidades compartidas
│   └── config/        # Settings Django
├── frontend/          # Next.js App
│   └── src/
│       ├── app/       # Paginas (App Router)
│       ├── components/# Componentes reutilizables
│       ├── lib/       # Utilidades (API, auth, currency)
│       ├── hooks/     # Custom hooks
│       └── types/     # TypeScript types
├── nginx/             # Configuracion Nginx
└── docker-compose.yml
```

## API Endpoints

| Modulo | Base URL | Descripcion |
|--------|----------|-------------|
| Auth | `/api/v1/auth/` | Registro, login, perfil, KYC |
| Properties | `/api/v1/properties/` | CRUD de propiedades |
| Listings | `/api/v1/listings/` | Anuncios, favoritos |
| Search | `/api/v1/search/` | Busqueda con filtros y mapa |
| Messages | `/api/v1/messages/` | Conversaciones, notificaciones |
| Payments | `/api/v1/payments/` | Suscripciones y pagos |

## Idiomas

- Espanol (es) - por defecto
- Frances (fr)

## Monedas

- XAF (Franco CFA) - por defecto
- EUR (Euro)
- USD (Dolar)
