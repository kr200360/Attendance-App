export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'EduTrack - School Attendance Management System API',
    version: '1.0.0',
    description: 'Enterprise REST API for School Attendance, Role-Based Access, Leave Requests, and Notifications.'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Gateway'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Sarah Jenkins' },
          email: { type: 'string', example: 'teacher1@school.edu' },
          role: { type: 'string', enum: ['admin', 'teacher', 'parent', 'student'], example: 'teacher' },
          isActive: { type: 'boolean', example: true }
        }
      },
      Student: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          admissionNumber: { type: 'string', example: 'STU-2026-001' },
          name: { type: 'string', example: 'Emma Watson' },
          dateOfBirth: { type: 'string', example: '2010-04-15' },
          status: { type: 'string', enum: ['active', 'inactive', 'transferred', 'graduated'] }
        }
      },
      AttendanceSession: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          classId: { type: 'string' },
          date: { type: 'string', example: '2026-10-26' },
          period: { type: 'number', example: 1 },
          status: { type: 'string', enum: ['draft', 'submitted', 'corrected'], example: 'submitted' },
          submittedAt: { type: 'string', format: 'date-time' }
        }
      },
      AttendanceRecord: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          status: { type: 'string', enum: ['present', 'absent', 'late', 'excused'] },
          remarks: { type: 'string', example: 'Doctor note submitted' }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@school.edu' },
                  password: { type: 'string', example: 'AdminPass123!' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh expired access token',
        responses: { 200: { description: 'Token refreshed' } }
      }
    },
    '/students': {
      get: {
        tags: ['Students'],
        summary: 'List students with filters and pagination',
        responses: { 200: { description: 'List of students' } }
      },
      post: {
        tags: ['Students'],
        summary: 'Register student and assign to class',
        responses: { 201: { description: 'Student created' } }
      }
    },
    '/classes': {
      get: {
        tags: ['Academic Classes'],
        summary: 'List classes',
        responses: { 200: { description: 'List of classes' } }
      }
    },
    '/classes/{classId}/roster': {
      get: {
        tags: ['Academic Classes'],
        summary: 'Get enrolled student roster for class',
        parameters: [
          { name: 'classId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Enrolled roster' } }
      }
    },
    '/attendance/sessions': {
      post: {
        tags: ['Attendance Engine'],
        summary: 'Get or create attendance session for class/date/period',
        responses: { 200: { description: 'Attendance session ready' } }
      },
      get: {
        tags: ['Attendance Engine'],
        summary: 'List attendance sessions',
        responses: { 200: { description: 'List of sessions' } }
      }
    },
    '/attendance/sessions/{id}/submit': {
      post: {
        tags: ['Attendance Engine'],
        summary: 'Submit and finalize attendance; notifies parents of absences',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Submitted successfully' } }
      }
    },
    '/reports/attendance/daily': {
      get: {
        tags: ['Reports & Analytics'],
        summary: 'School-wide daily attendance report',
        responses: { 200: { description: 'Daily attendance stats' } }
      }
    },
    '/leave-requests': {
      get: {
        tags: ['Leave Requests'],
        summary: 'List leave requests',
        responses: { 200: { description: 'Leave requests' } }
      },
      post: {
        tags: ['Leave Requests'],
        summary: 'Parent submits leave request for child',
        responses: { 201: { description: 'Leave request submitted' } }
      }
    }
  }
};
