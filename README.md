# 🏥 Healthcare Appointment Platform

A scalable, event-driven healthcare appointment management platform built with **Spring Boot**, **Python**, **RabbitMQ**, **PostgreSQL**, and **React**.

![Architecture](https://img.shields.io/badge/Architecture-Event%20Driven-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![Python](https://img.shields.io/badge/Python-3.11-yellow)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Event-Driven Workflow](#-event-driven-workflow)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)

---

## 🏗️ Architecture Overview

```
┌──────────────┐     HTTP/JWT      ┌──────────────────┐     AMQP Events     ┌──────────────────┐
│              │ ◄──────────────► │                  │ ──────────────────► │                  │
│   React UI   │                  │  Spring Boot API  │                    │  Python Worker   │
│  (Vite)      │                  │  (Port 8080)      │                    │  Service         │
│              │                  │                  │                    │                  │
└──────────────┘                  └────────┬─────────┘                    └────────┬─────────┘
                                          │                                       │
                                          │          ┌──────────────┐             │
                                          │          │              │             │
                                          ├─────────►│  PostgreSQL  │◄────────────┤
                                          │          │  (Port 5432) │             │
                                          │          └──────────────┘             │
                                          │                                       │
                                          │          ┌──────────────┐             │
                                          │          │              │             │
                                          └─────────►│  RabbitMQ    │◄────────────┘
                                                     │  (Port 5672) │
                                                     └──────────────┘
```

### Event Flow

1. **User books appointment** → Spring Boot REST API
2. **Spring Boot validates** → saves to PostgreSQL (status: `PENDING`) → publishes event to RabbitMQ
3. **Python worker consumes** event → processes notification → updates status to `CONFIRMED`
4. **Frontend reflects** updated status with real-time visual feedback

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Spring Boot 3.2, Java 17, Spring Security, Spring Data JPA |
| **Worker Service** | Python 3.11, Pika (RabbitMQ client), Psycopg2 |
| **Database** | PostgreSQL 15 |
| **Message Broker** | RabbitMQ 3 (with Management UI) |
| **Frontend** | React 18, Vite 5, React Router, Axios |
| **Auth** | JWT (JSON Web Tokens) |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) |
| **Containerization** | Docker, Docker Compose |

---

## ✨ Features

### Core Features
- ✅ **User Registration & Login** — JWT-based authentication
- ✅ **Doctor Directory** — Browse available doctors by specialization
- ✅ **Appointment Booking** — Select doctor → date → time slot → confirm
- ✅ **Appointment Cancellation** — Cancel with automatic slot release
- ✅ **Appointment History** — View all appointments with status filtering
- ✅ **Available Slots** — Real-time slot availability checking

### Event-Driven Features
- ✅ **RabbitMQ Integration** — Asynchronous event publishing & consuming
- ✅ **Notification Processing** — Python worker processes appointment events
- ✅ **Status Updates** — Automatic status transitions (PENDING → CONFIRMED)
- ✅ **Audit Trail** — Complete appointment status change history

### Technical Features
- ✅ **Concurrent Booking Prevention** — Pessimistic locking prevents double-booking
- ✅ **Duplicate Detection** — Same slot cannot be booked twice
- ✅ **Global Exception Handling** — Consistent error responses
- ✅ **Swagger/OpenAPI Documentation** — Interactive API explorer
- ✅ **Docker Compose** — One-command deployment of all services
- ✅ **Health Checks** — Container readiness verification

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- Git

### Quick Start (Docker Compose)

```bash
# 1. Clone the repository
git clone <repository-url>
cd mykare-healthcare

# 2. Start all services
docker-compose up --build

# 3. Wait for all services to be healthy (takes ~60-90 seconds on first run)
```

### Access Points

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | [http://localhost:3000](http://localhost:3000) |
| 🔌 **Backend API** | [http://localhost:8080](http://localhost:8080) |
| 📘 **Swagger UI** | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) |
| 🐰 **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) (guest/guest) |

### Local Development (Without Docker)

#### Backend (Spring Boot)
```bash
# Requires: Java 17+, Maven 3.9+
cd backend
# Ensure PostgreSQL and RabbitMQ are running locally
mvn spring-boot:run
```

#### Worker (Python)
```bash
# Requires: Python 3.11+
cd worker
pip install -r requirements.txt
python main.py
```

#### Frontend (React)
```bash
# Requires: Node.js 18+
cd frontend
npm install
npm run dev
```

---

## 📘 API Documentation

### Swagger UI
Interactive API documentation available at: **[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**

### API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |

#### Doctors
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/doctors` | List all active doctors |

#### Slots
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/slots?date={date}&doctorId={id}` | Get available time slots |

#### Appointments
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/appointments` | Book a new appointment |
| `GET` | `/api/appointments` | Get user's appointments |
| `GET` | `/api/appointments/{id}` | Get appointment details with logs |
| `PUT` | `/api/appointments/{id}/cancel` | Cancel an appointment |

### Example API Usage

#### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543210"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Book Appointment
```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "slotId": 1,
    "notes": "Regular checkup"
  }'
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    USERS     │     │   APPOINTMENTS   │     │     DOCTORS      │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)      │────►│ id (PK)          │◄────│ id (PK)          │
│ full_name    │     │ user_id (FK)     │     │ name             │
│ email (UK)   │     │ slot_id (FK)     │     │ specialization   │
│ password     │     │ doctor_id (FK)   │     │ is_active        │
│ phone        │     │ status           │     └──────────────────┘
│ role         │     │ notes            │              │
│ created_at   │     │ created_at       │              │
└──────────────┘     │ updated_at       │     ┌──────────────────┐
                     └──────┬───────────┘     │     SLOTS        │
                            │                 ├──────────────────┤
                   ┌────────▼─────────┐       │ id (PK)          │
                   │ APPOINTMENT_LOGS │       │ doctor_id (FK)   │◄──┘
                   ├──────────────────┤       │ slot_date        │
                   │ id (PK)          │       │ start_time       │
                   │ appointment_id   │       │ end_time         │
                   │ previous_status  │       │ is_booked        │
                   │ new_status       │       └──────────────────┘
                   │ message          │
                   │ timestamp        │       ┌──────────────────┐
                   └──────────────────┘       │  NOTIFICATIONS   │
                                              ├──────────────────┤
                                              │ id (PK)          │
                                              │ appointment_id   │
                                              │ type             │
                                              │ recipient        │
                                              │ message          │
                                              │ status           │
                                              │ sent_at          │
                                              └──────────────────┘
```

### Tables

#### users
| Column | Type | Constraints |
|--------|------|------------|
| id | BIGSERIAL | PRIMARY KEY |
| full_name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL (BCrypt) |
| phone | VARCHAR(20) | |
| role | VARCHAR(20) | DEFAULT 'USER' |
| created_at | TIMESTAMP | DEFAULT NOW() |

#### doctors
| Column | Type | Constraints |
|--------|------|------------|
| id | BIGSERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| specialization | VARCHAR(255) | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |

#### slots
| Column | Type | Constraints |
|--------|------|------------|
| id | BIGSERIAL | PRIMARY KEY |
| doctor_id | BIGINT | FOREIGN KEY → doctors(id) |
| slot_date | DATE | NOT NULL |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| is_booked | BOOLEAN | DEFAULT false |

#### appointments
| Column | Type | Constraints |
|--------|------|------------|
| id | BIGSERIAL | PRIMARY KEY |
| user_id | BIGINT | FOREIGN KEY → users(id) |
| slot_id | BIGINT | FOREIGN KEY → slots(id) |
| doctor_id | BIGINT | FOREIGN KEY → doctors(id) |
| status | VARCHAR(20) | DEFAULT 'PENDING' |
| notes | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

#### appointment_logs
| Column | Type | Constraints |
|--------|------|------------|
| id | BIGSERIAL | PRIMARY KEY |
| appointment_id | BIGINT | FOREIGN KEY → appointments(id) |
| previous_status | VARCHAR(20) | |
| new_status | VARCHAR(20) | NOT NULL |
| message | TEXT | |
| timestamp | TIMESTAMP | DEFAULT NOW() |

#### notifications
| Column | Type | Constraints |
|--------|------|------------|
| id | BIGSERIAL | PRIMARY KEY |
| appointment_id | BIGINT | |
| type | VARCHAR(50) | |
| recipient | VARCHAR(255) | |
| message | TEXT | |
| status | VARCHAR(20) | |
| sent_at | TIMESTAMP | DEFAULT NOW() |

---

## 🔄 Event-Driven Workflow

### RabbitMQ Configuration
- **Exchange**: `healthcare.exchange` (Topic Exchange)
- **Queues**:
  - `appointment.created.queue` → routing key: `appointment.created`
  - `appointment.cancelled.queue` → routing key: `appointment.cancelled`

### Event Payloads

#### appointment.created
```json
{
  "appointmentId": 1,
  "userId": 1,
  "userEmail": "john@example.com",
  "userName": "John Doe",
  "doctorName": "Dr. Sarah Johnson",
  "specialization": "Cardiology",
  "slotDate": "2024-01-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "status": "PENDING",
  "notes": "Regular checkup",
  "timestamp": "2024-01-14T10:30:00"
}
```

#### appointment.cancelled
```json
{
  "appointmentId": 1,
  "userId": 1,
  "userEmail": "john@example.com",
  "userName": "John Doe",
  "doctorName": "Dr. Sarah Johnson",
  "slotDate": "2024-01-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "status": "CANCELLED",
  "timestamp": "2024-01-14T11:00:00"
}
```

---

## 📁 Project Structure

```
mykare-healthcare/
├── docker-compose.yml          # Orchestrates all services
├── .env.example                # Environment variables template
├── README.md                   # This file
│
├── backend/                    # Spring Boot Backend Service
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/mykare/healthcare/
│       │   ├── HealthcareApplication.java
│       │   ├── config/          # Security, RabbitMQ, Swagger, CORS
│       │   ├── controller/      # REST controllers
│       │   ├── dto/             # Request/Response DTOs
│       │   ├── exception/       # Global exception handling
│       │   ├── model/           # JPA entities
│       │   ├── repository/      # Data repositories
│       │   ├── security/        # JWT auth components
│       │   └── service/         # Business logic
│       └── resources/
│           ├── application.yml
│           └── data.sql         # Seed data
│
├── worker/                     # Python Worker Service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                 # Entry point
│   ├── config.py               # Configuration
│   ├── consumer.py             # RabbitMQ event consumer
│   ├── database.py             # Database operations
│   └── notification_service.py # Notification processing
│
└── frontend/                   # React Frontend
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css            # Design system
        ├── api/client.js        # API client with JWT
        ├── context/AuthContext.jsx
        ├── components/          # Reusable UI components
        └── pages/               # Page components
```

---

## 📊 Monitoring

### RabbitMQ Management UI
Access the RabbitMQ management dashboard at [http://localhost:15672](http://localhost:15672) (credentials: guest/guest) to:
- Monitor message queues and throughput
- View exchange bindings
- Track consumer activity
- Debug message flow

### Application Logs
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f frontend
```

---

## 🛑 Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

---

## 📝 License

This project was built as a technical assessment for **mykare.ai**.
