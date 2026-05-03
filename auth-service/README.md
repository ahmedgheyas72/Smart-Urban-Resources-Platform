# Auth Service — UrbanSpace

**Owner:** Ahmed  
**Package:** `COE_Group4.auth`  
**Deployed URL:** https://smarturban-auth-a2d9dkahdzcwaser.uaenorth-01.azurewebsites.net

---

## What It Does

Handles user registration and login for the entire UrbanSpace platform. It is the single source of truth for user identity. Every other service validates the JWT tokens that this service issues — they do NOT call back to auth-service at runtime; they each hold the same `JWT_SECRET` and verify tokens independently.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Create a new user account |
| POST | `/auth/login` | Public | Authenticate and receive a JWT |
| GET | `/health` | Public | Health check (returns 200 OK) |

### POST `/auth/register`

**Request body:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "SERVICE_PROVIDER"
}
```

**Role assignment logic:**
- `"role": "SERVICE_PROVIDER"` → account gets `SERVICE_PROVIDER` role
- Anything else (or omitted) → account gets `CITIZEN` role
- `ADMIN` **cannot** be self-registered — must be set directly in the database

**Response (201 Created):**
```json
{
  "token": "<JWT>",
  "id": 1,
  "email": "jane@example.com",
  "fullName": "Jane Doe",
  "role": "SERVICE_PROVIDER"
}
```

### POST `/auth/login`

**Request body:**
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response (200 OK):** Same shape as register response.

---

## JWT Token

- Algorithm: HMAC-SHA512
- Expiry: 24 hours
- Claims included: `id`, `email`, `name`, `role`
- All 5 services share the same `JWT_SECRET` env var to validate tokens without calling this service

**To promote a user to ADMIN** (requires direct DB access via psql):
```sql
UPDATE users SET role='ADMIN' WHERE email='your@email.com';
```

---

## Database

Table: `users` (shared Azure PostgreSQL — `smarturban-db`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | Auto-generated sequence |
| `email` | varchar | Unique |
| `full_name` | varchar | |
| `password_hash` | varchar | BCrypt hashed |
| `role` | varchar | CITIZEN, ADMIN, SERVICE_PROVIDER |
| `created_at` | timestamp | |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_URL` | `jdbc:postgresql://smarturban-db.postgres.database.azure.com:5432/smarturban?sslmode=require` |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | HMAC-SHA512 signing secret (shared across all services) |
| `WEBSITES_PORT` | `80` (Azure App Service) |

---

## Build & Deploy

```bash
# Build
cd auth-service
mvn clean package -DskipTests

# Deploy (from Azure Cloud Shell)
az webapp deploy --resource-group smarturban-rg \
  --name smarturban-auth \
  --src-path ~/auth-service-0.0.1-SNAPSHOT.jar --type jar
```

---

## Key Files

```
src/main/java/COE_Group4/auth/
├── AuthServiceApplication.java       # Entry point
├── CorsConfig.java                   # Allows all origins (CORS)
├── controller/
│   ├── AuthController.java           # /auth/register, /auth/login
│   └── HealthController.java         # /health
├── dto/
│   ├── RegisterRequest.java
│   ├── LoginRequest.java
│   └── AuthResponse.java
├── entity/User.java                  # User JPA entity
├── repository/UserRepository.java
├── service/
│   ├── AuthService.java              # Registration + login logic
│   └── JwtService.java              # Token generation
└── exception/GlobalExceptionHandler.java
```
