import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../modules/users/user.model';
import bcrypt from 'bcryptjs';

describe('Auth & Role Permissions Integration', () => {
  beforeAll(async () => {
    await connectDatabase();
    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash('Secret123!', salt);

    await User.create([
      { name: 'Admin One', email: 'admin@test.com', passwordHash: pass, role: 'admin', isActive: true },
      { name: 'Teacher One', email: 'teacher@test.com', passwordHash: pass, role: 'teacher', isActive: true },
      { name: 'Parent One', email: 'parent@test.com', passwordHash: pass, role: 'parent', isActive: true },
      { name: 'Deactivated User', email: 'inactive@test.com', passwordHash: pass, role: 'teacher', isActive: false }
    ]);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should successfully log in with valid credentials and return JWT tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Secret123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@test.com');
    expect(res.body.data.user.role).toBe('admin');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login for deactivated user accounts', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inactive@test.com', password: 'Secret123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should refresh access token using valid refresh token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@test.com', password: 'Secret123!' });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
  });

  it('should block unauthorized access to protected admin settings', async () => {
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@test.com', password: 'Secret123!' });

    const teacherToken = teacherLogin.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
