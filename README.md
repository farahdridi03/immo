# Full-Stack Web Application Architecture

A clean, scalable, maintainable **monorepo frontend + backend project foundation** ready for domain feature development.

---

## 1. Project Structure

```text
internship/
├── frontend/                  # Next.js App Router Frontend
│   ├── src/
│   │   ├── app/               # App Router pages, layouts, globals.css, metadata, SEO
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui primitives (button, card, badge)
│   │   │   ├── layout/        # Header, Footer, PageContainer
│   │   │   └── shared/        # Shared reusable components
│   │   ├── features/          # Domain features (prepared for feature additions)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities (clsx/tailwind-merge cn helper, env configuration)
│   │   ├── services/
│   │   │   └── api/           # Centralized API service client abstraction (client.ts, health.ts)
│   │   ├── types/             # Shared TypeScript interfaces (api.ts)
│   │   ├── constants/         # Application constants
│   │   └── styles/            # CSS theme tokens & styles
│   ├── public/                # Static public assets
│   ├── components.json        # shadcn/ui configuration
│   ├── next.config.ts         # Next.js configuration
│   ├── package.json           # Frontend dependencies & npm scripts
│   ├── tsconfig.json          # TypeScript strict mode configuration
│   ├── postcss.config.mjs     # PostCSS CSS pipeline setup
│   ├── eslint.config.mjs      # ESLint code quality configuration
│   └── .env.local.example     # Frontend environment variables template
│
├── backend/                   # Django REST Framework Backend
│   ├── config/                # Project settings package
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py        # Core Django & DRF settings, PostgreSQL configuration, CORS
│   │   │   ├── development.py # Development overrides (DEBUG=True)
│   │   │   └── production.py  # Production security defaults (DEBUG=False, security headers)
│   │   ├── __init__.py
│   │   ├── urls.py            # Main URL router with /api/v1/ prefix
│   │   ├── asgi.py            # ASGI entrypoint
│   │   └── wsgi.py            # WSGI entrypoint
│   ├── apps/
│   │   ├── __init__.py
│   │   └── core/              # Foundation app (health check view, custom exception handlers)
│   │       ├── __init__.py
│   │       ├── apps.py
│   │       ├── views.py       # HealthCheckView (GET /api/v1/health/)
│   │       ├── urls.py        # Core API routes
│   │       ├── exceptions.py  # Custom DRF exception response handler
│   │       └── tests/         # App unit tests
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies (Django, DRF, psycopg, django-cors-headers, python-dotenv)
│   └── .env.example           # Backend environment variables template
│
├── .gitignore                 # Root monorepo gitignore rules
└── README.md                  # System architectural documentation & setup guide
```

---

## 2. Technologies & Versions Used

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Library**: React 19+
- **Language**: TypeScript 5+ (Strict Mode enabled)
- **Styling**: Tailwind CSS 4+
- **UI Primitives**: shadcn/ui foundation (`clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`)
- **Linting**: ESLint

### Backend
- **Framework**: Django 5.2+
- **API Engine**: Django REST Framework 3.18+
- **Database Engine**: PostgreSQL
- **Database Driver**: `psycopg` v3 (`psycopg[binary]`)
- **CORS Handling**: `django-cors-headers`
- **Environment Management**: `python-dotenv`

---

## 3. PostgreSQL Database Requirement

PostgreSQL is **mandatory**. SQLite is strictly excluded from configuration and is not used in development or production.

Database credentials are fully environment-variable driven:

```env
POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## 4. Environment Variables Setup

### Frontend Environment Setup
Copy `.env.local.example` to `frontend/.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Contents of `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Backend Environment Setup
Copy `.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Contents of `backend/.env`:
```env
SECRET_KEY=django-insecure-change-this-key-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## 5. How to Install Dependencies

### Frontend Dependencies
```bash
cd frontend
npm install
```

### Backend Dependencies
```bash
# Create Python Virtual Environment inside backend/
python -m venv backend/.venv

# Activate Virtual Environment
# Windows:
backend\.venv\Scripts\activate
# Linux/macOS:
source backend/.venv/bin/activate

# Install Python requirements
pip install -r backend/requirements.txt
```

---

## 6. How to Run Frontend & Backend locally

### Running the Backend Development Server
```bash
# Activate virtual environment
backend\.venv\Scripts\activate

# Run system check
python backend/manage.py check

# Start Django REST API server on http://localhost:8000
python backend/manage.py runserver
```

Backend REST API endpoints will be accessible at:
- Health check: `http://localhost:8000/api/v1/health/`

### Running the Frontend Development Server
```bash
cd frontend
npm run dev
```

Frontend application will be accessible at:
- Web App: `http://localhost:3000`

---

## 7. Frontend ↔ Backend Communication Architecture

- **No Raw Fetch Calls**: Direct call of `fetch()` inside UI components is prohibited.
- **Service Layer Abstraction**: All API interactions pass through `frontend/src/services/api/client.ts` (`apiClient`).
- **Environment API Endpoint**: The API base URL is resolved via `process.env.NEXT_PUBLIC_API_URL`.
- **CORS Setup**: `django-cors-headers` middleware inspects incoming HTTP origins against `CORS_ALLOWED_ORIGINS` configured in `backend/.env`.
