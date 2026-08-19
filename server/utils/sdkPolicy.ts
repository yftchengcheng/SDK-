/**
 * SDK 预置策略打包工具（单文件 JSON 输出）
 * 不依赖 archiver / jszip / 对象存储，直接返回 application/json
 */

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

export interface BuildJsonInput {
  sdkVersion: string;
  effectVersion: string;
  generatedAt: string;
  developerId: string;
  appPolicies: AppPolicyFile[];
}

export interface ManifestJson {
  manifest: {
    sdkVersion: string;
    effectVersion: string;
    generatedAt: string;
    developerId: string;
    appCount: number;
    placementCount: number;
  };
  apps: AppPolicyFile[];
}

/**
 * 简单 semver 比较：a >= b
 * 接受 1.0.0 / 6.4.58 形式
 */
export const SDK_VERSION_MIN = '6.0.0';

export function semverGte(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return true;
}

/**
 * 构造 SDK 预置策略 JSON（单文件，不分目录、不分文件）
 * 前端拿到后保存为 .json 文件
 */
export function buildSdkPolicyJsonBuffer(input: BuildJsonInput): Buffer {
  const placementCount = input.appPolicies.reduce(
    (sum, app) => sum + app.placements.length,
    0,
  );
  const payload: ManifestJson = {
    manifest: {
      sdkVersion: input.sdkVersion,
      effectVersion: input.effectVersion,
      generatedAt: input.generatedAt,
      developerId: input.developerId,
      appCount: input.appPolicies.length,
      placementCount,
    },
    apps: input.appPolicies,
  };
  const jsonString = JSON.stringify(payload, null, 2);
  return Buffer.from(jsonString, 'utf-8');
}
