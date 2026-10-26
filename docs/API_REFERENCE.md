# EduTrack API Reference

Base URL: `/api/v1`
Interactive Swagger Documentation: `http://localhost:5000/api/v1/docs`

All protected endpoints require an `Authorization` header:
```http
Authorization: Bearer <accessToken>
```

---

## 1. Authentication Endpoints

### POST `/auth/login`
Authenticates a user with email and password.
- **Request Body**:
  ```json
  {
    "email": "admin@school.edu",
    "password": "Admin123!"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "_id": "6648...",
        "name": "Dr. Arthur Pendelton",
        "email": "admin@school.edu",
        "role": "admin"
      }
    }
  }
  ```

### POST `/auth/refresh`
Refreshes an expired access token using a valid refresh token.
- **Request Body**: `{ "refreshToken": "..." }`

---

## 2. Students & Parents

### GET `/students`
List students with filtering and pagination.
- **Query Parameters**:
  - `search`: Filter by name or admission number.
  - `classId`: Filter by active class enrollment.
  - `page`: Page number (default: 1).
  - `limit`: Items per page (default: 20).

### POST `/students`
Admins register a new student and enroll them into a class.
- **Request Body**:
  ```json
  {
    "admissionNumber": "STU-2026-001",
    "name": "Emma Watson",
    "gender": "female",
    "dateOfBirth": "2010-04-15",
    "classId": "6648a..."
  }
  ```

### POST `/students/:id/parent-links`
Link a parent account to a student with verification status.
- **Request Body**:
  ```json
  {
    "parentUserId": "6648b...",
    "relationship": "father",
    "verificationStatus": "verified"
  }
  ```

### GET `/parents/me/children`
Retrieves all students linked to the authenticated parent user.

---

## 3. Academic Structure

### GET `/classes`
List active classes and homeroom teachers.

### GET `/classes/:classId/roster`
Returns enrolled students in a class. Only assigned teachers or administrators have access.

### POST `/teacher-assignments`
Assigns a teacher to a class and subject.

---

## 4. Attendance Engine

### POST `/attendance/sessions`
Finds or initializes an attendance session for a class, date, and period.
- **Request Body**:
  ```json
  {
    "classId": "6648...",
    "date": "2026-10-26",
    "period": 1
  }
  ```

### PUT `/attendance/sessions/:id/records`
Saves draft attendance records. Does not trigger parent notifications.
- **Request Body**:
  ```json
  {
    "records": [
      { "studentId": "6648c...", "status": "present" },
      { "studentId": "6648d...", "status": "absent", "remarks": "Unexcused" }
    ]
  }
  ```

### POST `/attendance/sessions/:id/submit`
Submits and locks attendance. Dispatches absence push notifications to verified parents.

### POST `/attendance/sessions/:id/correction-requests`
Submits an authorized correction with reason within the configured policy window.

### GET `/students/:id/attendance`
Returns student attendance logs and percentage calculation. Verified parents can view only their own linked children.

---

## 5. Reports & Analytics

### GET `/reports/attendance/daily?date=YYYY-MM-DD`
School-wide attendance breakdown by class.

### GET `/reports/attendance/monthly?year=2026&month=10`
Daily aggregated attendance percentages for trend charting.

### GET `/reports/attendance/below-threshold?threshold=85`
Returns all students falling below the required attendance policy.

### GET `/reports/attendance/export?date=YYYY-MM-DD`
Downloads school daily attendance report in CSV format.
