# 🏙️ UrbanSpace — Smart Urban Resources Platform

> **CMP404 Cloud Computing** · Group 4 · American University of Sharjah · Spring 2026  
> **Team:** Ahmed (auth · deployment · frontend) · Alaa (booking) · Abdullah (resource) · Sinan (issue)

**Live App:** [smarturbanresources.netlify.app](https://smarturbanresources.netlify.app)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Microservices](#microservices)
- [Database Schema](#database-schema)
- [Security Model](#security-model)
- [Frontend](#frontend)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Azure Infrastructure](#azure-infrastructure)
- [Troubleshooting](#troubleshooting)
- [Future Work](#future-work)

---

## Overview

UrbanSpace is a cloud-native platform for managing and booking smart urban resources — sports courts, parks, libraries, community centers, and more. Citizens can browse and book resources, service providers can list and manage their own spaces, and admins oversee the entire platform including issue resolution.

### Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot (5 microservices) |
| Frontend | React 18 + Vite 5 |
| Database | Azure PostgreSQL Flexible Server |
| Cloud | Microsoft Azure (UAE North) |
| Auth | Self-managed JWT (HMAC-SHA512) |
| Storage | Azure Blob Storage |
| Frontend Hosting | Netlify |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Netlify (Frontend)                        │
│              smarturbanresources.netlify.app                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
   │ auth-service│  │  resource   │  │   booking   │
   │   (Azure)   │  │  -service   │  │   -service  │
   └─────────────┘  └──────┬──────┘  └──────┬──────┘
                           │RestTemplate     │
   ┌─────────────┐         └────────────────┘
   │issue-service│
   │   (Azure)   │──── Azure Blob Storage (images)
   └─────────────┘
   ┌─────────────┐
   │  profile-   │
   │   service   │
   └──────┬──────┘
          │
   ┌──────▼──────────────────────────────────────┐
   │     Azure PostgreSQL Flexible Server         │
   │   smarturban-db (Zone-Redundant HA)          │
   │   Tables: users · resources · bookings ·     │
   │           issues                             │
   └─────────────────────────────────────────────┘

All services deployed inside smarturban-vnet (10.0.0.0/16)
Resource Group: smarturban-rg · Region: UAE North
App Service Plan: smarturban-plan (B3 Linux)
```

---

## Microservices

### 1. auth-service
**URL:** `https://smarturban-auth-a2d9dkahdzcwaser.uaenorth-01.azurewebsites.net`  
**Package:** `COE_Group4.auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register — role field sets `SERVICE_PROVIDER`, otherwise `CITIZEN` |
| POST | `/auth/login` | Public | Returns JWT (24hr, HMAC-SHA512) |
| GET | `/health` | Public | Health check |

> ⚠️ `ADMIN` role cannot be self-registered. Promote via SQL — see [Security Model](#security-model).

---

### 2. resource-service
**URL:** `https://smarturban-resource-cvdgfzf7g5azhuce.uaenorth-01.azurewebsites.net`  
**Package:** `COE_Group4.resource`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/resources` | Public | List all (`?type=` · `?available=` filters) |
| GET | `/api/resources/{id}` | Public | Get single resource |
| GET | `/api/resources/my` | Authenticated | Resources owned by current user |
| POST | `/api/resources` | ADMIN · SERVICE_PROVIDER | Create resource |
| PUT | `/api/resources/{id}` | ADMIN (any) · SP (own only) | Update resource |
| DELETE | `/api/resources/{id}` | ADMIN (any) · SP (own only) | Delete resource |
| GET | `/health` | Public | Health check |

**Resource types:** `SPORTS_COURT` · `LIBRARY` · `PARK` · `COMMUNITY_CENTER` · `PARKING`

**Resource fields:** `resourceId`, `name`, `type`, `location`, `latitude`, `longitude`, `capacity`, `openingTime`, `closingTime`, `description`, `available`, `ownerId`

---

### 3. booking-service
**URL:** `https://smarturban-booking-bgevemc2h9eteabf.uaenorth-01.azurewebsites.net`  
**Package:** `COE_Group4.booking`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | Authenticated | Create booking |
| GET | `/api/bookings/my` | Authenticated | All my bookings |
| GET | `/api/bookings/my/active` | Authenticated | Active bookings only |
| GET | `/api/bookings/my/history` | Authenticated | Booking history |
| GET | `/api/bookings/{id}` | Authenticated (own) | Get single booking |
| PUT | `/api/bookings/{id}` | Authenticated (own) | Update booking |
| DELETE | `/api/bookings/{id}` | Authenticated (own) | Cancel booking |
| GET | `/health` | Public | Health check |

**Constraints:**
- Max **120 min** per booking
- Max **240 min** per user per day
- PostgreSQL advisory locks prevent double-booking
- Booking IDs are UUID (not sequential)
- Statuses: `ACTIVE` · `CANCELLED` · `COMPLETED`

---

### 4. issue-service
**URL:** `https://smarturban-issue-ekang8fkdxffaqgs.uaenorth-01.azurewebsites.net`  
**Package:** `COE_Group4.issue`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/issues` | Authenticated | Report issue (`resourceId`, `category`, `description`, `imageUrl?`) |
| POST | `/api/issues/upload-image` | Authenticated | Upload image → returns `{ imageUrl }` |
| GET | `/api/issues/my` | Authenticated | My reported issues |
| GET | `/api/issues` | ADMIN only | All issues |
| PUT | `/api/issues/{id}/status?status=` | ADMIN only | Update issue status |
| GET | `/health` | Public | Health check |

**Status lifecycle:** `SUBMITTED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`

**Categories:** `MAINTENANCE` · `SAFETY` · `CLEANLINESS` · `ACCESSIBILITY` · `DAMAGE` · `OTHER`

Images are stored in Azure Blob Storage (`smarturbanfiles` · container: `issue-images`).

---

### 5. user-profile-service
**URL:** `https://smarturban-profile.azurewebsites.net`  
**Package:** `COE_Group4.userprofile`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Authenticated | `{ id, email, fullName, role }` |
| PUT | `/api/users/me` | Authenticated | Update `fullName` only |
| GET | `/api/users/me/stats` | Authenticated | `{ totalBookings, activeBookings, totalIssues, openIssues }` |
| GET | `/health` | Public | Health check |

Queries the shared database directly using native COUNT queries — no inter-service HTTP calls.

---

## Database Schema

**Host:** `smarturban-db.postgres.database.azure.com` · Port `5432` · SSL required  
**Tier:** General Purpose · Standard_D2s_v3 (2 vCores · 8 GB RAM)  
**HA:** Zone-redundant (Primary zone 1 · Standby zone 2) · 7-day backup retention

```sql
-- users
id          BIGINT (sequence)
email       TEXT UNIQUE
full_name   TEXT
password_hash TEXT  -- BCrypt
role        TEXT    -- CHECK: CITIZEN | ADMIN | SERVICE_PROVIDER
created_at  TIMESTAMP

-- resources
resource_id BIGINT (sequence)
name        TEXT
type        TEXT
location    TEXT
latitude    DOUBLE
longitude   DOUBLE
capacity    INT
opening_time  TIME
closing_time  TIME
description TEXT
available   BOOLEAN
owner_id    BIGINT (nullable)

-- bookings
id          UUID
user_id     BIGINT
resource_id BIGINT
start_time  TIMESTAMP
end_time    TIMESTAMP
status      TEXT    -- ACTIVE | CANCELLED | COMPLETED
sub_amenity TEXT
created_at  TIMESTAMP
updated_at  TIMESTAMP

-- issues
id          BIGINT (sequence)
user_id     BIGINT
resource_id BIGINT
category    TEXT
description TEXT
status      TEXT    -- SUBMITTED | IN_PROGRESS | RESOLVED | CLOSED
image_url   TEXT (nullable)
created_at  TIMESTAMP
```

---

## Security Model

- **JWT:** HMAC-SHA512, 24-hour expiry, claims: `id`, `email`, `name`, `role`
- All 5 services share `JWT_SECRET` for independent stateless token validation
- Each service implements: `JwtService` · `JwtAuthFilter` · `UserContext` · `SecurityConfig`
- CORS: all origins allowed (`CorsConfig.java`)
- OPTIONS preflight bypassed in `JwtAuthFilter`

### Role Permissions

| Endpoint Group | CITIZEN | SERVICE_PROVIDER | ADMIN |
|---|:---:|:---:|:---:|
| Browse resources | ✅ | ✅ | ✅ |
| Book resources (own) | ✅ | ✅ | ✅ |
| Report issues (own) | ✅ | ✅ | ✅ |
| User profile | ✅ | ✅ | ✅ |
| Create / manage own resources | ❌ | ✅ | ✅ |
| Manage any resource | ❌ | ❌ | ✅ |
| View all issues | ❌ | ❌ | ✅ |
| Update issue status | ❌ | ❌ | ✅ |

### Promote a user to ADMIN

```sql
UPDATE users SET role='ADMIN' WHERE email='your@email.com';
```

### Required Spring Boot fix (all services)

Add to `application.properties` to suppress auto-generated security password:

```properties
spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration
```

---

## Frontend

**Live:** [smarturbanresources.netlify.app](https://smarturbanresources.netlify.app)  
**Stack:** React 18 · Vite 5 · React Router DOM v6 · Leaflet + react-leaflet  
**Fonts:** DM Sans (body) · Playfair Display (headings)  
**Brand color:** Teal `#0D7377`

### Role-based UI

| Feature | CITIZEN | SERVICE_PROVIDER | ADMIN |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ (provider view) | ✅ |
| Resources | ✅ | ✅ | ✅ |
| My Bookings | ✅ | ✅ | ✅ |
| Report Issue | ✅ | ✅ | ✅ |
| My Resources | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |

### Key Features

- Dark / light mode toggle persisted in `localStorage`
- Category filter pills with neon glow + fade-up animation
- Calendly-style booking modal with calendar grid and 12-hour time slots
- Leaflet map picker for resource latitude/longitude
- Image upload for issues with lightbox preview (Azure Blob)
- Color-coded issue status dropdowns in Admin Panel
- Available / Unavailable toggle buttons on Resources page

### Local Setup

```bash
# Install dependencies
npm install

# Create .env file (never commit this)
VITE_AUTH_URL=https://smarturban-auth-a2d9dkahdzcwaser.uaenorth-01.azurewebsites.net
VITE_RESOURCE_URL=https://smarturban-resource-cvdgfzf7g5azhuce.uaenorth-01.azurewebsites.net
VITE_BOOKING_URL=https://smarturban-booking-bgevemc2h9eteabf.uaenorth-01.azurewebsites.net
VITE_ISSUE_URL=https://smarturban-issue-ekang8fkdxffaqgs.uaenorth-01.azurewebsites.net

# Start dev server
npm run dev

# Build for production
npm run build
# Then drag dist/ folder to Netlify dashboard
```

`public/_redirects` contains `/* /index.html 200` to fix SPA client-side routing on Netlify.

---

## Environment Variables

All five services require the following environment variables set in Azure App Service Configuration:

```
DB_URL=jdbc:postgresql://smarturban-db.postgres.database.azure.com:5432/smarturban?sslmode=require
DB_USERNAME=smarturbanadmin
DB_PASSWORD=<redacted — rotate if exposed>
JWT_SECRET=<redacted — rotate if exposed>
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=3
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=1
WEBSITES_PORT=80
```

**booking-service** also requires:
```
RESOURCE_SERVICE_URL=https://smarturban-resource-cvdgfzf7g5azhuce.uaenorth-01.azurewebsites.net
```

> ⚠️ Do **not** use `smarturban-resource.azurewebsites.net` — this causes an `UnknownHostException`. Use the full URL above.

**issue-service** also requires:
```
AZURE_STORAGE_CONNECTION_STRING=<redacted>
```

---

## Deployment

### Build a service

```bash
cd <service-folder>
mvn clean package -DskipTests
```

### Deploy to Azure

```bash
# If AUS account blocks Azure CLI, run this from Cloud Shell at portal.azure.com
az webapp deploy \
  --resource-group smarturban-rg \
  --name smarturban-[auth|resource|booking|issue|profile] \
  --src-path ~/service-name-0.0.1-SNAPSHOT.jar \
  --type jar
```

### Stream logs

```bash
az webapp log tail \
  --resource-group smarturban-rg \
  --name smarturban-[service]
```

---

## Azure Infrastructure

| Resource | Type | Details |
|---|---|---|
| `smarturban-rg` | Resource Group | UAE North |
| `smarturban-plan` | App Service Plan | B3 Linux |
| `smarturban-auth` | App Service | auth-service |
| `smarturban-resource` | App Service | resource-service |
| `smarturban-booking` | App Service | booking-service |
| `smarturban-issue` | App Service | issue-service |
| `smarturban-profile` | App Service | user-profile-service |
| `smarturban-db` | PostgreSQL Flexible Server | D2s_v3 · Zone-redundant HA |
| `smarturban-vnet` | Virtual Network | 10.0.0.0/16 |
| `smarturbanfiles` | Storage Account | LRS · UAE North |
| `issue-images` | Blob Container | Public blob access |

All App Services are connected to `smarturban-vnet` via VNet Integration. The PostgreSQL firewall allows the VNet range `10.0.0.0–10.0.255.255`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ConflictingBeanDefinitionException` | Duplicate `CorsConfig` in root package and `config/` subpackage | Delete the one in the root package |
| `"Using generated security password"` in logs | Spring Security auto-configuration active | Add `spring.autoconfigure.exclude=...UserDetailsServiceAutoConfiguration` to `application.properties` |
| booking-service returns `500` on create | Wrong `RESOURCE_SERVICE_URL` env var | Set to the full Azure URL (see [Environment Variables](#environment-variables)) |
| Container startup timeout (230s) | Service crashing on startup | Run `az webapp log tail` to inspect logs |
| Azure CLI auth fails | AUS account restrictions | Use Azure Cloud Shell at [portal.azure.com](https://portal.azure.com) instead |

---

## Future Work

- [ ] **API Gateway** — placeholder service exists, not yet implemented
- [ ] **Resource photo upload** — image upload currently only available for issues
- [ ] **Booking analytics** — provider dashboard endpoint for usage statistics
- [ ] **Profile UI** — `user-profile-service` backend is live but not yet connected to the frontend
- [ ] **Tighten DB firewall** — remove the `AllowAll` rule (`0.0.0.0–255.255.255.255`) after project demo
- [ ] **API Gateway / rate limiting** — currently no gateway layer in front of the microservices

---

<div align="center">

Built for **CMP404 Cloud Computing** · American University of Sharjah · Spring 2026

</div>
