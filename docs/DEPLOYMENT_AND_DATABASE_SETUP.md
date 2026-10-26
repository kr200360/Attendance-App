# Deployment & Database Setup Guide

## 1. MongoDB Setup Options

### Option A: MongoDB Atlas (Recommended for Production)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new cluster (M0 Free Tier or dedicated).
3. Under **Database Access**, create a database user (e.g. `edutrack_admin`) with read/write privileges.
4. Under **Network Access**, whitelist your deployment IP addresses (or `0.0.0.0/0` for initial staging with strong credentials).
5. Copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://edutrack_admin:<password>@cluster0.abcde.mongodb.net/school_attendance?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB / In-Memory Fallback
- For local development, if no external MongoDB is running on port 27017, the API automatically boots an in-memory MongoDB instance via `mongodb-memory-server`.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Description |
|---|---|
| `PORT` | Backend HTTP port (default: 5000) |
| `MONGODB_URI` | Connection URI for MongoDB Atlas or local daemon |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens |
| `CORS_ORIGIN` | Allowed web and mobile origins (comma-separated) |
| `FCM_PROJECT_ID` | Firebase Project ID for push notifications |
| `FCM_CLIENT_EMAIL` | Firebase Service Account client email |
| `FCM_PRIVATE_KEY` | Firebase Service Account private key |

---

## 3. Database Seeding

To seed the database with initial admin, faculty, parents, students, classes, and historical attendance:
```bash
npm run seed
```

Default credentials created by seed:
- **Admin**: `admin@school.edu` / `Admin123!`
- **Teacher**: `sarah.jenkins@school.edu` / `Teacher123!`
- **Teacher**: `marcus.vance@school.edu` / `Teacher123!`
- **Parent**: `john.watson@parent.edu` / `Parent123!`
- **Parent**: `maria.garcia@parent.edu` / `Parent123!`

---

## 4. Running the Applications

### Backend API Server:
```bash
npm run dev:api
```
Server runs at `http://localhost:5000`.
Swagger docs at `http://localhost:5000/api/v1/docs`.

### Web Application:
```bash
npm run dev:web
```
Web app runs at `http://localhost:3000`.

### Mobile Application:
```bash
npm run dev:mobile
```
Starts Expo development server. Press `w` for web, `a` for Android, or scan QR code using Expo Go on iOS/Android.

---

## 5. Automated Testing

Run the integration and business logic tests:
```bash
npm run test --workspace=@school/api
```
Tests cover:
- Authentication, token issuance, refresh, and role isolation
- Teacher assignment checks (preventing unauthorized class access)
- Parent-child visibility boundaries (parents cannot view other children)
- Session creation, draft persistence, and submission locking
- Idempotency and duplicate submission prevention
- Authorized attendance correction and audit logging
- Daily and monthly attendance aggregation formulas
- CSV export generation
