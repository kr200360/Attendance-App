import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../modules/users/user.model';
import bcrypt from 'bcryptjs';

describe('Auth & Role Permissions Integration', () => {
  before(async () => {
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

  after(async () => {
    await disconnectDatabase();
  });

  it('should successfully log in with valid credentials and return JWT tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Secret123!' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.ok(res.body.data.refreshToken);
    assert.strictEqual(res.body.data.user.email, 'admin@test.com');
    assert.strictEqual(res.body.data.user.role, 'admin');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('should reject login for deactivated user accounts', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inactive@test.com', password: 'Secret123!' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('should refresh access token using valid refresh token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@test.com', password: 'Secret123!' });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    assert.strictEqual(refreshRes.status, 200);
    assert.ok(refreshRes.body.data.accessToken);
  });

  it('should block unauthorized access to protected admin settings', async () => {
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@test.com', password: 'Secret123!' });

    const teacherToken = teacherLogin.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${teacherToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });
});
