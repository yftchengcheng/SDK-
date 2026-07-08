import { randomUUID } from 'node:crypto';
import { S3Storage } from 'coze-coding-dev-sdk';
import type { Request } from 'express';

let _storage: S3Storage | null = null;

export function getStorage(): S3Storage {
  if (!_storage) {
    _storage = new S3Storage();
  }
  return _storage;
}

export function buildAppIconKey(developerId: string, appKey?: string, ext: string = 'png'): string {
  // appKey 为可选：创建应用前上传图标时，使用 UUID 作为占位避免冲突
  const suffix = appKey ?? randomUUID();
  return `apps/icons/${developerId}/${suffix}-${Date.now()}.${ext}`;
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
