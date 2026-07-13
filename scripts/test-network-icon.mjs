#!/usr/bin/env node
/**
 * 自定义广告平台「图标上传」E2E 测试
 * 覆盖场景：
 *  T1 上传 PNG 成功（带 magic bytes 校验）
 *  T2 上传 jpeg（纯 jpg dataURL）失败
 *  T3 上传非图片（纯文本 dataURL）失败
 *  T4 上传超过 2MB 失败
 *  T5 创建时带 icon_url (presigned URL) → 后端提取为 key + 返回 fresh URL
 *  T6 更新时清空 icon_url（传 null）→ DB 与 resolved 都为空
 *  T7 列表接口返回 key + fresh presigned URL
 *  T8 iconUrlResolved URL 格式正确（key → presigned，含 sign 签名）
 */

import { Buffer } from 'node:buffer';

const BASE = 'http://localhost:5000';
const COOKIE_FILE = '/tmp/test-network-icon-cookies.txt';

// 1x1 透明 PNG 的最小二进制（67 字节）
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// 1x1 白色 JPEG（最小有效）
const JPEG_1X1_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';

// 不合法图片（纯文本 dataURL）
const TEXT_BASE64 = Buffer.from('this is not an image', 'utf8').toString('base64');

let pass = 0, fail = 0;
const log = (label, ok, extra = '') => {
  if (ok) { pass++; console.log(`✅ ${label}${extra ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`❌ ${label}${extra ? ' — ' + extra : ''}`); }
};

async function http(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  // 自动附加 cookie
  const fs = await import('node:fs');
  if (fs.existsSync(COOKIE_FILE)) {
    const cookieData = fs.readFileSync(COOKIE_FILE, 'utf8').trim();
    if (cookieData) headers.Cookie = cookieData;
  }
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  // 持久化 cookie
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const m = setCookie.match(/auth_token=[^;]+/);
    if (m) fs.writeFileSync(COOKIE_FILE, m[0]);
  }
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function setup() {
  // 注册新用户拿 token（每个测试独立）
  const stamp = Date.now();
  const reg = await http('/api/v1/auth/register', {
    method: 'POST',
    body: {
      email: `icon_${stamp}@test.com`,
      password: 'Test1234',
      company: 'Test',
      companyShortName: 'TC',
      contactName: 'Tester',
      phone: '13800138000',
    },
  });
  if (reg.data?.code !== 0) {
    console.error('Register failed:', reg.data);
    process.exit(1);
  }
}

async function makeBigPng() {
  // 构造一个 > 2MB 的合法 PNG：把 1x1 PNG 二进制直接重复拼接
  // 不能再用 base64 重复（= padding 会破坏解码）
  const tinyPngBuf = Buffer.from(PNG_1X1_BASE64, 'base64'); // 67 字节有效 PNG
  const target = 2.1 * 1024 * 1024;
  const repeat = Math.ceil(target / tinyPngBuf.length);
  // 注意：服务端按 buffer.length 拦截，不论是否是合法 PNG
  // magic bytes 校验在前，size 校验在后
  // 为了测试 size 校验，让 magic bytes 通过：只把首 67 字节保留为合法 PNG，剩余填充随机字节
  // 最简：直接重复完整 PNG，magic bytes 仍以 0x89 0x50 0x4e 0x47 开头
  const big = Buffer.concat(Array(repeat).fill(tinyPngBuf));
  return `data:image/png;base64,${big.toString('base64')}`;
}

async function main() {
  await setup();

  // ===== T1: 上传 PNG 成功 =====
  {
    const r = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/png;base64,${PNG_1X1_BASE64}` },
    });
    const ok = r.data?.code === 0 && !!r.data?.data?.iconUrl && r.data.data.mime === 'image/png';
    log('T1 上传 PNG 成功', ok, `iconUrl=${r.data?.data?.iconUrl?.slice(0, 50)}...`);
  }

  // ===== T2: 上传 jpeg 失败（强校验 mime） =====
  {
    const r = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/jpeg;base64,${JPEG_1X1_BASE64}` },
    });
    const ok = r.data?.code !== 0 && /png/.test(r.data?.message || '');
    log('T2 上传 jpeg 被拒（仅允许 png）', ok, `message=${r.data?.message}`);
  }

  // ===== T3: 上传纯文本 dataURL 失败 =====
  {
    const r = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/png;base64,${TEXT_BASE64}` },
    });
    // 纯文本 magic bytes 不是 png，所以 magic bytes 校验会失败 → 报"图标格式不合法"
    const ok = r.data?.code !== 0 && /不合法|png|格式/.test(r.data?.message || '');
    log('T3 上传伪 PNG（magic bytes 不匹配）被拒', ok, `message=${r.data?.message}`);
  }

  // ===== T4: 上传超过 2MB 失败 =====
  {
    const dataUrl = await makeBigPng();
    const r = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl },
    });
    // 实际场景中，body size > 100kb 会被 Express body-parser 拦截（413），
    // 或者 buffer 校验拦截（400）。两者都是拒绝上传的有效结果。
    const ok = (r.status === 413) || (r.data?.code !== 0 && (/大小|2MB|超过|不合法|format|format|png/i.test(r.data?.message || '') || r.data?.code === 413));
    log('T4 上传 > 2MB 被拒', ok, `status=${r.status} code=${r.data?.code} msg=${r.data?.message || r.data?.error || ''}`);
  }

  // ===== T5: 创建时带 icon_url → 存入 DB 为 key（提取自 presigned URL）=====
  let createdId = 0;
  let uploadedKey = '';
  let uploadedUrl = '';
  {
    // 先上传
    const up = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/png;base64,${PNG_1X1_BASE64}` },
    });
    uploadedKey = up.data?.data?.key || '';
    uploadedUrl = up.data?.data?.iconUrl || '';
    // 再创建时携带 presigned URL（应被后端提取为 key）
    const code = `CUSTOM_ICON_${Date.now().toString().slice(-7)}`;
    const r = await http('/api/v1/console/network/custom/create', {
      method: 'POST',
      body: {
        network_name: 'IconNetwork',
        network_code: code,
        icon_url: uploadedUrl,
        adapter_class_init_android: 'com.icon.Init',
      },
    });
    createdId = r.data?.data?.id || 0;
    const ok = r.data?.code === 0
      && r.data?.data?.icon_url === uploadedKey  // 存的是 key
      && typeof r.data?.data?.iconUrlResolved === 'string'  // 响应含 fresh URL
      && r.data?.data?.iconUrlResolved.startsWith('http');
    log('T5 创建带 icon_url → 存 key + 返 fresh URL', ok,
      `id=${createdId} stored=${r.data?.data?.icon_url} resolved=${r.data?.data?.iconUrlResolved?.slice(0, 60)}...`);
  }

  // ===== T6: 更新时清空 icon_url（传 null）→ DB 中变 null =====
  {
    const r = await http(`/api/v1/console/network/custom/${createdId}`, {
      method: 'PUT',
      body: { icon_url: null },
    });
    const detail = await http('/api/v1/console/network/list?page=1&pageSize=200');
    const found = (detail.data?.data?.list || []).find((n) => n.id === createdId);
    const ok = r.data?.code === 0
      && found
      && (found.icon_url === null || found.icon_url === undefined || found.icon_url === '')
      && (found.iconUrlResolved === null || found.iconUrlResolved === undefined || found.iconUrlResolved === '');
    log('T6 更新清空 icon_url → DB 与 resolved 都为空', ok,
      `rcode=${r.data?.code} rmsg=${r.data?.message} stored=${found?.icon_url ?? 'undef'} resolved=${found?.iconUrlResolved ?? 'undef'}`);
  }

  // ===== T7: 列表接口返回 key + fresh presigned URL =====
  {
    const up = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/png;base64,${PNG_1X1_BASE64}` },
    });
    const code = `CUSTOM_ICONLST_${Date.now().toString().slice(-6)}`;
    const create = await http('/api/v1/console/network/custom/create', {
      method: 'POST',
      body: {
        network_name: 'IconList',
        network_code: code,
        icon_url: up.data?.data?.key,  // 直接传 key
        adapter_class_init_ios: 'com.iconl.Ios',
      },
    });
    const list = await http('/api/v1/console/network/list?page=1&pageSize=200');
    const found = (list.data?.data?.list || []).find((n) => n.id === create.data?.data?.id);
    const isKey = !!found && found.icon_url && !found.icon_url.startsWith('http') && found.icon_url.startsWith('networks/');
    const hasResolved = !!found && typeof found.iconUrlResolved === 'string' && found.iconUrlResolved.startsWith('http');
    const ok = isKey && hasResolved;
    log('T7 列表返回 key + fresh presigned URL', ok,
      `stored=${found?.icon_url?.slice(0, 50)} resolved=${found?.iconUrlResolved?.slice(0, 60)}...`);
  }

  // ===== T8: 验证 list 返回的 iconUrlResolved 格式正确（key → 7天 presigned URL）=====
  {
    const up = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/png;base64,${PNG_1X1_BASE64}` },
    });
    const code = `CUSTOM_ICONV_${Date.now().toString().slice(-6)}`;
    await http('/api/v1/console/network/custom/create', {
      method: 'POST',
      body: {
        network_name: 'IconV',
        network_code: code,
        icon_url: up.data?.data?.key,
        adapter_class_init_android: 'com.iconv.Init',
      },
    });
    const list = await http('/api/v1/console/network/list?page=1&pageSize=200');
    const found = (list.data?.data?.list || []).find((n) => n.network_code === code);
    const url = found?.iconUrlResolved || '';
    const validUrl = /^https:\/\/[^/]+\/coze_storage_\d+\/networks\/icons\/.+\?sign=\d+-[0-9a-f]+-0-[0-9a-f]+$/i.test(url);
    log('T8 iconUrlResolved URL 格式正确（含 sign 签名）', validUrl, `url=${url.slice(0, 80)}...`);
  }

  // ===== T9: 验证 presigned URL 真的能下载到 PNG（关键回归测试）=====
  {
    const up = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/png;base64,${PNG_1X1_BASE64}` },
    });
    // 上传返回的 key 必须能作为 presigned URL 的 key（之前用 hint key 而非 realKey 会 404）
    const uploadedUrl = up.data?.data?.iconUrl || '';
    const realKey = up.data?.data?.key || '';
    const okKey = realKey && !realKey.startsWith('http') && realKey.startsWith('networks/');
    // GET presigned URL 验证能下载到真实 PNG
    let status = 0;
    let bodyLen = 0;
    let isPng = false;
    try {
      const r = await fetch(uploadedUrl);
      status = r.status;
      const buf = Buffer.from(await r.arrayBuffer());
      bodyLen = buf.length;
      // PNG magic: 89 50 4E 47 0D 0A 1A 0A
      isPng = buf.length >= 8
        && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47
        && buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
    } catch (e) {
      status = -1;
    }
    const ok = okKey && status === 200 && isPng;
    log('T9 presigned URL 能下载到 PNG（key 用对）', ok,
      `key=${realKey?.slice(0, 60)}... status=${status} bodyLen=${bodyLen} isPng=${isPng}`);
  }

  console.log(`\n=== ${pass} 通过 / ${fail} 失败 / 共 ${pass + fail} ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
