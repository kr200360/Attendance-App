# EduTrack - School Attendance Management System

An enterprise-grade, multi-platform School Attendance Management System engineered for educational institutions with Administrators, Faculty/Teachers, Parents/Guardians, and Students.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![React](https://img.shields.io/badge/React-18-blue)
![React Native](https://img.shields.io/badge/Expo-51-black)
![Node](https://img.shields.io/badge/Node.js-20%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20In--Memory-green)

---

## Architecture Overview

EduTrack is designed as a modular monorepo:

- **`apps/web`**: Responsive web portal for School Administrators and Teachers built with React 18, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, and Recharts.
- **`apps/mobile`**: Cross-platform mobile app for Teachers and Parents built with React Native and Expo Router.
- **`services/api`**: REST API Gateway built with Node.js, Express.js, TypeScript, Mongoose ODM, and Swagger/OpenAPI 3.0 documentation.
- **`packages/shared-types`**: Core domain types, database entity contracts, and API DTOs.
- **`packages/validation`**: Request validation schemas powered by Zod.
- **`docs/`**: Architecture diagrams, API reference, and deployment playbooks.

---

## Key Features by Role

### 1. School Administrator
- **Executive Dashboard**: School-wide attendance rate KPIs, daily class breakdown bar charts, and real-time attendance submission tracking.
- **Student Directory**: Student admissions, classroom enrollments, parent-student link verification.
- **Faculty Directory**: Teacher account creation, active/inactive lifecycle controls.
- **Classes & Cohorts**: Academic year setups, class/section creation, homeroom teacher assignments, and roster inspection.
- **Attendance Monitoring**: School-wide daily roll call review with live status (Submitted, Draft, Unmarked).
- **Reports & Data Export**: Monthly attendance trend charts, threshold monitoring (<85%), and instant CSV exports.
- **Student Leave Approvals**: Review parent leave submissions with official approval remarks.
- **Audit Logs**: Immutable log of attendance submissions, corrections, and administrative modifications.
- **Attendance Policy Configuration**: Configurable threshold percentages, late weight fraction (e.g., 0.5), and teacher correction windows.

### 2. Teacher / Faculty
- **Assigned Classes**: Direct access to assigned courses and cohorts.
- **Digital Roll Call**: One-tap attendance entry (Present, Absent, Late, Excused), individual student remarks, and "Mark All Present" shortcut.
- **Draft Persistence**: Save intermediate roll call drafts without locking or triggering parent alerts.
- **Review & Submit**: Multi-step submission modal with confirmation warnings on absences.
- **Attendance Corrections**: Submit authorized correction adjustments with audit rationale within the allowed window.
- **Historical Sessions**: View past submitted roll calls.

### 3. Parent / Guardian
- **Multi-Child Switcher**: Effortlessly switch between multiple verified children.
- **Attendance Dashboard**: Academic term attendance percentages, total present/absent/late counts.
- **Attendance History Log**: Session-by-session records with course tags and teacher notes.
- **Absence Alerts**: Real-time push and in-app alerts when a child is marked absent.
- **Student Leave Submissions**: Submit absence leave requests with date range and reason; track approval status.

---

## Quick Start Guide

### Prerequisites
- Node.js v20+ (tested on Node v24)
- npm v10+

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "Attendance App"
npm install --legacy-peer-deps
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Default settings use port 5000 and automatically boot an in-memory MongoDB server if no local or Atlas MongoDB is running, providing zero-setup local dev!)*

### 3. Seed Database
Populate the database with pre-configured admin, teacher, parent, student accounts, classes, and historical attendance data:
```bash
npm run seed
```

#### Pre-configured Test Credentials:
| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@school.edu` | `Admin123!` |
| **Teacher (Class 10-A)** | `sarah.jenkins@school.edu` | `Teacher123!` |
| **Teacher (Class 10-B)** | `marcus.vance@school.edu` | `Teacher123!` |
| **Parent (Emma Watson)** | `john.watson@parent.edu` | `Parent123!` |
| **Parent (Sophia Garcia)**| `maria.garcia@parent.edu` | `Parent123!` |

*(The web login screen also features 1-click quick-fill buttons for each role).*

---

## Running the System

### 1. Start the API Gateway:
```bash
npm run dev:api
```
- API Base: `http://localhost:5000/api/v1`
- Interactive Swagger Documentation: `http://localhost:5000/api/v1/docs`
- Health Check: `http://localhost:5000/health`

### 2. Start the Web Portal:
```bash
npm run dev:web
```
- Web Application: `http://localhost:3000`

### 3. Start the Mobile App (Expo):
```bash
npm run dev:mobile
```
- Press `w` to run on web, `a` for Android emulator, `i` for iOS simulator, or scan the QR code using Expo Go.

---

## Running Automated Tests

Run the complete integration and unit test suite:
```bash
npm run test --workspace=@school/api
```

Test coverage includes:
- JWT authentication, password hashing, and token refresh
- Role-based authorization & permission boundary checks
- Teacher assignment verification (blocking unauthorized teacher access)
- Parent-child visibility boundaries (parents cannot view other children)
- Session creation, draft saving, and final submission
- Idempotency & duplicate submission rejection
- Authorized corrections & audit logging
- School attendance calculations & CSV export generation

---

## Production Deployment & Security

- **Strict Role-Based Access Control**: Server-side authorization middleware guards every endpoint.
- **Database Safety**: Compound unique indexes prevent duplicate sessions and double-recording.
- **Security Headers & Rate Limiting**: Helmet, CORS isolation, and express-rate-limit.
- **Password Protection**: Salted bcrypt hashing.
- **Audit Compliance**: All sensitive actions write immutable audit records to `AuditLog`.
