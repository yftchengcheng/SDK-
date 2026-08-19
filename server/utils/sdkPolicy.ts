/**
 * SDK 预置策略导出 helper
 * - 负责生成聚合策略 zip（每 app 一个 json）
 * - 上传对象存储并返回签名 URL
 */
// archiver 8 是 ESM-only 包（"type": "module"），且 API 变化：
//   - 旧: archiver('zip', options) 或 archiver.create('zip', options)
//   - 新: new ZipArchive(options) 子类（Archiver 基类不会初始化 _format/_module）
// 用 dynamic import 异步加载，返回 ZipArchive 构造函数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let archiverPromise: Promise<any> | null = null;
function loadArchiver(): Promise<any> {
  if (!archiverPromise) {
    archiverPromise = import('archiver').then((m: any) => m.ZipArchive);
  }
  return archiverPromise;
}
import { Writable } from 'node:stream';
import { getStorage } from './storage';

const SDK_VERSION_MIN = '6.4.58';

/** 比对 semver（a >= b？只支持 x.y.z 三段） */
export function semverGte(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return true;
}

export interface AppPolicyFile {
  appKey: string;
  appName: string;
  sdkVersion: string;
  effectVersion: string;
  placements: Array<{
    placementId: string;
    name: string;
    format: number;
    templateStyle: number | null;
    trafficGroupId: string;
    isShared: boolean;
  }>;
}

export interface BuildZipInput {
  developerId: string;
  sdkVersion: string;
  effectVersion: string;
  appPolicies: AppPolicyFile[];
}

/** 把策略内容打包成 zip buffer */
export async function buildSdkPolicyZipBuffer(input: BuildZipInput): Promise<Buffer> {
  // archiver 8 是 ESM-only 类（Archiver），用 new
  const Archiver = await loadArchiver();
  if (!Archiver) {
    throw new Error('archiver 加载失败');
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    // archiver 写入到自定义 writable（收集 chunks）
    const sink = new Writable({
      write(chunk: Buffer, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        cb();
      },
    });
    const archive = new Archiver({ zlib: { level: 9 } });
    archive.on('error', reject);
    archive.pipe(sink);

    // 顶层 manifest.json
    const manifest = {
      sdkVersion: input.sdkVersion,
      effectVersion: input.effectVersion,
      generatedAt: new Date().toISOString(),
      developerId: input.developerId,
      appCount: input.appPolicies.length,
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    // 每个 app 一个 json
    for (const ap of input.appPolicies) {
      const safeName = ap.appName.replace(/[\\/:*?"<>|]/g, '_') || ap.appKey;
      const filename = `${safeName}_sdk_policy_v${input.sdkVersion}.json`;
      archive.append(JSON.stringify(ap, null, 2), { name: `apps/${filename}` });
    }

    archive.finalize().then(
      () => {
        // sink 'finish' 事件
        sink.on('finish', () => resolve(Buffer.concat(chunks)));
      },
      reject,
    );
  });
}

export interface UploadZipResult {
  downloadUrl: string;
  filename: string;
  key: string;
  expiresAt: number;
}

/** 上传 zip 到对象存储，返回 7 天签名 URL */
export async function uploadSdkPolicyZip(
  developerId: string,
  zipBuffer: Buffer,
): Promise<UploadZipResult> {
  const timestamp = Date.now();
  const key = `sdk-policy/${developerId}/${timestamp}.zip`;
  const filename = `sdk_policy_${timestamp}.zip`;
  const actualKey = await getStorage().uploadFile({
    fileContent: zipBuffer,
    fileName: key,
    contentType: 'application/zip',
  });
  const expireTime = 7 * 24 * 3600; // 7 天
  const downloadUrl = await getStorage().generatePresignedUrl({
    key: actualKey,
    expireTime,
  });
  return {
    downloadUrl,
    filename,
    key: actualKey,
    expiresAt: Date.now() + expireTime * 1000,
  };
}

export { SDK_VERSION_MIN };
