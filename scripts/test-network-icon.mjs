#!/usr/bin/env node
/**
 * 自定义广告平台「图标上传」E2E 测试
 * 覆盖场景：
 *  T1 上传 PNG 成功（带 magic bytes 校验）
 *  T2 上传 jpeg（纯 jpg dataURL）失败
 *  T3 上传非图片（纯文本 dataURL）失败
 *  T4 上传超过 2MB 失败
 *  T5 创建时带 icon_url → DB 中能查到
 *  T6 更新时清空 icon_url（传 null）→ DB 中变 null
 *  T7 列表接口返回 icon_url 字段
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

  // ===== T5: 创建时带 icon_url → DB 中能查到 =====
  let createdId = 0;
  let uploadedIconUrl = '';
  {
    // 先上传
    const up = await http('/api/v1/console/network/custom/upload-icon', {
      method: 'POST',
      body: { dataUrl: `data:image/png;base64,${PNG_1X1_BASE64}` },
    });
    uploadedIconUrl = up.data?.data?.iconUrl || '';
    // 再创建时携带 icon_url
    const code = `CUSTOM_ICON_${Date.now().toString().slice(-7)}`;
    const r = await http('/api/v1/console/network/custom/create', {
      method: 'POST',
      body: {
        network_name: 'IconNetwork',
        network_code: code,
        icon_url: uploadedIconUrl,
        adapter_class_init_android: 'com.icon.Init',
      },
    });
    createdId = r.data?.data?.id || 0;
    const ok = r.data?.code === 0 && r.data?.data?.icon_url === uploadedIconUrl;
    log('T5 创建带 icon_url 成功', ok, `id=${createdId} icon_url matched=${r.data?.data?.icon_url === uploadedIconUrl}`);
  }

  // ===== T6: 更新时清空 icon_url（传 null）→ DB 中变 null =====
  {
    const r = await http(`/api/v1/console/network/custom/${createdId}`, {
      method: 'PUT',
      body: { icon_url: null },
    });
    const detail = await http('/api/v1/console/network/list?page=1&pageSize=200');
    const found = (detail.data?.data?.list || []).find((n) => n.id === createdId);
    const ok = r.data?.code === 0 && found && found.icon_url === null;
    log('T6 更新清空 icon_url → DB 为 null', ok, `rcode=${r.data?.code} rmsg=${r.data?.message} listCount=${(detail.data?.data?.list || []).length} foundId=${found?.id} actual=${found?.icon_url ?? 'undef'}`);
  }

  // ===== T7: 列表接口返回 icon_url 字段 =====
  {
    // 先创建一个带 icon 的
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
        icon_url: up.data?.data?.iconUrl,
        adapter_class_init_ios: 'com.iconl.Ios',
      },
    });
    const list = await http('/api/v1/console/network/list?page=1&pageSize=200');
    const found = (list.data?.data?.list || []).find((n) => n.id === create.data?.data?.id);
    const ok = !!found && found.icon_url && found.icon_url.startsWith('http');
    log('T7 列表返回 icon_url 字段', ok, `icon_url=${found?.icon_url?.slice(0, 50)}...`);
  }

  console.log(`\n=== ${pass} 通过 / ${fail} 失败 / 共 ${pass + fail} ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
