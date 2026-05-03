# User Profile Service — UrbanSpace

**Owner:** Ahmed  
**Package:** `COE_Group4.userprofile`  
**Deployed URL:** https://smarturban-profile.azurewebsites.net

---

## What It Does

Provides each user with a view of their own account information and activity statistics. Users can update their display name and see a summary of their bookings and issues without needing to query other services directly. This service reads from the shared database tables (`users`, `bookings`, `issues`) using native SQL queries — it makes no HTTP calls to other services.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | Authenticated | Get current user's profile |
| PUT | `/api/users/me` | Authenticated | Update display name |
| GET | `/api/users/me/stats` | Authenticated | Get activity statistics |
| GET | `/health` | Public | Health check |

### GET `/api/users/me` — Response

```json
{
  "id": 42,
  "email": "jane@example.com",
  "fullName": "Jane Doe",
  "role": "CITIZEN"
}
```

### PUT `/api/users/me` — Request Body

```json
{
  "fullName": "Jane Smith"
}
```

Only `fullName` can be updated. Email and role are immutable via this endpoint.

### GET `/api/users/me/stats` — Response

```json
{
  "totalBookings": 12,
  "activeBookings": 2,
  "totalIssues": 5,
  "openIssues": 1
}
```

| Stat | What It Counts |
|------|----------------|
| `totalBookings` | All bookings ever made by this user |
| `activeBookings` | Bookings with status `ACTIVE` |
| `totalIssues` | All issues ever reported by this user |
| `openIssues` | Issues with status `SUBMITTED` or `IN_PROGRESS` |

---

## How Stats Are Computed

The `StatsRepository` uses native PostgreSQL COUNT queries directly against the `bookings` and `issues` tables in the shared database. There are no HTTP calls to booking-service or issue-service. This is intentional: reading counts from SQL is faster and simpler than aggregating HTTP responses.

---

## Database

This service reads from three tables in the shared Azure PostgreSQL database:

- `users` — for profile data (read + update `full_name`)
- `bookings` — for booking count stats (read-only)
- `issues` — for issue count stats (read-only)

The service does **not** own or write to the `bookings` or `issues` tables.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_URL` | `jdbc:postgresql://smarturban-db.postgres.database.azure.com:5432/smarturban?sslmode=require` |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Shared JWT signing secret |
| `WEBSITES_PORT` | `80` |

---

## Build & Deploy

```bash
# Build
cd user-profile-service
mvn clean package -DskipTests

# Deploy (from Azure Cloud Shell)
az webapp deploy --resource-group smarturban-rg \
  --name smarturban-profile \
  --src-path ~/user-profile-service-0.0.1-SNAPSHOT.jar --type jar
```

---

## Key Files

```
src/main/java/COE_Group4/userprofile/
├── UserProfileApplication.java
├── config/CorsConfig.java
├── controller/
│   ├── UserProfileController.java    # /me, /me (PUT), /me/stats
│   └── HealthController.java
├── dto/
│   ├── UserProfileDto.java           # { id, email, fullName, role }
│   ├── UpdateProfileRequest.java     # { fullName }
│   └── UserStatsDto.java             # { totalBookings, activeBookings, totalIssues, openIssues }
├── entity/User.java                  # Read-only view of the users table
├── repository/
│   ├── UserRepository.java           # Find + update user
│   └── StatsRepository.java         # Native COUNT queries for stats
├── service/UserProfileService.java   # Orchestrates profile + stats retrieval
├── security/
│   ├── JwtAuthFilter.java
│   ├── JwtService.java
│   ├── SecurityConfig.java
│   └── UserContext.java
└── exception/GlobalExceptionHandler.java
```
