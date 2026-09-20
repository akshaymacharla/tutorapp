# TutorLink

TutorLink is a two-sided marketplace that helps college students find part-time tutoring work and helps parents find verified tutors.

## Stack

- Frontend: React, Vite, React Router, Axios, vanilla modern CSS
- Backend: Java 21+, Spring Boot, Spring Security, JWT, Spring Data JPA, Bean Validation
- Database: MySQL in production; H2 is the zero-setup local profile

## Run locally

### Backend

Install Maven 3.9+ and run:

```powershell
cd backend
mvn spring-boot:run
```

The API starts at `http://localhost:8080`. The default local H2 console is at `/h2-console`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The app starts at `http://localhost:5173` and proxies API calls to the backend.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@tutorlink.in | Password@123 |
| Tutor | akshay@example.com | Password@123 |
| Parent | priya@example.com | Password@123 |

## MySQL

Set `SPRING_PROFILES_ACTIVE=mysql`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`. The MySQL driver and profile are already included in `backend/pom.xml` and `application.yml`.

## API overview

`/api/auth`, `/api/tutors`, `/api/tuition`, `/api/applications`, `/api/matching`, `/api/notifications`, and `/api/admin` provide the core marketplace flows. Every protected route expects `Authorization: Bearer <token>`.

## Future extensions

The matching service is deliberately isolated so distance providers, payments, document verification, messaging, and AI ranking can be plugged in without replacing marketplace workflows.
