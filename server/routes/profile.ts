import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';
import { genApiAccessToken } from '../utils/id-generator';
import bcrypt from 'bcryptjs';

const router = Router();

// Get profile
router.get('/info', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    const { data, error } = await db.from('developer').select('developer_id, email, company, company_short_name, contact_name, phone, access_type, api_access_token, api_token_expire, status, created_at').eq('developer_id', developerId).single();
    if (error) throw new Error(`Query failed: ${error.message}`);
    if (!data) {
      fail(res, 404, '开发者不存在');
      return;
    }

    success(res, data);
  } catch (err) {
    console.error('Get profile error:', err);
    fail(res, 500, '获取个人信息失败');
  }
});

// Update profile
router.put('/info', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { company, companyShortName, contactName, phone } = req.body;

    const updateData: Record<string, unknown> = {};
    if (company !== undefined) updateData.company = company;
    if (companyShortName !== undefined) updateData.company_short_name = companyShortName;
    if (contactName !== undefined) updateData.contact_name = contactName;
    if (phone !== undefined) updateData.phone = phone;

    const { error } = await db.from('developer').update(updateData).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update profile error:', err);
    fail(res, 500, '更新个人信息失败');
  }
});

// Change password
router.put('/password', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      fail(res, 400, '旧密码和新密码不能为空');
      return;
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      fail(res, 400, '新密码需8-20位，包含字母和数字');
      return;
    }

    const { data: dev, error } = await db.from('developer').select('password').eq('developer_id', developerId).single();
    if (error) throw new Error(`Query failed: ${error.message}`);
    if (!dev) {
      fail(res, 404, '开发者不存在');
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, dev.password as string);
    if (!isMatch) {
      fail(res, 400, '旧密码不正确');
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await db.from('developer').update({ password: hashedPassword }).eq('developer_id', developerId);
    if (updateError) throw new Error(`Update failed: ${updateError.message}`);

    success(res, null, '密码修改成功');
  } catch (err) {
    console.error('Change password error:', err);
    fail(res, 500, '修改密码失败');
  }
});

// Generate API access token
router.post('/api-token', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    const token = genApiAccessToken();
    const expireDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await db.from('developer').update({
      api_access_token: token,
      api_token_expire: expireDate,
    }).eq('developer_id', developerId);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, { apiAccessToken: token, expireDate }, 'Token生成成功');
  } catch (err) {
    console.error('Generate API token error:', err);
    fail(res, 500, '生成API Token失败');
  }
});

// List all tokens (developer_id, app_keys, placement_ids)
router.get('/tokens', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    const { data: apps, error: appError } = await db.from('app').select('app_key, app_name').eq('developer_id', developerId);
    if (appError) throw new Error(`Query apps failed: ${appError.message}`);

    const appKeys = (apps || []).map((a: { app_key: string }) => a.app_key);

    let placements: Array<Record<string, unknown>> = [];
    if (appKeys.length > 0) {
      const { data: pData, error: pError } = await db.from('placement').select('placement_id, name, app_key').in('app_key', appKeys);
      if (pError) throw new Error(`Query placements failed: ${pError.message}`);
      placements = pData || [];
    }

    success(res, {
      developerId,
      apps: apps || [],
      placements,
    });
  } catch (err) {
    console.error('List tokens error:', err);
    fail(res, 500, '获取Token列表失败');
  }
});

export default router;
