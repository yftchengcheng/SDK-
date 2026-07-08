import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { genDeveloperId, genApiAccessToken } from '../utils/id-generator';
import { generateToken, authMiddleware, getDeveloper, setAuthCookie, clearAuthCookie, JWT_SECRET } from '../middleware/auth';
import { success, fail } from '../utils/response';

const router = Router();

// Register
router.post('/register', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, company, companyShortName, contactName, phone, accessType } = req.body;

    if (!email || !password || !company || !companyShortName || !contactName || !phone) {
      fail(res, 400, '缺少必填字段');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      fail(res, 400, '邮箱格式不正确');
      return;
    }

    if (password.length < 8 || password.length > 20) {
      fail(res, 400, '密码长度需为8-20位');
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      fail(res, 400, '密码需包含字母和数字');
      return;
    }

    const { data: existing } = await db.from('developer').select('id').eq('email', email).maybeSingle();
    if (existing) {
      fail(res, 409, '该邮箱已注册');
      return;
    }

    const developerId = genDeveloperId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await db.from('developer').insert({
      developer_id: developerId,
      email,
      password: hashedPassword,
      company,
      company_short_name: companyShortName,
      contact_name: contactName,
      phone,
      access_type: accessType || 1,
    });
    if (error) throw new Error(`Insert failed: ${error.message}`);

    // Auto-login after registration - generate JWT
    const token = generateToken({ developerId, email, role: 'developer' });
    setAuthCookie(res, token); // HttpOnly Cookie 下发

    success(res, {
      developerId,
      email,
      token,
      role: 'developer',
      company: company || null,
      companyShortName: companyShortName || null,
      contactName: contactName || null,
      phone: phone || null,
      accessType: accessType || 1,
    }, '注册成功');
  } catch (err) {
    console.error('Register error:', err);
    fail(res, 500, '注册失败');
  }
});

// Login
router.post('/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      fail(res, 400, '请输入邮箱和密码');
      return;
    }

    // Retry login query to handle PostgREST eventual consistency
    type DevRow = { developer_id: string; email: string; password: string; status: number; company: string; contact_name: string; role?: string };
    let dev: DevRow | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await db.from('developer').select('*').eq('email', email).maybeSingle();
      if (error) throw new Error(`Query failed: ${error.message}`);
      if (data) { dev = data as DevRow; break; }
      if (attempt < 2) await new Promise(r => setTimeout(r, 500));
    }

    if (!dev) {
      fail(res, 401, '邮箱或密码错误');
      return;
    }

    if (dev.status === 2) {
      fail(res, 403, '账号已被冻结');
      return;
    }

    const valid = await bcrypt.compare(password, dev.password);
    if (!valid) {
      fail(res, 401, '邮箱或密码错误');
      return;
    }

    const role = (dev.role || 'developer') as 'developer' | 'admin';
    const token = generateToken({ developerId: dev.developer_id, email: dev.email, role });
    setAuthCookie(res, token); // HttpOnly Cookie 下发，前端无感

    success(res, {
      token, // 仍返回一份给 SDK 直连场景
      developerId: dev.developer_id,
      email: dev.email,
      role,
      company: dev.company,
      contactName: dev.contact_name,
    });
  } catch (err) {
    console.error('Login error:', err);
    fail(res, 500, '登录失败');
  }
});

// Logout
router.post('/logout', authMiddleware, (_req: express.Request, res: express.Response) => {
  clearAuthCookie(res);
  success(res, null, '登出成功');
});

// Get current user
router.get('/me', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { data: dev, error } = await db.from('developer').select('*').eq('developer_id', developerId).maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!dev) {
      fail(res, 404, '用户不存在');
      return;
    }

    success(res, {
      developerId: dev.developer_id,
      email: dev.email,
      company: dev.company,
      contactName: dev.contact_name,
      phone: dev.phone,
      accessType: dev.access_type,
      apiAccessToken: dev.api_access_token,
      status: dev.status,
      role: (dev.role || 'developer'),
      createdAt: dev.created_at,
    });
  } catch (err) {
    console.error('Get me error:', err);
    fail(res, 500, '获取用户信息失败');
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { company, contactName, phone } = req.body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (company !== undefined) updateData.company = company;
    if (contactName !== undefined) updateData.contact_name = contactName;
    if (phone !== undefined) updateData.phone = phone;

    const { error } = await db.from('developer').update(updateData).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update profile error:', err);
    fail(res, 500, '更新失败');
  }
});

// Change password
router.put('/password', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      fail(res, 400, '请输入旧密码和新密码');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 20) {
      fail(res, 400, '密码长度需为8-20位');
      return;
    }

    const { data: dev, error } = await db.from('developer').select('password').eq('developer_id', developerId).maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);

    if (!dev) {
      fail(res, 404, '用户不存在');
      return;
    }

    const valid = await bcrypt.compare(oldPassword, dev.password);
    if (!valid) {
      fail(res, 400, '旧密码错误');
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await db.from('developer').update({ password: hashed, updated_at: new Date().toISOString() }).eq('developer_id', developerId);
    if (updateError) throw new Error(`Update failed: ${updateError.message}`);

    success(res, null, '密码修改成功');
  } catch (err) {
    console.error('Change password error:', err);
    fail(res, 500, '密码修改失败');
  }
});

// Generate API access token
router.post('/api-token', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const token = genApiAccessToken();

    const { error } = await db.from('developer').update({ api_access_token: token, updated_at: new Date().toISOString() }).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, { apiAccessToken: token });
  } catch (err) {
    console.error('Generate API token error:', err);
    fail(res, 500, '生成Token失败');
  }
});

// Verify JWT token (lightweight check, no DB hit)
router.post('/verify', (req: express.Request, res: express.Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return fail(res, 401, 'Token 不能为空');

    const decoded = jwt.verify(token, JWT_SECRET) as { developerId: string; email: string; iat: number; exp: number };
    success(res, {
      developerId: decoded.developerId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
      valid: true,
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return fail(res, 401, 'Token 已过期');
    if (err instanceof jwt.JsonWebTokenError) return fail(res, 401, 'Token 无效');
    fail(res, 500, 'Token 验证失败');
  }
});

export default router;
