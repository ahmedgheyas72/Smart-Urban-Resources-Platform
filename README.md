# Smart Urban Resources Platform

A cloud-based smart city platform that enables citizens to discover, book, and report issues on public urban resources - including halls, sports facilities, equipment, parking spots, and infrastructure units.

---

## Table of Contents

- [About](#about)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Services](#services)
- [API Endpoints](#api-endpoints)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [Future Extensions](#future-extensions)

---

## About

The platform provides a unified interface for users to:

- **Search** for nearby public resources by location and type
- **View** detailed information (capacity, features, operating hours)
- **Book** resources for specific time slots
- **Report** maintenance or safety issues with descriptions, categories, and media proof
- **Track** the resolution status of submitted reports

Administrators (e.g., government authorities) can add/manage resources and handle reported issues.

---

## Architecture

The system uses a **Consolidated Microservices Architecture** — a pragmatic hybrid that groups tightly coupled domains while keeping distinct ones independent.

```
Client (Web / Mobile)
        │
        ▼
   API Gateway
    ┌───┴───┐
    │       │
    ▼       ▼
Resource   Issue
& Booking  Reporting
Service    Service
    │       │
    ▼       ▼
PostgreSQL  Blob Storage
```

- **API Gateway** — Routes requests, enforces security policies, validates JWT tokens
- **Azure AD B2C** — Manages authentication, sign-ups, and RBAC
- **Azure App Service** — Hosts Spring Boot microservices (PaaS)
- **Azure PostgreSQL** — Structured data persistence
- **Azure Blob Storage** — Media file storage for issue reports

---

## Tech Stack

| Layer          | Technology                     |
|----------------|--------------------------------|
| Backend        | Java, Spring Boot              |
| Database       | Azure Database for PostgreSQL  |
| Auth           | Azure Active Directory B2C     |
| File Storage   | Azure Blob Storage             |
| Hosting        | Azure App Service (PaaS)       |
| API Routing    | Azure API Gateway              |
| Protocol       | HTTPS, REST (JSON)             |

---

## Services

### 1. Identity Management Service (Managed)
Delegated to Azure AD B2C. Handles user sign-up, login, JWT token generation, and Role-Based Access Control.

### 2. Resource & Booking Service
A single Spring Boot microservice that:
- Catalogs public assets (halls, sports facilities, parking, etc.)
- Processes reservations with transactional integrity
- Prevents double-booking via localized database transactions

### 3. Issue Reporting Service
An independent Spring Boot microservice that:
- Handles maintenance/safety ticket submissions
- Manages media uploads (images/videos) to Azure Blob Storage
- Isolated from the booking service to prevent I/O-heavy uploads from degrading performance

---

## API Endpoints

All endpoints require `Authorization: Bearer <JWT>` header.

| Method | Route                 | Description                                    |
|--------|-----------------------|------------------------------------------------|
| GET    | `/api/resources`      | Search nearby resources (`lat`, `lng`, `type`)  |
| GET    | `/api/resources/{id}` | Get detailed metadata for a specific resource   |
| POST   | `/api/bookings`       | Create a reservation (userId, resourceId, time) |
| POST   | `/api/issues`         | Submit an issue report with optional media      |
| GET    | `/api/issues/{userId}`| Get a user's issue report history and status    |

---

## Data Model

### Entities

- **User** — name, email, login details, role (citizen / admin)
- **Resource** — location, capacity, features, operating hours
- **Booking** — links user → resource for a time slot, tracks status
- **Report** — description, category, media, linked resource, resolution status

### Relationships

- One user → many bookings and reports
- One resource → many bookings and reports (one active booking at a time)

---

## Getting Started

### Prerequisites

- Java 17+
- Maven
- Azure account (for AD B2C, App Service, PostgreSQL, Blob Storage)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/your-org/smart-urban-resources.git
cd smart-urban-resources

# Resource & Booking Service
cd resource-booking-service
mvn spring-boot:run

# Issue Reporting Service (separate terminal)
cd issue-reporting-service
mvn spring-boot:run
```

### Environment Variables

```
AZURE_DB_URL=<your-postgresql-connection-string>
AZURE_DB_USERNAME=<db-username>
AZURE_DB_PASSWORD=<db-password>
AZURE_BLOB_CONNECTION=<blob-storage-connection-string>
AZURE_AD_B2C_TENANT=<tenant-name>
AZURE_AD_B2C_CLIENT_ID=<client-id>
```

---

## Future Extensions

- **Notification Service** — Real-time alerts for booking confirmations and issue updates
- **Azure Maps Integration** — Richer geospatial search and location-based discovery
- **Analytics Dashboard** — Admin insights on resource utilization and maintenance trends
- **Full Microservices Decomposition** — Break consolidated services into fully independent units as demand grows

---

## License

This project was developed as part of CMP404 coursework at the American University of Sharjah.
