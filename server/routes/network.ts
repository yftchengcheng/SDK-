import express, { Router } from 'express';
import { db } from '../db';
import { authMiddleware, getDeveloper } from '../middleware/auth';
import { success, fail } from '../utils/response';
import {
  getStorage,
  buildNetworkIconKey,
  parseBase64PngImage,
  detectImageExt,
  generatePresignedUrlCached,
  extractStorageKey,
  resolveIconUrl,
} from '../utils/storage';

const router = Router();

/**
 * 辅助函数：给一组行附加 fresh presigned URL（iconUrlResolved）
 * - DB 中 icon_url 是 storage key
 * - iconUrlResolved 是每次查询时实时生成的 7 天有效 presigned URL
 */
async function enrichWithIconUrl<T extends { icon_url?: string | null }>(rows: T[]): Promise<(T & { iconUrlResolved: string | null })[]> {
  return Promise.all(
    rows.map(async (row) => {
      if (!row.icon_url) return { ...row, iconUrlResolved: null };
      const resolved = await resolveIconUrl(String(row.icon_url));
      return { ...row, iconUrlResolved: resolved || null };
    }),
  );
}

// ========== Adapter 字段常量（per-system：每个系统一套） ==========
// 6 种 Adapter × 2 个系统 = 12 个 DB 列
//   列名格式：adapter_class_{type}_{system}
//   例：adapter_class_init_android / adapter_class_init_ios
const ADAPTER_TYPES = ['init', 'banner', 'interstitial', 'rewarded', 'native', 'splash'] as const;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ADAPTER_SYSTEMS = ['android', 'ios'] as const;
type AdapterSystem = typeof ADAPTER_SYSTEMS[number];
type AdapterType = typeof ADAPTER_TYPES[number];

const ADAPTER_LABELS: Record<AdapterType, string> = {
  init: '初始化 Adapter',
  banner: 'Banner Adapter',
  interstitial: '插屏 Adapter',
  rewarded: '激励视频 Adapter',
  native: '原生 Adapter',
  splash: '开屏 Adapter',
};

// Java/ObjC/Swift FQN 格式：包名（小写/数字/下划线，可分段） + 点 + 类名（PascalCase）
const FQN_REGEX = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*\.[A-Z][A-Za-z0-9_]*$/;

const col = (t: AdapterType, s: AdapterSystem) => `adapter_class_${t}_${s}`;
const toCamel = (s: string) => s[0].toUpperCase() + s.slice(1);
const camelKey = (t: AdapterType, s: AdapterSystem) => `adapterClass${toCamel(t)}${toCamel(s)}`;

/**
 * 从请求体读取某个 adapter 字段（兼容 snake_case 和 camelCase）
 * 返回 undefined 表示未传；返回 null 表示显式传 null；返回 string 表示有值
 */
function pickAdapter(body: Record<string, unknown>, t: AdapterType, s: AdapterSystem): string | null | undefined {
  const snake = body?.[col(t, s)] as unknown;
  const camel = body?.[camelKey(t, s)] as unknown;
  const v = snake ?? camel;
  if (v === undefined) return undefined;
  if (v === null) return null;
  return String(v);
}

/**
 * 收集一个系统在所有 type 上的字段（trim + null 标准化）
 *   返回 { init: string|null, banner: string|null, ... }
 *   未传字段标记为 undefined（用于 update 区分"没传"vs"传空"）
 */
function collectAdapterMap(
  body: Record<string, unknown>,
  system: AdapterSystem,
  mode: 'create' | 'update',
): Partial<Record<AdapterType, string | null | undefined>> {
  const out: Partial<Record<AdapterType, string | null | undefined>> = {};
  for (const t of ADAPTER_TYPES) {
    const raw = pickAdapter(body, t, system);
    if (raw === undefined) {
      if (mode === 'create') out[t] = null; // create 没传等价于 null
      // update 保留 undefined 表示"不更新"
      continue;
    }
    out[t] = raw === null || raw === '' ? null : raw.trim();
  }
  return out;
}

function validateAdapterMap(
  map: Partial<Record<AdapterType, string | null | undefined>>,
  systemLabel: string,
): { ok: true } | { ok: false; msg: string } {
  for (const t of ADAPTER_TYPES) {
    const v = map[t];
    if (v == null || v === '') continue;
    if (!FQN_REGEX.test(v as string)) {
      return { ok: false, msg: `${systemLabel} ${ADAPTER_LABELS[t]} 格式错误：必须为完整类路径（包名.类名），如 com.myadapter.MyInitAdapter` };
    }
  }
  return { ok: true };
}

// 广告平台图标上传限制：2MB
const NETWORK_ICON_MAX_SIZE = 2 * 1024 * 1024;

// 上传自定义广告平台图标（base64 dataURL，要求 png 格式）
// 返回 key + 7d 预签名 URL；前端拿到 URL 后回填到表单，提交创建/更新时一起存
router.post('/custom/upload-icon', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { dataUrl, networkDefId } = req.body as {
      dataUrl?: string;
      networkDefId?: number;
    };

    if (!dataUrl || typeof dataUrl !== 'string') {
      fail(res, 400, '缺少图标数据');
      return;
    }

    const parsed = parseBase64PngImage(dataUrl);
    if (!parsed) {
      fail(res, 400, '仅支持 png 格式，请上传 png 图片');
      return;
    }
    const { mime, buffer } = parsed;

    if (buffer.length === 0) {
      fail(res, 400, '图标数据为空');
      return;
    }
    if (buffer.length > NETWORK_ICON_MAX_SIZE) {
      fail(res, 400, `图标大小不能超过 ${NETWORK_ICON_MAX_SIZE / 1024 / 1024}MB`);
      return;
    }
    // 二次校验：magic bytes 必须是 png
    const ext = detectImageExt(buffer);
    if (ext !== 'png') {
      fail(res, 400, '图标格式不合法（仅支持 png）');
      return;
    }

    const id = networkDefId != null ? Number(networkDefId) : undefined;
    const keyHint = buildNetworkIconKey(developerId, id, 'png');
    const s3 = getStorage();
    // SDK 的 uploadFile 内部会对 fileName 调用 generateObjectKey 添加 UUID 后缀，
    // 返回值才是真实写入 bucket 的 key；预签名 URL 必须用这个真实 key
    const realKey = (await s3.uploadFile({
      fileContent: buffer,
      fileName: keyHint,
      contentType: mime,
    })) as string;

    const iconUrl = await generatePresignedUrlCached(realKey, 7 * 24 * 3600);

    success(res, { key: realKey, iconUrl, mime: 'image/png', size: buffer.length }, '上传成功');
  } catch (err) {
    console.error('Upload network icon error:', err);
    fail(res, 500, '图标上传失败');
  }
});

// List all networks (builtin + custom)
router.get('/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);

    // Get builtin networks (is_preset=true) + user's custom networks (developer_id=me)
    const { data, error } = await db.from('ad_network_def')
      .select('*')
      .or(`is_preset.eq.true,developer_id.eq.${developerId}`)
      .eq('status', 1)
      .order('is_preset', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Query failed: ${error.message}`);

    const list = await enrichWithIconUrl(data || []);
    success(res, { list });
  } catch (err) {
    console.error('List networks error:', err);
    fail(res, 500, '获取网络列表失败');
  }
});

// List custom networks
router.get('/custom/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { page = 1, pageSize = 20 } = req.query as Record<string, string>;

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await db.from('ad_network_def')
      .select('*', { count: 'exact' })
      .eq('developer_id', developerId)
      .eq('is_preset', false)
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);

    if (error) throw new Error(`Query failed: ${error.message}`);

    const list = await enrichWithIconUrl(data || []);
    success(res, { list, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List custom networks error:', err);
    fail(res, 500, '获取自定义网络列表失败');
  }
});

// Create custom network
router.post('/custom/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const body = (req.body ?? {}) as Record<string, unknown>;
    // 前端表单 v-model 使用 snake_case（与数据库列名一致），同时兼容 camelCase（API 直接调用）
    const networkName = (body.network_name ?? body.networkName) as string | undefined;
    const networkCode = (body.network_code ?? body.networkCode) as string | undefined;
    const supportsBidding = (body.supports_bidding ?? body.supportsBidding) as boolean | undefined;
    // system_type 仅用于展示的向后兼容字段：现在由"已填的 init 字段"自动推导
    // 若调用方显式传了 systemType 且和推导结果一致，则按调用方传的；否则以推导为准
    const systemTypeExplicit = (body.system_type ?? body.systemType) as number | undefined;
    // icon URL：可选；若调用方传了空字符串视为清除
    // 注意：必须用 in 检查，不能用 ??（因为 null ?? undefined === undefined）
    const hasIconUrlSnakeC = Object.prototype.hasOwnProperty.call(body, 'icon_url');
    const hasIconUrlCamelC = Object.prototype.hasOwnProperty.call(body, 'iconUrl');
    const iconUrlInput = (hasIconUrlSnakeC ? body.icon_url : hasIconUrlCamelC ? body.iconUrl : undefined) as string | null | undefined;

    if (!networkName) {
      fail(res, 400, '网络名称不能为空');
      return;
    }

    // ========== 平台代码（networkCode）校验 ==========
    // 1. 必填
    if (!networkCode || typeof networkCode !== 'string') {
      fail(res, 400, '平台代码不能为空');
      return;
    }
    // 2. 格式：必须以大写字母开头，仅含大写字母/数字/下划线，3-32 位
    const code = networkCode.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{2,31}$/.test(code)) {
      fail(res, 400, '平台代码格式错误：必须以大写字母开头，仅含大写字母、数字、下划线，长度 3-32 位');
      return;
    }
    // 3. 与系统预置平台代码冲突检测
    const PRESET_NETWORK_CODES = ['CSJ', 'YLH', 'BD', 'GDT', 'KS', 'XM', 'BID'];
    if (PRESET_NETWORK_CODES.includes(code)) {
      fail(res, 400, `平台代码 "${code}" 与系统预置广告平台代码冲突，请更换`);
      return;
    }
    // 4. DB 唯一性检测（含其他开发者的 custom 网络）
    const { data: codeExists, error: codeCheckErr } = await db
      .from('ad_network_def')
      .select('id')
      .eq('network_code', code)
      .maybeSingle();
    if (codeCheckErr) throw new Error(`Code check failed: ${codeCheckErr.message}`);
    if (codeExists) {
      fail(res, 400, `平台代码 "${code}" 已被占用，请更换`);
      return;
    }

    // ========== 收集两个系统的 Adapter 字段（per-system） ==========
    const androidMap = collectAdapterMap(body, 'android', 'create');
    const iosMap = collectAdapterMap(body, 'ios', 'create');

    // ========== 校验：Android / iOS 两组字段格式 ==========
    const androidCheck = validateAdapterMap(androidMap, 'Android');
    if (!androidCheck.ok) { fail(res, 400, androidCheck.msg); return; }
    const iosCheck = validateAdapterMap(iosMap, 'iOS');
    if (!iosCheck.ok) { fail(res, 400, iosCheck.msg); return; }

    // ========== 校验：至少一个系统填写了 init（必填项） ==========
    const hasAndroid = !!(androidMap.init && (androidMap.init as string).trim());
    const hasIos = !!(iosMap.init && (iosMap.init as string).trim());
    if (!hasAndroid && !hasIos) {
      fail(res, 400, '初始化 Adapter 至少需要配置一个系统（Android 或 iOS）');
      return;
    }

    // ========== 自动推导 system_type ==========
    //   1 = Android, 2 = iOS, 3 = Both
    const systemTypeDerived = hasAndroid && hasIos ? 3 : hasAndroid ? 1 : 2;
    const systemType = systemTypeDerived;
    if (systemTypeExplicit != null) {
      const n = Number(systemTypeExplicit);
      if (![1, 2, 3].includes(n)) {
        fail(res, 400, '系统类型取值错误：1=Android, 2=iOS, 3=通用（Both）');
        return;
      }
      // 提示：若显式 systemType 与推导不一致，以推导为准（防止数据不一致）
      if (n !== systemTypeDerived) {
        console.warn(`[network/create] systemType explicit=${n} but derived=${systemTypeDerived}, use derived`);
      }
    }

    // ========== 写入 DB：12 个 per-system 字段 + icon_url ==========
    const insertRow: Record<string, unknown> = {
      network_code: code,
      network_name: networkName,
      is_preset: false,
      developer_id: developerId,
      supports_bidding: supportsBidding ? 1 : 0,
      system_type: systemType,
    };
    for (const t of ADAPTER_TYPES) {
      insertRow[col(t, 'android')] = (androidMap[t] as string | null) ?? null;
      insertRow[col(t, 'ios')] = (iosMap[t] as string | null) ?? null;
    }
    // icon_url 可选：归一化为 storage key（去除 presigned URL 的 host + query）
    if (iconUrlInput && typeof iconUrlInput === 'string' && iconUrlInput.trim()) {
      insertRow.icon_url = extractStorageKey(iconUrlInput.trim()) ?? iconUrlInput.trim();
    } else {
      insertRow.icon_url = null;
    }

    const { data, error } = await db.from('ad_network_def').insert(insertRow).select().single();

    if (error) throw new Error(`Insert failed: ${error.message}`);

    // 附加 fresh presigned URL（与 list/detail 行为一致）
    const enriched = await enrichWithIconUrl([data]);
    success(res, enriched[0], '创建成功');
  } catch (err) {
    console.error('Create custom network error:', err);
    fail(res, 500, '创建自定义网络失败');
  }
});

// Update custom network
router.post('/custom/update', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const id = body.id;
    const networkName = (body.network_name ?? body.networkName) as string | undefined;
    const supportsBidding = (body.supports_bidding ?? body.supportsBidding) as boolean | undefined;
    const status = body.status as number | undefined;
    const systemTypeExplicit = (body.system_type ?? body.systemType) as number | undefined;
    // icon_url：undefined = 不修改；null/空字符串 = 清除
    // 注意：必须用 in 检查，不能用 ??（因为 null ?? undefined === undefined）
    const hasIconUrlSnake = Object.prototype.hasOwnProperty.call(body, 'icon_url');
    const hasIconUrlCamel = Object.prototype.hasOwnProperty.call(body, 'iconUrl');
    const iconUrlInput = (hasIconUrlSnake ? body.icon_url : hasIconUrlCamel ? body.iconUrl : undefined) as string | null | undefined;

    if (!id) {
      fail(res, 400, '缺少网络id');
      return;
    }

    // Verify ownership
    const { data: existing, error: checkError } = await db.from('ad_network_def').select('developer_id').eq('id', id).single();
    if (checkError || !existing || existing.developer_id !== developerId) {
      fail(res, 403, '无权操作此网络');
      return;
    }

    // 收集 per-system 字段（未传字段保持 undefined）
    const androidMap = collectAdapterMap(body, 'android', 'update');
    const iosMap = collectAdapterMap(body, 'ios', 'update');

    // 校验传入字段的格式
    const androidCheck = validateAdapterMap(androidMap, 'Android');
    if (!androidCheck.ok) { fail(res, 400, androidCheck.msg); return; }
    const iosCheck = validateAdapterMap(iosMap, 'iOS');
    if (!iosCheck.ok) { fail(res, 400, iosCheck.msg); return; }

    const updateData: Record<string, unknown> = {};
    if (networkName !== undefined) updateData.network_name = networkName;

    // 写入 per-system 字段（仅当有传入时）
    for (const t of ADAPTER_TYPES) {
      if (androidMap[t] !== undefined) updateData[col(t, 'android')] = androidMap[t] ?? null;
      if (iosMap[t] !== undefined) updateData[col(t, 'ios')] = iosMap[t] ?? null;
    }

    // ========== 重新推导 system_type（基于更新后的值） ==========
    //   1) 读取当前 DB 中的 androidMap / iosMap（如果未传则用现值）
    //   2) 校验：更新后必须至少有一个 init
    const { data: current, error: curErr } = await db.from('ad_network_def')
      .select('adapter_class_init_android, adapter_class_init_ios')
      .eq('id', id).single();
    if (curErr) throw new Error(`Read current failed: ${curErr.message}`);

    const finalAndroidInit = (androidMap.init !== undefined ? androidMap.init : current?.adapter_class_init_android) as string | null;
    const finalIosInit = (iosMap.init !== undefined ? iosMap.init : current?.adapter_class_init_ios) as string | null;
    const hasAndroid = !!(finalAndroidInit && (finalAndroidInit as string).trim());
    const hasIos = !!(finalIosInit && (finalIosInit as string).trim());

    if (!hasAndroid && !hasIos) {
      fail(res, 400, '初始化 Adapter 至少需要配置一个系统（Android 或 iOS）');
      return;
    }
    const systemTypeDerived = hasAndroid && hasIos ? 3 : hasAndroid ? 1 : 2;
    updateData.system_type = systemTypeDerived;
    if (systemTypeExplicit != null) {
      const n = Number(systemTypeExplicit);
      if (![1, 2, 3].includes(n)) {
        fail(res, 400, '系统类型取值错误：1=Android, 2=iOS, 3=通用（Both）');
        return;
      }
      if (n !== systemTypeDerived) {
        console.warn(`[network/update] systemType explicit=${n} but derived=${systemTypeDerived}, use derived`);
      }
    }

    if (supportsBidding !== undefined) updateData.supports_bidding = supportsBidding ? 1 : 0;
    if (status !== undefined) updateData.status = status;
    // icon_url：调用方传了字段（含空字符串）才覆盖
    if (iconUrlInput !== undefined) {
      if (iconUrlInput && typeof iconUrlInput === 'string' && iconUrlInput.trim()) {
        updateData.icon_url = extractStorageKey(iconUrlInput.trim()) ?? iconUrlInput.trim();
      } else {
        updateData.icon_url = null;
      }
    }

    const { error } = await db.from('ad_network_def').update(updateData).eq('id', id);
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update custom network error:', err);
    fail(res, 500, '更新自定义网络失败');
  }
});

// RESTful: PUT /api/v1/console/network/custom/:id  (frontend 用此路径)
router.put('/custom/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const networkName = (body.network_name ?? body.networkName) as string | undefined;
    const networkCode = (body.network_code ?? body.networkCode) as string | undefined;
    const supportsBidding = (body.supports_bidding ?? body.supportsBidding) as boolean | undefined;
    const systemTypeExplicit = (body.system_type ?? body.systemType) as number | undefined;
    const status = body.status as number | undefined;
    // icon_url：undefined = 不修改；null/空字符串 = 清除
    const _hasIconUrlSnake = Object.prototype.hasOwnProperty.call(body || {}, 'icon_url');
    const _hasIconUrlCamel = Object.prototype.hasOwnProperty.call(body || {}, 'iconUrl');
    const iconUrlInput = (_hasIconUrlSnake ? body.icon_url : _hasIconUrlCamel ? body.iconUrl : undefined) as string | null | undefined;
    if (!id) return fail(res, 400, '缺少网络id');

    const { data: existing, error: checkError } = await db.from('ad_network_def').select('developer_id').eq('id', Number(id)).single();
    if (checkError || !existing || existing.developer_id !== developerId) {
      fail(res, 403, '无权操作此网络');
      return;
    }

    // 收集 per-system 字段
    const androidMap = collectAdapterMap(body, 'android', 'update');
    const iosMap = collectAdapterMap(body, 'ios', 'update');
    const androidCheck = validateAdapterMap(androidMap, 'Android');
    if (!androidCheck.ok) { fail(res, 400, androidCheck.msg); return; }
    const iosCheck = validateAdapterMap(iosMap, 'iOS');
    if (!iosCheck.ok) { fail(res, 400, iosCheck.msg); return; }

    const updateData: Record<string, unknown> = {};
    if (networkName !== undefined) updateData.network_name = String(networkName);
    if (networkCode !== undefined) updateData.network_code = String(networkCode);
    for (const t of ADAPTER_TYPES) {
      if (androidMap[t] !== undefined) updateData[col(t, 'android')] = androidMap[t] ?? null;
      if (iosMap[t] !== undefined) updateData[col(t, 'ios')] = iosMap[t] ?? null;
    }
    if (supportsBidding !== undefined) updateData.supports_bidding = supportsBidding ? 1 : 0;
    if (status !== undefined) updateData.status = Number(status);
    // icon_url：调用方传了字段（含空字符串）才覆盖
    if (iconUrlInput !== undefined) {
      if (iconUrlInput && typeof iconUrlInput === 'string' && iconUrlInput.trim()) {
        updateData.icon_url = extractStorageKey(iconUrlInput.trim()) ?? iconUrlInput.trim();
      } else {
        updateData.icon_url = null;
      }
    }

    // 推导 system_type：基于更新后的 init 字段
    const { data: current, error: curErr } = await db.from('ad_network_def')
      .select('adapter_class_init_android, adapter_class_init_ios')
      .eq('id', Number(id)).single();
    if (curErr) throw new Error(`Read current failed: ${curErr.message}`);

    const finalAndroidInit = (androidMap.init !== undefined ? androidMap.init : current?.adapter_class_init_android) as string | null;
    const finalIosInit = (iosMap.init !== undefined ? iosMap.init : current?.adapter_class_init_ios) as string | null;
    const hasAndroid = !!(finalAndroidInit && (finalAndroidInit as string).trim());
    const hasIos = !!(finalIosInit && (finalIosInit as string).trim());

    if (!hasAndroid && !hasIos) {
      fail(res, 400, '初始化 Adapter 至少需要配置一个系统（Android 或 iOS）');
      return;
    }
    const systemTypeDerived = hasAndroid && hasIos ? 3 : hasAndroid ? 1 : 2;
    updateData.system_type = systemTypeDerived;
    if (systemTypeExplicit != null) {
      const n = Number(systemTypeExplicit);
      if (![1, 2, 3].includes(n)) {
        fail(res, 400, '系统类型取值错误：1=Android, 2=iOS, 3=通用（Both）');
        return;
      }
      if (n !== systemTypeDerived) {
        console.warn(`[network/put] systemType explicit=${n} but derived=${systemTypeDerived}, use derived`);
      }
    }

    const { error } = await db.from('ad_network_def').update(updateData).eq('id', Number(id));
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '更新成功');
  } catch (err) {
    console.error('Update custom network (RESTful) error:', err);
    fail(res, 500, '更新自定义网络失败');
  }
});

// RESTful: DELETE /api/v1/console/network/custom/:id
router.delete('/custom/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少网络id');

    const { data: existing, error: checkError } = await db.from('ad_network_def').select('developer_id').eq('id', Number(id)).single();
    if (checkError || !existing || existing.developer_id !== developerId) {
      fail(res, 403, '无权操作此网络');
      return;
    }

    // Guard: 平台下还有账号时禁止删除
    const { count: accountCount, error: accountErr } = await db.from('ad_network_account')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerId)
      .eq('network_def_id', Number(id));
    if (accountErr) throw new Error(`Account count failed: ${accountErr.message}`);
    if (accountCount && accountCount > 0) {
      fail(res, 400, `该平台下还有 ${accountCount} 个账号，请先删除账号`);
      return;
    }

    // Guard: 平台下还有应用绑定时禁止删除
    const { count: bindingCount, error: bindingErr } = await db.from('app_network_binding')
      .select('*', { count: 'exact', head: true })
      .eq('network_def_id', Number(id));
    if (bindingErr) throw new Error(`Binding count failed: ${bindingErr.message}`);
    if (bindingCount && bindingCount > 0) {
      fail(res, 400, `该平台下还有 ${bindingCount} 个应用绑定，请先解除绑定`);
      return;
    }

    const { error } = await db.from('ad_network_def').delete().eq('id', Number(id));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete custom network (RESTful) error:', err);
    fail(res, 500, '删除自定义网络失败');
  }
});

// Get custom network detail
router.get('/custom/detail', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.query as Record<string, string>;
    if (!id) {
      fail(res, 400, '缺少网络id');
      return;
    }

    const { data, error } = await db.from('ad_network_def').select('*').eq('id', Number(id)).single();
    if (error) throw new Error(`Query failed: ${error.message}`);

    const [enriched] = await enrichWithIconUrl([data]);
    success(res, enriched || data);
  } catch (err) {
    console.error('Get network detail error:', err);
    fail(res, 500, '获取网络详情失败');
  }
});

// Adapter version list
router.get('/custom/adapter/versions', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { networkDefId, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    if (!networkDefId) {
      fail(res, 400, '缺少networkDefId');
      return;
    }

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await db.from('custom_adapter_version')
      .select('*', { count: 'exact' })
      .eq('network_def_id', Number(networkDefId))
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);

    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Adapter versions error:', err);
    fail(res, 500, '获取Adapter版本列表失败');
  }
});

// Upload adapter (create version record)
router.post('/custom/adapter/upload', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkDefId, version, fileName, fileUrl, fileSize, fileMd5, sdkMinVersion, changelog } = req.body;

    if (!networkDefId || !version || !fileName || !fileUrl) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    const { data, error } = await db.from('custom_adapter_version').insert({
      network_def_id: Number(networkDefId),
      developer_id: developerId,
      version,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize || null,
      file_md5: fileMd5 || null,
      sdk_min_version: sdkMinVersion || null,
      changelog: changelog || null,
      status: 1, // pending review
    }).select().single();

    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '上传成功');
  } catch (err) {
    console.error('Upload adapter error:', err);
    fail(res, 500, '上传Adapter失败');
  }
});

// Update adapter status (review)
router.put('/custom/adapter/status', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id, status, reviewComment } = req.body;
    if (!id || !status) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    const updateData: Record<string, unknown> = { status: Number(status) };
    if (reviewComment !== undefined) updateData.review_comment = reviewComment;
    if (Number(status) === 2 || Number(status) === 4) {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { error } = await db.from('custom_adapter_version').update(updateData).eq('id', Number(id));
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, null, '状态更新成功');
  } catch (err) {
    console.error('Update adapter status error:', err);
    fail(res, 500, '更新状态失败');
  }
});

// RESTful: DELETE /api/v1/console/network/adapter/:id  (frontend 用此路径)
router.delete('/adapter/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少adapter id');

    // Step 1: 取 adapter 记录 (single)
    const { data: adapter } = await db.from('custom_adapter_version')
      .select('id, network_def_id')
      .eq('id', Number(id))
      .maybeSingle();
    if (!adapter) {
      fail(res, 404, 'Adapter 不存在');
      return;
    }

    // Step 2: 校验所属网络是否属于当前 developer
    const { data: net } = await db.from('ad_network_def')
      .select('developer_id')
      .eq('id', adapter.network_def_id)
      .maybeSingle();
    if (!net || net.developer_id !== developerId) {
      fail(res, 403, '无权操作此 Adapter');
      return;
    }

    const { error } = await db.from('custom_adapter_version').delete().eq('id', Number(id));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '删除成功');
  } catch (err) {
    console.error('Delete adapter (RESTful) error:', err);
    fail(res, 500, '删除Adapter失败');
  }
});

// RESTful: GET /api/v1/console/network/adapter/list?networkDefId=... (frontend 期望)
router.get('/adapter/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { networkDefId, page = 1, pageSize = 20 } = req.query as Record<string, string>;
    if (!networkDefId) return fail(res, 400, '缺少networkDefId');

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await db.from('custom_adapter_version')
      .select('*', { count: 'exact' })
      .eq('network_def_id', Number(networkDefId))
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Adapter list (RESTful) error:', err);
    fail(res, 500, '获取Adapter版本列表失败');
  }
});

// RESTful: POST /api/v1/console/network/adapter/upload
router.post('/adapter/upload', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { networkDefId, version, fileName, fileUrl, fileSize, fileMd5, sdkMinVersion, changelog } = req.body;
    if (!networkDefId || !version || !fileName || !fileUrl) return fail(res, 400, '缺少必填参数');

    const { data, error } = await db.from('custom_adapter_version').insert({
      network_def_id: Number(networkDefId),
      developer_id: developerId,
      version,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize || null,
      file_md5: fileMd5 || null,
      sdk_min_version: sdkMinVersion || null,
      changelog: changelog || null,
      status: 1,
    }).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data, '上传成功');
  } catch (err) {
    console.error('Adapter upload (RESTful) error:', err);
    fail(res, 500, '上传Adapter失败');
  }
});

// RESTful: GET /api/v1/console/network/adapter/download/:id
router.get('/adapter/download/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    if (!id) return fail(res, 400, '缺少adapter id');

    const { data, error } = await db.from('custom_adapter_version')
      .select('file_name, file_url')
      .eq('id', Number(id))
      .maybeSingle();
    if (error) throw new Error(`Query failed: ${error.message}`);
    if (!data) return fail(res, 404, 'Adapter 不存在');

    // Simulate file content (实际生产从对象存储拉取)
    const { data: fileData } = await db.storage.from('adapter').download(data.file_url).catch(() => ({ data: null }));
    const fileContent = fileData ? await fileData.text() : `// Mock content for ${data.file_name} (${data.file_url})`;
    success(res, { file_name: data.file_name, file_content: fileContent });
  } catch (err) {
    console.error('Adapter download (RESTful) error:', err);
    fail(res, 500, '下载Adapter失败');
  }
});

// RESTful: POST /api/v1/console/network/adapter/review/:id
router.post('/adapter/review/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    if (!id) return fail(res, 400, '缺少adapter id');
    if (status !== 2 && status !== 3) return fail(res, 400, 'status 必须是 2(通过) 或 3(驳回)');

    const { data, error } = await db.from('custom_adapter_version').update({
      status: Number(status),
      review_comment: remark || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', Number(id)).select().single();
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, data, status === 2 ? '审核通过' : '已驳回');
  } catch (err) {
    console.error('Adapter review (RESTful) error:', err);
    fail(res, 500, '审核失败');
  }
});

// Bind network to app
router.post('/app/bind', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, networkDefId, adapterVersionId, networkAppId, extraParams } = req.body;
    if (!appKey || !networkDefId) {
      fail(res, 400, '缺少必填参数');
      return;
    }
    // 平台应用 ID 缺省回退为 appKey（用于简化关联流程，后续可在网络平台详情补填）
    const finalNetworkAppId = (networkAppId && String(networkAppId).trim()) || appKey;

    // Verify app ownership
    const { data: appData } = await db.from('app').select('developer_id').eq('app_key', appKey).single();
    if (!appData || appData.developer_id !== developerId) {
      fail(res, 403, '无权操作此应用');
      return;
    }

    const { data, error } = await db.from('app_network_binding').insert({
      app_key: appKey,
      network_def_id: Number(networkDefId),
      adapter_version_id: adapterVersionId ? Number(adapterVersionId) : 0,
      network_app_id: finalNetworkAppId,
      extra_params: extraParams || null,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        fail(res, 409, '该网络已关联此应用');
        return;
      }
      throw new Error(`Insert failed: ${error.message}`);
    }

    success(res, data, '关联成功');
  } catch (err) {
    console.error('Bind network error:', err);
    fail(res, 500, '关联网络失败');
  }
});

// Unbind network from app
router.post('/app/unbind', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, networkDefId } = req.body;

    if (!appKey || !networkDefId) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    // Verify app ownership
    const { data: appData } = await db.from('app').select('developer_id').eq('app_key', appKey).single();
    if (!appData || appData.developer_id !== developerId) {
      fail(res, 403, '无权操作此应用');
      return;
    }

    const { error } = await db.from('app_network_binding').delete().eq('app_key', appKey).eq('network_def_id', Number(networkDefId));
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, null, '解除关联成功');
  } catch (err) {
    console.error('Unbind network error:', err);
    fail(res, 500, '解除关联失败');
  }
});

// List app network bindings
router.get('/app/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { appKey } = req.query as Record<string, string>;
    if (!appKey) {
      fail(res, 400, '缺少appKey');
      return;
    }

    // 1) 查 binding 列表
    const { data: bindings, error: bindErr } = await db
      .from('app_network_binding')
      .select('id, app_key, network_def_id, adapter_version_id, network_app_id, extra_params, status, created_at')
      .eq('app_key', appKey);
    if (bindErr) throw new Error(`Query failed: ${bindErr.message}`);
    if (!bindings || bindings.length === 0) {
      success(res, { list: [] });
      return;
    }

    // 2) 一次性查出所有相关 ad_network_def（避免 N+1）
    interface NetworkDef {
      id: number
      network_code: string
      network_name: string
      is_preset: boolean
    }
    interface Binding {
      id: number
      app_key: string
      network_def_id: number
      adapter_version_id: number
      network_app_id: string
      extra_params: Record<string, unknown> | null
      status: number
      created_at: string
      account_id: number | null
    }
    const bindList = bindings as Binding[]
    const defIds = Array.from(new Set(bindList.map(b => b.network_def_id).filter(Boolean)));
    let defMap: Record<number, NetworkDef> = {};
    if (defIds.length > 0) {
      const { data: defs, error: defErr } = await db
        .from('ad_network_def')
        .select('id, network_code, network_name, is_preset')
        .in('id', defIds);
      if (defErr) throw new Error(`Query defs failed: ${defErr.message}`);
      defMap = Object.fromEntries(((defs || []) as NetworkDef[]).map(d => [d.id, d]));
    }

    // 3) 合并返回
    const list = bindList.map(b => {
      const def = defMap[b.network_def_id] || ({} as Partial<NetworkDef>);
      return {
        ...b,
        network_name: def.network_name || '',
        network_code: def.network_code || '',
        is_preset: def.is_preset ?? false,
      };
    });

    success(res, { list });
  } catch (err) {
    console.error('List app networks error:', err);
    fail(res, 500, '获取应用网络列表失败');
  }
});

// Upload custom network report data
router.post('/custom/report/upload', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, placementId, networkDefId, statDate, impressions, clicks, revenue, uploadType } = req.body;

    if (!appKey || !placementId || !networkDefId || !statDate) {
      fail(res, 400, '缺少必填参数');
      return;
    }

    const { error } = await db.from('custom_network_report').upsert({
      developer_id: developerId,
      app_key: appKey,
      placement_id: placementId,
      network_def_id: Number(networkDefId),
      stat_date: statDate,
      impressions: Number(impressions || 0),
      clicks: Number(clicks || 0),
      revenue: Number(revenue || 0),
      upload_type: Number(uploadType || 1),
    }, { onConflict: 'developer_id,app_key,placement_id,network_def_id,stat_date' });

    if (error) throw new Error(`Upsert failed: ${error.message}`);

    success(res, null, '上传成功');
  } catch (err) {
    console.error('Upload custom report error:', err);
    fail(res, 500, '上传数据失败');
  }
});

// Query custom network report data
router.get('/custom/report/query', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { appKey, networkDefId, startDate, endDate, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    let query = db.from('custom_network_report').select('*', { count: 'exact' }).eq('developer_id', developerId);

    if (appKey) query = query.eq('app_key', appKey);
    if (networkDefId) query = query.eq('network_def_id', Number(networkDefId));
    if (startDate) query = query.gte('stat_date', startDate);
    if (endDate) query = query.lte('stat_date', endDate);

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('stat_date', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    success(res, { list: data, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('Query custom report error:', err);
    fail(res, 500, '查询数据失败');
  }
});

// ============== 广告网络账号（6 步对接流程 步骤 2） ==============

// Create network account
router.post('/account/create', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { network_def_id, app_id, account_name, account_id, credentials, status, remark } = req.body as Record<string, unknown>;

    if (!network_def_id) return fail(res, 400, '广告平台不能为空');
    if (!account_name) return fail(res, 400, '账号名称不能为空');

    const insertData = {
      developer_id: developerId,
      network_def_id: Number(network_def_id),
      app_id: app_id ? Number(app_id) : null,
      account_name: String(account_name),
      account_id: account_id ? String(account_id) : null,
      credentials: credentials || {},
      status: status ? Number(status) : 1,
      remark: remark ? String(remark) : null,
    };

    const { data, error } = await db.from('ad_network_account').insert(insertData).select().single();
    if (error) throw new Error(`Insert failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Create network account error:', err);
    fail(res, 500, '创建账号失败');
  }
});

// List network accounts
router.get('/account/list', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { network_def_id, app_id, status, page = 1, pageSize = 20 } = req.query as Record<string, string>;

    let query = db.from('ad_network_account').select('*', { count: 'exact' }).eq('developer_id', developerId);
    if (network_def_id) query = query.eq('network_def_id', Number(network_def_id));
    if (app_id) query = query.eq('app_id', Number(app_id));
    if (status) query = query.eq('status', Number(status));

    const p = Number(page);
    const ps = Number(pageSize);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);
    if (error) throw new Error(`Query failed: ${error.message}`);

    // Enrich with network name + code from ad_network_def
    const defIds = Array.from(new Set((data || []).map(d => d.network_def_id).filter(Boolean)));
    const defMap: Record<number, { network_name: string, network_code: string }> = {};
    if (defIds.length) {
      const { data: defs } = await db.from('ad_network_def').select('id, network_name, network_code').in('id', defIds);
      (defs || []).forEach((d: { id: number, network_name: string, network_code: string }) => {
        defMap[d.id] = { network_name: d.network_name, network_code: d.network_code };
      });
    }
    const enriched = (data || []).map(d => ({
      ...d,
      network_name: defMap[d.network_def_id]?.network_name || null,
      network_code: defMap[d.network_def_id]?.network_code || null,
    }));

    success(res, { list: enriched, total: count, page: p, pageSize: ps });
  } catch (err) {
    console.error('List network accounts error:', err);
    fail(res, 500, '获取账号列表失败');
  }
});

// Get network account detail
router.get('/account/detail', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.query as Record<string, string>;
    if (!id) return fail(res, 400, '账号 ID 不能为空');

    const { data, error } = await db.from('ad_network_account')
      .select('*')
      .eq('id', Number(id))
      .eq('developer_id', developerId)
      .single();
    if (error) throw new Error(`Query failed: ${error.message}`);

    // Enrich with network name + code
    let network_name: string | null = null;
    let network_code: string | null = null;
    if (data?.network_def_id) {
      const { data: def } = await db.from('ad_network_def').select('network_name, network_code').eq('id', data.network_def_id).maybeSingle();
      network_name = def?.network_name || null;
      network_code = def?.network_code || null;
    }
    success(res, { ...data, network_name, network_code });
  } catch (err) {
    console.error('Detail network account error:', err);
    fail(res, 500, '获取账号详情失败');
  }
});

// Update network account
router.put('/account/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    const { account_name, account_id, credentials, status, app_id, remark } = req.body as Record<string, unknown>;
    if (!id) return fail(res, 400, '账号 ID 不能为空');

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (account_name !== undefined) updateData.account_name = String(account_name);
    if (account_id !== undefined) updateData.account_id = account_id ? String(account_id) : null;
    if (credentials !== undefined) updateData.credentials = credentials;
    if (status !== undefined) updateData.status = Number(status);
    if (app_id !== undefined) updateData.app_id = app_id ? Number(app_id) : null;
    if (remark !== undefined) updateData.remark = remark ? String(remark) : null;

    const { data, error } = await db.from('ad_network_account')
      .update(updateData)
      .eq('id', Number(id))
      .eq('developer_id', developerId)
      .select()
      .single();
    if (error) throw new Error(`Update failed: ${error.message}`);

    success(res, data);
  } catch (err) {
    console.error('Update network account error:', err);
    fail(res, 500, '更新账号失败');
  }
});

// Delete network account
router.delete('/account/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { developerId } = getDeveloper(req);
    const { id } = req.params;
    if (!id) return fail(res, 400, '账号 ID 不能为空');

    const { error } = await db.from('ad_network_account')
      .delete()
      .eq('id', Number(id))
      .eq('developer_id', developerId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    success(res, { id: Number(id) });
  } catch (err) {
    console.error('Delete network account error:', err);
    fail(res, 500, '删除账号失败');
  }
});

export default router;
// test
