# ResourceHub

A production-quality, multi-tenant **resource reservation and scheduling platform** for organisations that manage scarce shared assets — meeting rooms, GPUs, lab equipment, vehicles, and more.

---

## What it does

Members of an organisation can browse available resources, view a live calendar of existing bookings, and reserve time slots in seconds. Admins can manage the resource catalogue, view all bookings across the org, and cancel any reservation.

**Key behaviours:**
- Double-booking is **impossible** — enforced at the database level, not in JavaScript
- Sessions are stateless JWT tokens stored in `httpOnly` cookies — XSS-proof by default
- All times are displayed in the organisation's IANA timezone, not the browser's local time
- Booking conflicts return a specific `SLOT_TAKEN` error with an inline message — the form stays open so users can pick another slot

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, TanStack Query v5 |
| Forms & validation | React Hook Form, Zod |
| UI | Tailwind CSS, shadcn/ui, react-big-calendar |
| Backend | Node.js, Express 5 (ES Modules) |
| ORM | Prisma 7 |
| Database | PostgreSQL 18 |
| Auth | JWT in `httpOnly` cookie (`sameSite: lax`) |
| Logging | pino + pino-http |
| Security | Helmet, CORS, express-rate-limit |

---

## Running locally

### Prerequisites

- Node.js ≥ 20
- PostgreSQL 18 running locally

### 1. Clone and install

```bash
git clone https://github.com/VenkataHemaSai/ResourceHub.git
cd ResourceHub

# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env — set DATABASE_URL, JWT_SECRET
```

Minimum required values in `server/.env`:

```
DATABASE_URL=postgresql://resourcehub_user:yourpassword@localhost:5432/resourcehub
JWT_SECRET=a-random-string-of-at-least-32-characters
NODE_ENV=development
PORT=5000
```

### 3. Set up the database

Create the database and user in psql, then run Prisma migrations and seed:

```bash
cd server
npx prisma migrate deploy
npx prisma db seed
```

### 4. Start the backend

```bash
cd server
npm run dev
# API available at http://localhost:5000
```

### 5. Start the frontend

```bash
cd client
npm run dev
# UI available at http://localhost:5173
```

### 6. Log in

After seeding, use these credentials:

| Field | Value |
|---|---|
| Email | `admin@acme.com` |
| Password | `password123` |
| Organisation | Acme Corporation |

---

## API overview

All routes are prefixed with `/api/v1`. Auth routes are rate-limited to 20 requests per 15 minutes.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login, sets cookie |
| POST | `/auth/logout` | Auth | Clear cookie |
| GET | `/auth/me` | Auth | Current user + org |
| GET | `/resources` | Auth | List resources |
| GET | `/resources/:id` | Auth | Get single resource |
| POST | `/resources` | Admin | Create resource |
| PATCH | `/resources/:id` | Admin | Update resource |
| POST | `/resources/:id/deactivate` | Admin | Deactivate |
| POST | `/resources/:id/reactivate` | Admin | Reactivate |
| GET | `/resources/:id/reservations` | Auth | Calendar feed |
| GET | `/resources/:id/availability` | Auth | Free slots for a day |
| GET | `/reservations/mine` | Auth | My reservations |
| POST | `/reservations` | Auth | Create reservation |
| POST | `/reservations/:id/cancel` | Auth | Cancel |
| GET | `/reservations` | Admin | All org reservations |
| GET | `/users` | Admin | List members |
| POST | `/users` | Admin | Add member |

---

## How double-booking is prevented

The application uses a **two-layer** approach:

1. **Application pre-check** — Before inserting, the service queries for any overlapping `CONFIRMED` reservation for the same resource. If one exists, it returns a `409 SLOT_TAKEN` immediately with a friendly UI message.

2. **Database exclusion constraint** — A Postgres `btree_gist` exclusion constraint on the `reservations` table makes overlapping inserts for the same resource physically impossible, even under concurrent load. If two requests slip through the application check simultaneously, the database will reject one with `SQLSTATE 23P01`, which is caught and mapped to `SLOT_TAKEN`.

This means correctness is guaranteed at the storage layer, not just in application code.

---

## Project structure

```
ResourceHub/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── api/                   # apiClient, date utils, error messages
│       ├── components/
│       │   ├── shared/            # PageHeader, ProtectedRoute, RoleGate, etc.
│       │   └── ui/                # shadcn/ui primitives
│       ├── context/               # AuthContext (TanStack Query + JWT)
│       ├── layouts/               # AppLayout (nav), PublicLayout
│       ├── pages/
│       │   ├── admin/             # AdminReservationsPage
│       │   ├── auth/              # LoginPage, RegisterPage
│       │   ├── dashboard/         # HomePage
│       │   ├── resources/         # ResourcesPage, ResourceDetailPage
│       │   ├── reservations/      # ReservationsPage
│       │   └── team/              # TeamPage
│       └── routes/                # createBrowserRouter config
└── server/                        # Express 5 backend
    └── src/
        ├── controllers/           # Route handler functions
        │   ├── auth/
        │   ├── reservations/
        │   └── resources/
        ├── middleware/            # requireAuth, requireRole, validate, errorHandler
        ├── routes/                # Express routers
        ├── services/              # Business logic (reservationService, resourceService)
        └── utils/                 # prisma client, errors, auth helpers, logger
```
