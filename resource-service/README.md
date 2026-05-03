# Resource Service — UrbanSpace

**Owner:** Abdullah  
**Package:** `COE_Group4.resource`  
**Deployed URL:** https://smarturban-resource-cvdgfzf7g5azhuce.uaenorth-01.azurewebsites.net

---

## What It Does

Manages all urban resources (sports courts, parks, libraries, etc.) available for booking. Citizens can browse resources; Service Providers can create and manage their own resources; Admins have full control. The booking-service calls this service to validate that a resource exists before accepting a booking.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/resources` | Public | List all resources (filterable) |
| GET | `/api/resources/{id}` | Public | Get a specific resource |
| GET | `/api/resources/my` | Authenticated | Resources owned by the current Service Provider |
| POST | `/api/resources` | ADMIN or SERVICE_PROVIDER | Create a new resource |
| PUT | `/api/resources/{id}` | ADMIN or SERVICE_PROVIDER (own only) | Update a resource |
| DELETE | `/api/resources/{id}` | ADMIN or SERVICE_PROVIDER (own only) | Delete a resource |
| GET | `/health` | Public | Health check |

### GET `/api/resources` — Query Parameters

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `type` | string | `PARK` | Filter by resource type |
| `available` | boolean | `true` | Filter by availability |

### POST `/api/resources` — Request Body

```json
{
  "name": "Al Mamzar Tennis Court A",
  "type": "SPORTS_COURT",
  "location": "Al Mamzar, Dubai",
  "latitude": 25.2854,
  "longitude": 55.3644,
  "capacity": 4,
  "openingTime": "07:00",
  "closingTime": "22:00",
  "description": "Outdoor hard-surface tennis court",
  "available": true
}
```

**Ownership logic:**
- Service Provider → `ownerId` is automatically set to their user ID (cannot override)
- Admin → `ownerId` is left null (platform-owned resource)

---

## Resource Types

`SPORTS_COURT`, `LIBRARY`, `PARK`, `COMMUNITY_CENTER`, `PARKING`

---

## Role-Based Access

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| Public / CITIZEN | All resources | — | — | — |
| SERVICE_PROVIDER | All + `/my` | Own resources | Own resources only | Own resources only |
| ADMIN | All | Any | Any | Any |

---

## Database

Table: `resources` (shared Azure PostgreSQL — `smarturban-db`)

| Column | Type | Notes |
|--------|------|-------|
| `resource_id` | bigint | Auto-generated sequence |
| `name` | varchar | |
| `type` | varchar | Resource type enum value |
| `location` | varchar | Human-readable address |
| `latitude` | double | For map display |
| `longitude` | double | For map display |
| `capacity` | int | Max simultaneous users |
| `opening_time` | time | Format: HH:mm |
| `closing_time` | time | Format: HH:mm |
| `description` | text | |
| `available` | boolean | Whether bookable right now |
| `owner_id` | bigint | Nullable — set for SP-owned resources |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_URL` | PostgreSQL connection string |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Shared JWT signing secret |
| `WEBSITES_PORT` | `80` |

---

## Build & Deploy

```bash
# Build
cd resource-service
mvn clean package -DskipTests

# Deploy (from Azure Cloud Shell)
az webapp deploy --resource-group smarturban-rg \
  --name smarturban-resource \
  --src-path ~/resource-service-0.0.1-SNAPSHOT.jar --type jar
```

> **Important:** When other services reference this service, use the full Azure URL:
> `https://smarturban-resource-cvdgfzf7g5azhuce.uaenorth-01.azurewebsites.net`
> The short form `smarturban-resource.azurewebsites.net` causes `UnknownHostException`.

---

## Key Files

```
src/main/java/COE_Group4/resource/
├── ResourceServiceApplication.java
├── config/CorsConfig.java
├── controller/
│   ├── ResourceController.java       # All CRUD endpoints
│   └── HealthController.java
├── dto/ResourceDto.java              # Lightweight DTO for inter-service calls
├── entity/Resource.java              # Resource JPA entity
├── repository/ResourceRepository.java
├── service/ResourceService.java      # Business logic + ownership enforcement
├── security/
│   ├── JwtAuthFilter.java
│   ├── JwtService.java
│   ├── SecurityConfig.java
│   └── UserContext.java
└── exception/ResourceExceptionHandler.java
```
