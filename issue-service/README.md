# Issue Service — UrbanSpace

**Owner:** Sinan  
**Package:** `COE_Group4.issue`  
**Deployed URL:** https://smarturban-issue-ekang8fkdxffaqgs.uaenorth-01.azurewebsites.net

---

## What It Does

Lets authenticated users report problems with urban resources (damage, safety hazards, cleanliness, etc.) and optionally attach a photo. Admins can view all submitted issues and update their resolution status. Images are stored in Azure Blob Storage and served via a public URL.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/issues` | Authenticated | Submit a new issue report |
| POST | `/api/issues/upload-image` | Authenticated | Upload a photo → returns public URL |
| GET | `/api/issues/my` | Authenticated | Issues submitted by the current user |
| GET | `/api/issues` | ADMIN only | All issues across all users |
| PUT | `/api/issues/{id}/status?status=` | ADMIN only | Update issue resolution status |
| GET | `/health` | Public | Health check |

### POST `/api/issues` — Request Body

```json
{
  "resourceId": 3,
  "category": "SAFETY",
  "description": "Broken glass on the basketball court surface",
  "imageUrl": "https://smarturbanfiles.blob.core.windows.net/issue-images/abc123.jpg"
}
```

`imageUrl` is optional. Upload the image first using `/upload-image`, then include the returned URL here.

### POST `/api/issues/upload-image`

**Content-Type:** `multipart/form-data`  
**Field name:** `file`

**Response:**
```json
{
  "imageUrl": "https://smarturbanfiles.blob.core.windows.net/issue-images/abc123.jpg"
}
```

### PUT `/api/issues/{id}/status`

**Query param:** `?status=IN_PROGRESS`

Allowed status values: `SUBMITTED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

---

## Issue Categories

| Category | When to Use |
|----------|-------------|
| `MAINTENANCE` | General wear and equipment failure |
| `SAFETY` | Hazards that could injure users |
| `CLEANLINESS` | Litter, graffiti, unsanitary conditions |
| `ACCESSIBILITY` | Barriers for users with disabilities |
| `DAMAGE` | Vandalism or structural damage |
| `OTHER` | Anything not covered above |

---

## Issue Status Lifecycle

```
SUBMITTED → IN_PROGRESS → RESOLVED → CLOSED
```

Only ADMIN can move an issue through these statuses.

---

## Azure Blob Storage

Images are stored in the `issue-images` container inside the `smarturbanfiles` storage account (UAE North). The container has **Blob public access** enabled, so image URLs are directly viewable in the browser without authentication.

The `AzureBlobService` class handles uploads using the `AZURE_STORAGE_CONNECTION_STRING` environment variable.

---

## Database

Table: `issues` (shared Azure PostgreSQL — `smarturban-db`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | Auto-generated sequence |
| `user_id` | bigint | User who submitted the issue |
| `resource_id` | bigint | Resource the issue is about |
| `category` | varchar | One of the 6 categories above |
| `description` | text | Free-text description |
| `status` | varchar | SUBMITTED, IN_PROGRESS, RESOLVED, CLOSED |
| `image_url` | varchar | Nullable — Azure Blob public URL |
| `created_at` | timestamp | |

Schema is managed with `ddl-auto=update` — the `image_url` column is added automatically on startup if missing.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_URL` | PostgreSQL connection string |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Shared JWT signing secret |
| `AZURE_STORAGE_CONNECTION_STRING` | Connection string for `smarturbanfiles` storage account |
| `WEBSITES_PORT` | `80` |

---

## Build & Deploy

```bash
# Build
cd issue-service
mvn clean package -DskipTests

# Deploy (from Azure Cloud Shell)
az webapp deploy --resource-group smarturban-rg \
  --name smarturban-issue \
  --src-path ~/issue-service-0.0.1-SNAPSHOT.jar --type jar
```

---

## Key Files

```
src/main/java/COE_Group4/issue/
├── IssueServiceApplication.java
├── config/CorsConfig.java
├── controller/
│   ├── IssueController.java          # All issue endpoints + image upload
│   └── HealthController.java
├── dto/CreateIssueRequest.java       # Validated request body
├── entity/Issue.java                 # Issue JPA entity
├── repository/IssueRepository.java
├── service/
│   ├── IssueService.java             # CRUD + status transitions
│   └── AzureBlobService.java         # Azure Blob Storage upload logic
├── security/
│   ├── JwtAuthFilter.java
│   ├── JwtService.java
│   ├── SecurityConfig.java
│   └── UserContext.java
└── exception/IssueExceptionHandler.java
```
