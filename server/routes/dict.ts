/**
 * 阶段 0.2: 后端字典接口路由
 * - GET /api/v1/dict/enum/:dictCode       单个 dict_code 全部枚举
 * - GET /api/v1/dict/enum                  所有枚举（轻量）
 * - GET /api/v1/dict/placement-field-def?format=&accessType=   placement 字段定义
 * - GET /api/v1/dict/app-field-def         app 字段定义
 */
import { Router, type Request, type Response } from 'express';
import { db } from '../db';
import { success, fail } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 全部需要登录
router.use(authMiddleware);

// GET /api/v1/dict/enum/:dictCode
router.get('/enum/:dictCode', async (req: Request, res: Response) => {
  const { dictCode } = req.params;
  const { data, error } = await db
    .from('enum_dict')
    .select('dict_code,value,label,sort_order')
    .eq('dict_code', dictCode)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return fail(res, 500, error.message);
  return success(res, { items: data ?? [] });
});

// GET /api/v1/dict/enum
router.get('/enum', async (_req: Request, res: Response) => {
  const { data, error } = await db
    .from('enum_dict')
    .select('dict_code,value,label,sort_order')
    .eq('is_active', true)
    .order('dict_code', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) return fail(res, 500, error.message);
  return success(res, { items: data ?? [] });
});

// GET /api/v1/dict/placement-field-def?format=&accessType=
router.get('/placement-field-def', async (req: Request, res: Response) => {
  const format = Number(req.query.format);
  const accessType = Number(req.query.accessType);
  if (!Number.isInteger(format) || format < 1 || format > 5) {
    return fail(res, 400, 'format must be 1..5');
  }
  if (!Number.isInteger(accessType) || (accessType !== 1 && accessType !== 2)) {
    return fail(res, 400, 'accessType must be 1 or 2');
  }
  const { data, error } = await db
    .from('placement_field_def')
    .select('format,access_type,field_name,display_name,field_type,required,options_json,sort_order,note')
    .eq('format', format)
    .eq('access_type', accessType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return fail(res, 500, error.message);
  return success(res, { items: data ?? [] });
});

// GET /api/v1/dict/app-field-def
router.get('/app-field-def', async (_req: Request, res: Response) => {
  const { data, error } = await db
    .from('app_field_def')
    .select('field_name,display_name,default_value,required,note,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return fail(res, 500, error.message);
  return success(res, { items: data ?? [] });
});

export default router;
