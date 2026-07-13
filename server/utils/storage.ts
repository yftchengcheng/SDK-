import { randomUUID } from 'node:crypto';
import { S3Storage } from 'coze-coding-dev-sdk';

let _storage: S3Storage | null = null;

export function getStorage(): S3Storage {
  if (!_storage) {
    _storage = new S3Storage();
  }
  return _storage;
}

/**
 * 预签名 URL 内存缓存（key → { url, expiresAt }）
 * - 同一 key 6 小时内复用同一 URL，避免每次列表都触发 N 次 S3 网络往返
 * - 自动剔除过期项
 */
const PRESIGN_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h（远小于 7d 有效期，安全）
const presignCache = new Map<string, { url: string; expiresAt: number }>();

export async function generatePresignedUrlCached(key: string, expireTime: number = 7 * 24 * 3600): Promise<string> {
  const cached = presignCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }
  const url = await getStorage().generatePresignedUrl({ key, expireTime });
  presignCache.set(key, { url, expiresAt: now + PRESIGN_CACHE_TTL_MS });
  return url;
}

export function buildAppIconKey(developerId: string, appKey?: string, ext: string = 'png'): string {
  // appKey 为可选：创建应用前上传图标时，使用 UUID 作为占位避免冲突
  const suffix = appKey ?? randomUUID();
  return `apps/icons/${developerId}/${suffix}-${Date.now()}.${ext}`;
}

/**
 * 自定义广告平台图标 key
 * - 在创建广告平台前上传图标时使用 networkDefId 或 UUID 作为占位
 * - 与 app 图标隔离，路径前缀不同
 */
export function buildNetworkIconKey(developerId: string, networkDefId?: number, ext: string = 'png'): string {
  const suffix = networkDefId != null ? `net_${networkDefId}` : `tmp_${randomUUID()}`;
  return `networks/icons/${developerId}/${suffix}-${Date.now()}.${ext}`;
}

/**
 * 解析前端传来的 dataURL/base64 图像，返回 { buffer, mime, ext } 或 null
 */
export function parseBase64Image(input: string): { buffer: Buffer; mime: string; ext: string } | null {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/^data:(image\/(?:png|jpe?g));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  const ext = mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : 'png';
  return { buffer, mime, ext };
}

/**
 * 仅解析 PNG 格式（用于广告平台图标强制要求 png 的场景）
 */
export function parseBase64PngImage(input: string): { buffer: Buffer; mime: string; ext: string } | null {
  const parsed = parseBase64Image(input);
  if (!parsed) return null;
  if (parsed.mime !== 'image/png') return null;
  return parsed;
}

/** 从 MIME 字符串或 Buffer magic bytes 推断文件扩展名（不含点） */
export function detectImageExt(input: string | Buffer): string {
  if (typeof input === 'string') {
    const m = input.toLowerCase();
    if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
    if (m === 'image/png') return 'png';
    return '';
  }
  if (input.length >= 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) return 'jpg';
  if (input.length >= 8 &&
      input[0] === 0x89 && input[1] === 0x50 && input[2] === 0x4e && input[3] === 0x47 &&
      input[4] === 0x0d && input[5] === 0x0a && input[6] === 0x1a && input[7] === 0x0a) return 'png';
  return '';
}

/**
 * 从一个值中提取出存储 key：
 * - 如果本身已经是 key（不带协议头），原样返回（去掉首尾斜杠）
 * - 如果是 presigned URL（含 http(s)://），解析后从 pathname 中找到 bucket 前缀之后的部分
 * - 否则返回原值
 *
 * 用途：兼容老数据（之前误把 presigned URL 存进 DB）和新数据（直接存 key）
 */
export function extractStorageKey(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  const v = String(urlOrKey).trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) {
    return v.replace(/^\/+/, '');
  }
  try {
    const u = new URL(v);
    const path = u.pathname.replace(/^\/+/, '');
    // pathname 形如：coze_storage_<bucketId>/<realKey...>
    // 找到第一个 "/" 后的内容
    const idx = path.indexOf('/');
    return idx >= 0 ? path.slice(idx + 1) : path;
  } catch {
    return v;
  }
}

/**
 * 把 icon_url 字段（可能是 key 或过期的 presigned URL）转成一个新的 7 天有效期的 presigned URL。
 * 失败时返回 null。
 */
export async function resolveIconUrl(iconValue: string | null | undefined): Promise<string | null> {
  const key = extractStorageKey(iconValue);
  if (!key) return null;
  try {
    return await generatePresignedUrlCached(key, 7 * 24 * 3600);
  } catch {
    return null;
  }
}
