/**
 * SDK 管理模块数据 seed
 *
 * - Android 最新版: 6.0.9
 * - iOS 最新版: 1.1.0
 * - 历史版本: 4-5 个 Android, 3-4 个 iOS
 * - 5 个文档分类 + 7 篇文档
 * - 2 个隐私政策版本
 *
 * 用法: npx tsx server/seed-sdk.ts
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, getSupabaseServiceRoleKey } from './utils/supabase-client';

loadEnv();

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || getSupabaseServiceRoleKey() || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ COZE_SUPABASE_URL 或 COZE_SUPABASE_SERVICE_ROLE_KEY 未配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// 1. SDK 版本
// ============================================================
const sdkReleases = [
  // Android 最新
  {
    platform: 1,
    version: '6.0.9',
    version_code: 609,
    changelog: `## v6.0.9 (2026-07-30)

### 🎉 新功能
- 新增激励视频服务端回调校验
- 支持 CSP 策略合规配置
- 接入广告位频次配置（与控制台同步）

### 🐛 Bug 修复
- 修复在低端机型上初始化偶发 ANR
- 修复激励视频 skip 后 reward 回调错误
- 修复多窗口 Activity 切前后台导致 impression 重复上报

### ⚡ 性能优化
- SDK 体积减少 1.2 MB（从 4.8 MB 降至 3.6 MB）
- 启动耗时降低 18%（从 280ms 降至 230ms）
- 网络请求合并优化`,
    download_url: 'https://oss.demo.com/sdk/android/ytads-android-6.0.9.aar',
    file_size: 3774873,
    file_md5: 'a1b2c3d4e5f6789012345678901234ab',
    sdk_min_version: '5.0.0',
    min_os_version: 'Android 5.0 (API 21)',
    release_type: 1,
    status: 1,
    is_latest: true,
    is_force_update: false,
    release_date: '2026-07-30T10:00:00Z',
  },
  // Android 历史
  {
    platform: 1,
    version: '6.0.8',
    version_code: 608,
    changelog: `## v6.0.8 (2026-07-15)

### 🐛 Bug 修复
- 修复 Banner 在 RecyclerView 中错位问题
- 修复广告位禁用后 SDK 仍请求的问题`,
    download_url: 'https://oss.demo.com/sdk/android/ytads-android-6.0.8.aar',
    file_size: 3891200,
    file_md5: 'b2c3d4e5f6789012345678901234abcd',
    sdk_min_version: '5.0.0',
    min_os_version: 'Android 5.0 (API 21)',
    release_type: 1,
    status: 1,
    is_latest: false,
    is_force_update: false,
    release_date: '2026-07-15T10:00:00Z',
  },
  {
    platform: 1,
    version: '6.0.7',
    version_code: 607,
    changelog: `## v6.0.7 (2026-06-30)

### 🐛 Bug 修复
- 修复 GDPR 同意弹窗闪退
- 修复 Bidding 模式下某广告源重复曝光`,
    download_url: 'https://oss.demo.com/sdk/android/ytads-android-6.0.7.aar',
    file_size: 3900000,
    file_md5: 'c3d4e5f6789012345678901234abcdef',
    sdk_min_version: '5.0.0',
    min_os_version: 'Android 5.0 (API 21)',
    release_type: 1,
    status: 1,
    is_latest: false,
    is_force_update: false,
    release_date: '2026-06-30T10:00:00Z',
  },
  {
    platform: 1,
    version: '6.0.6',
    version_code: 606,
    changelog: `## v6.0.6 (2026-06-15)

### ⚡ 性能优化
- 启动耗时降低 12%
- 内存峰值降低 8%

### 🐛 Bug 修复
- 修复激励视频 skip 后无回调`,
    download_url: 'https://oss.demo.com/sdk/android/ytads-android-6.0.6.aar',
    file_size: 4050000,
    file_md5: 'd4e5f678901234567890123abcdef12',
    sdk_min_version: '5.0.0',
    min_os_version: 'Android 5.0 (API 21)',
    release_type: 1,
    status: 1,
    is_latest: false,
    is_force_update: false,
    release_date: '2026-06-15T10:00:00Z',
  },
  {
    platform: 1,
    version: '6.0.0',
    version_code: 600,
    changelog: `## v6.0.0 (2026-05-01)

### 🎉 重大升级
- 全新架构（迁移到 Kotlin 协程）
- 全面支持服务端 Bidding
- 广告位维度频次控制
- 性能提升 30%`,
    download_url: 'https://oss.demo.com/sdk/android/ytads-android-6.0.0.aar',
    file_size: 4200000,
    file_md5: 'e5f678901234567890123abcdef1234',
    sdk_min_version: '4.0.0',
    min_os_version: 'Android 5.0 (API 21)',
    release_type: 1,
    status: 1,
    is_latest: false,
    is_force_update: true,
    release_date: '2026-05-01T10:00:00Z',
  },
  {
    platform: 1,
    version: '5.5.2',
    version_code: 552,
    changelog: `## v5.5.2 (2026-03-15)

### 🐛 Bug 修复
- 修复 Native 广告模板在折叠屏设备错位`,
    download_url: 'https://oss.demo.com/sdk/android/ytads-android-5.5.2.aar',
    file_size: 4500000,
    file_md5: 'f678901234567890123abcdef123456',
    sdk_min_version: '4.0.0',
    min_os_version: 'Android 5.0 (API 21)',
    release_type: 3,
    status: 1,
    is_latest: false,
    is_force_update: false,
    release_date: '2026-03-15T10:00:00Z',
  },

  // iOS 最新
  {
    platform: 2,
    version: '1.1.0',
    version_code: 110,
    changelog: `## v1.1.0 (2026-07-30)

### 🎉 新功能
- 新增 Swift 6 全量支持
- 新增激励视频服务端回调校验
- 支持 SKAdNetwork 4.0
- 接入广告位频次配置（与控制台同步）

### 🐛 Bug 修复
- 修复在 iPad Pro 上 Banner 适配问题
- 修复应用进入后台再返回时广告位状态错乱
- 修复 iOS 17 Privacy Manifest 报错

### ⚡ 性能优化
- 启动耗时降低 22%（从 320ms 降至 250ms）
- 内存占用降低 15%
- 网络请求合并优化`,
    download_url: 'https://oss.demo.com/sdk/ios/YTads-iOS-1.1.0.zip',
    file_size: 5234567,
    file_md5: '678901234567890123abcdef12345678',
    sdk_min_version: '1.0.0',
    min_os_version: 'iOS 11.0',
    release_type: 1,
    status: 1,
    is_latest: true,
    is_force_update: false,
    release_date: '2026-07-30T10:00:00Z',
  },
  // iOS 历史
  {
    platform: 2,
    version: '1.0.5',
    version_code: 105,
    changelog: `## v1.0.5 (2026-07-10)

### 🐛 Bug 修复
- 修复激励视频 skip 后无回调
- 修复 ATT 弹窗兼容性`,
    download_url: 'https://oss.demo.com/sdk/ios/YTads-iOS-1.0.5.zip',
    file_size: 5400000,
    file_md5: '78901234567890123abcdef1234567890',
    sdk_min_version: '1.0.0',
    min_os_version: 'iOS 11.0',
    release_type: 1,
    status: 1,
    is_latest: false,
    is_force_update: false,
    release_date: '2026-07-10T10:00:00Z',
  },
  {
    platform: 2,
    version: '1.0.4',
    version_code: 104,
    changelog: `## v1.0.4 (2026-06-20)

### ⚡ 性能优化
- 启动耗时降低 8%

### 🐛 Bug 修复
- 修复 iOS 16 锁屏后 SDK 无法上报`,
    download_url: 'https://oss.demo.com/sdk/ios/YTads-iOS-1.0.4.zip',
    file_size: 5500000,
    file_md5: '8901234567890123abcdef123456789a',
    sdk_min_version: '1.0.0',
    min_os_version: 'iOS 11.0',
    release_type: 1,
    status: 1,
    is_latest: false,
    is_force_update: false,
    release_date: '2026-06-20T10:00:00Z',
  },
  {
    platform: 2,
    version: '1.0.0',
    version_code: 100,
    changelog: `## v1.0.0 (2026-05-01)

### 🎉 首次发布
- 全面支持 Obj-C 与 Swift
- 5 种广告形式（Banner / Interstitial / Native / Rewarded / Splash）
- 服务端 Bidding
- 频次控制
- COPPA / CCPA 合规支持`,
    download_url: 'https://oss.demo.com/sdk/ios/YTads-iOS-1.0.0.zip',
    file_size: 5800000,
    file_md5: '901234567890123abcdef123456789ab',
    sdk_min_version: '—',
    min_os_version: 'iOS 11.0',
    release_type: 1,
    status: 1,
    is_latest: false,
    is_force_update: true,
    release_date: '2026-05-01T10:00:00Z',
  },
  {
    platform: 2,
    version: '0.9.0',
    version_code: 90,
    changelog: `## v0.9.0 (2026-03-15) - Beta

- 内测版本，仅供合作方使用`,
    download_url: 'https://oss.demo.com/sdk/ios/YTads-iOS-0.9.0-beta.zip',
    file_size: 6000000,
    file_md5: '01234567890123abcdef123456789abc',
    sdk_min_version: '—',
    min_os_version: 'iOS 11.0',
    release_type: 2,
    status: 1,
    is_latest: false,
    is_force_update: false,
    release_date: '2026-03-15T10:00:00Z',
  },
];

// ============================================================
// 2. 文档分类
// ============================================================
const docCategories = [
  { name: '快速开始', code: 'quick-start', description: '10 分钟集成 SDK', icon: 'Promotion', sort_order: 10 },
  { name: '集成指南', code: 'integration', description: '各广告形式接入文档', icon: 'Connection', sort_order: 20 },
  { name: 'API 参考', code: 'api', description: 'API 详细参数与返回值', icon: 'Document', sort_order: 30 },
  { name: '常见问题', code: 'faq', description: 'FAQ 与排查指南', icon: 'QuestionFilled', sort_order: 40 },
  { name: '发布记录', code: 'release-notes', description: '版本更新与升级指南', icon: 'Calendar', sort_order: 50 },
];

// ============================================================
// 3. 文档内容
// ============================================================
const docsData = [
  {
    category_code: 'quick-start',
    title: 'Android 快速集成',
    content_format: 2,
    content: `# Android 快速集成

## 1. 添加 Maven 仓库

在项目根目录的 \`build.gradle\` 中：

\`\`\`gradle
allprojects {
    repositories {
        maven { url 'https://maven.ytads.com/repository/android-releases/' }
    }
}
\`\`\`

## 2. 添加依赖

在 app 模块的 \`build.gradle\` 中：

\`\`\`gradle
dependencies {
    implementation 'com.ytads:sdk:6.0.9'
}
\`\`\`

## 3. 配置 AndroidManifest.xml

\`\`\`xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<application>
    <meta-data
        android:name="YTADS_APP_KEY"
        android:value="your_app_key_here" />
</application>
\`\`\`

## 4. 初始化 SDK

\`\`\`java
public class MyApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        YTadsSDK.init(this, "your_app_key");
    }
}
\`\`\`

## 5. 展示 Banner 广告

\`\`\`java
YTAdView adView = findViewById(R.id.ad_view);
YTAdRequest request = new YTAdRequest.Builder()
    .setPlacementId("your_placement_id")
    .build();
adView.loadAd(request);
\`\`\`

完成！SDK 已成功集成。`,
    excerpt: '10 分钟快速集成 Android SDK，含 Maven 配置、权限、初始化、广告展示',
    sort_order: 10,
    is_featured: true,
  },
  {
    category_code: 'quick-start',
    title: 'iOS 快速集成',
    content_format: 2,
    content: `# iOS 快速集成

## 1. 添加 Pod

\`\`\`ruby
platform :ios, '11.0'
use_frameworks!

target 'YourApp' do
  pod 'YTadsSDK', '~> 1.1.0'
end
\`\`\`

## 2. 配置 Info.plist

\`\`\`xml
<key>YTADS_APP_KEY</key>
<string>your_app_key_here</string>
<key>NSUserTrackingUsageDescription</key>
<string>用于优化广告体验</string>
\`\`\`

## 3. 初始化 SDK

\`\`\`swift
import YTadsSDK

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        YTadsSDK.shared.init(appKey: "your_app_key")
        return true
    }
}
\`\`\`

## 4. 展示 Banner

\`\`\`swift
let adView = YTAdView(placementId: "your_placement_id")
adView.loadAd()
\`\`\`

完成！`,
    excerpt: '10 分钟快速集成 iOS SDK，含 Pod、Info.plist、初始化、Banner',
    sort_order: 20,
    is_featured: true,
  },
  {
    category_code: 'integration',
    title: 'Banner（横幅）广告接入',
    content_format: 2,
    content: `# Banner（横幅）广告

## 概述

Banner 是最常见的展示型广告，常用于页面底部或中部。

## 标准尺寸

| 尺寸 | 用途 |
|------|------|
| 320×50 | 手机标准横幅 |
| 728×90 | 平板/桌面横幅 |
| 300×250 | 中矩形 |

## Android

\`\`\`java
YTAdView adView = new YTAdView(this);
adView.setAdSize(YTAdSize.BANNER_320_50);
adView.setPlacementId("your_placement_id");
LinearLayout container = findViewById(R.id.banner_container);
container.addView(adView);
adView.loadAd();
\`\`\`

## iOS

\`\`\`swift
let adView = YTAdView(adSize: .banner320x50, placementId: "your_placement_id")
adView.loadAd()
view.addSubview(adView)
\`\`\`

## 监听事件

- onAdLoaded
- onAdFailedToLoad
- onAdClicked
- onAdImpression

详细 API 见 [API 参考](/docs/api)。`,
    excerpt: 'Banner 横幅广告标准尺寸、Android/iOS 代码示例、事件回调',
    sort_order: 10,
  },
  {
    category_code: 'integration',
    title: '激励视频（Rewarded）广告接入',
    content_format: 2,
    content: `# 激励视频广告

## 概述

用户观看完整视频后可获得应用内奖励（复活、加金币等）。

## 最佳实践

1. **明确奖励**：观看前提示用户「看完可获得 XX」
2. **提供跳过入口**：右上角 5s 后出现跳过按钮
3. **服务端校验**：重要奖励（如复活）必须服务端二次校验
4. **避免强制**：用户拒绝观看应正常进行游戏流程

## Android

\`\`\`java
YTRewardedAd.load("your_placement_id", new YTRewardedAdLoadCallback() {
    @Override
    public void onAdLoaded(YTRewardedAd ad) {
        rewardedAd = ad;
    }
});

rewardedAd.show(activity, new YTRewardedAdCallback() {
    @Override
    public void onUserEarnedReward(RewardItem reward) {
        // 给用户奖励
        String sku = reward.getSku();
        int amount = reward.getAmount();
    }
});
\`\`\`

## 服务端校验

回调通知到你的服务器，包含：
- \`user_id\`
- \`placement_id\`
- \`reward_sku\`
- \`reward_amount\`
- \`timestamp\`
- \`signature\`

校验后通过 API 确认发放。`,
    excerpt: '激励视频接入、最佳实践、用户奖励机制、服务端校验',
    sort_order: 20,
  },
  {
    category_code: 'api',
    title: 'YTAdRequest 参数说明',
    content_format: 2,
    content: `# YTAdRequest 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| placementId | String | ✅ | 广告位 ID |
| adSize | YTAdSize | ❌ | 广告尺寸（Banner 必填） |
| keywords | String[] | ❌ | 关键词定向 |
| userId | String | ❌ | 用户标识 |
| customParams | Map | ❌ | 自定义参数（透传给广告源）|

## 示例

\`\`\`java
YTAdRequest request = new YTAdRequest.Builder()
    .setPlacementId("pl_abc123")
    .setAdSize(YTAdSize.BANNER_320_50)
    .setKeywords(new String[]{"游戏", "二次元"})
    .setUserId("user_001")
    .setCustomParam("level", "10")
    .build();
\`\`\`

## 自定义参数

\`customParams\` 会透传给所有广告源（穿山甲、优量汇等），用于：
- 高级定向
- A/B 实验
- 自定义服务端回调`,
    excerpt: '广告请求参数完整说明：placementId / adSize / keywords / userId / customParams',
    sort_order: 10,
  },
  {
    category_code: 'faq',
    title: 'SDK 集成常见问题',
    content_format: 2,
    content: `# 常见问题

## Q1. SDK 初始化失败

**现象**：调用 \`YTadsSDK.init()\` 后无回调，广告无法展示。

**排查**：
1. 检查 appKey 是否正确（控制台 → 应用详情）
2. 检查网络权限是否声明
3. 检查 ProGuard 配置
4. 确认 SDK 版本 ≥ 最低集成版本

## Q2. 广告位一直 no fill

**原因**：
- 该广告位未配置广告源
- 流量分组未匹配
- 当前地域/设备无合适广告

**排查**：
1. 控制台 → 瀑布流 → 确认有广告源
2. 检查流量分组规则是否过严
3. 等待 5 分钟（瀑布流缓存）

## Q3. iOS 启动偶发崩溃

**现象**：iOS 17 设备偶发崩溃。

**解决**：升级至 SDK 1.1.0+（已修复 iOS 17 Privacy Manifest 报错）

## Q4. 激励视频回调不触发

**可能原因**：
- 用户在 5s 前关闭视频
- 网络问题
- 服务端校验未通过

**排查**：开启 debug 模式查看日志。`,
    excerpt: 'SDK 集成、广告位、激励视频等常见问题排查',
    sort_order: 10,
  },
  {
    category_code: 'release-notes',
    title: 'Android v6.0.0 → v6.0.9 升级指南',
    content_format: 2,
    content: `# Android 升级指南：v6.0.0 → v6.0.9

## 必读

v6.0.0 是**重大架构升级**（Kotlin 协程化），从 v5.x 升级请参考迁移指南。

## 升级步骤

### 1. 修改版本号

\`\`\`gradle
dependencies {
    implementation 'com.ytads:sdk:6.0.9'  // 从 5.5.2 改到 6.0.9
}
\`\`\`

### 2. 替换废弃 API

| 废弃 (5.x) | 新 (6.x) |
|-----------|----------|
| \`YTAdView.loadAd(req, listener)\` | \`YTAdView.loadAd(req, callback)\` |
| \`YTadsSDK.setLogLevel(LEVEL)\` | \`YTadsSDK.logLevel = LEVEL\` |
| \`YTSdkConfig.Builder()\` | \`YTSdkConfig()\` (Data Class) |

### 3. 检查 ProGuard

添加：
\`\`\`
-keep class com.ytads.** { *; }
-keep class com.bytedance.** { *; }  // 穿山甲
-keep class com.qq.e.** { *; }       // 优量汇
\`\`\`

## 强制升级检查

控制台已开启 \`is_force_update=true\`，客户端必须在 30 天内升级到 v6.0.0+。`,
    excerpt: 'Android v6.0.0 → v6.0.9 重大升级指南：版本号、API 替换、ProGuard 配置',
    sort_order: 10,
    is_featured: true,
  },
];

// ============================================================
// 4. 隐私政策
// ============================================================
const privacyPolicies = [
  {
    version: '1.1',
    platform: null,
    title: '新义 隐私政策 v1.1',
    content_format: 2,
    content: `# 新义 隐私政策

**最后更新：2026 年 7 月 30 日**

新义 聚合广告 SDK 严格遵守《中华人民共和国个人信息保护法》、《App 违法违规收集使用个人信息行为认定方法》、GDPR、CCPA 等法律法规，制定本隐私政策。

## 一、我们收集的信息

### 1.1 设备信息
- 设备型号、操作系统版本、设备标识符（IDFA / OAID）
- 屏幕尺寸、屏幕方向、设备语言
- 设备制造商、品牌

### 1.2 应用信息
- 应用包名、版本号
- 应用渠道、构建号

### 1.3 广告相关信息
- 广告位 ID、请求时间、曝光时间、点击时间
- 广告素材 ID、素材类型

### 1.4 位置信息（可选）
- 仅在您明确授权后收集
- 可随时在系统设置中关闭

## 二、信息使用方式

1. **广告投放与优化**：基于设备信息和用户偏好展示相关广告
2. **反作弊**：识别异常流量，防御恶意刷量
3. **效果归因**：衡量广告投放效果
4. **合规审计**：响应监管要求

## 三、信息共享

我们**不会**出售您的个人信息。

仅在以下情况下共享：
- 与合作广告主（穿山甲、优量汇等）共享必要信息
- 法律法规要求（如监管部门要求）
- 您明确同意的其他情况

## 四、您的权利

- **访问权**：查看我们收集的您的信息
- **更正权**：更正不准确的信息
- **删除权**：请求删除您的信息
- **撤回同意**：随时撤回授权

可通过 \`support@ytads.com\` 联系我们行使上述权利。

## 五、未成年人保护

我们不会故意收集 14 周岁以下儿童的个人信息。

应用集成方应在 SDK 初始化前判断用户年龄，并对未成年人关闭定向广告。

## 六、政策变更

本政策可能不定期更新。重大变更会通过站内信通知开发者。`,
    summary: 'v1.1 主要更新：增加 iOS Privacy Manifest 说明；细化 CCPA 章节；补充用户权利行使方式。',
    effective_date: '2026-07-30',
    status: 1,
  },
  {
    version: '1.0',
    platform: null,
    title: '新义 隐私政策 v1.0',
    content_format: 2,
    content: `# 新义 隐私政策 v1.0

**生效日期：2026 年 5 月 1 日**

（首次发布，内容同 v1.1 的初始版本）`,
    summary: 'v1.0 首次发布隐私政策。',
    effective_date: '2026-05-01',
    status: 2,
  },
];

// ============================================================
// 5. 执行
// ============================================================
async function seed() {
  console.log('🚀 开始 seed SDK 模块...');

  // 1. SDK 版本
  console.log('\n📦 1) sdk_release');
  // 先清空旧数据
  await supabase.from('sdk_release').delete().neq('id', 0);
  const { data: releaseData, error: releaseErr } = await supabase
    .from('sdk_release')
    .insert(sdkReleases)
    .select();
  if (releaseErr) throw new Error(`sdk_release insert: ${releaseErr.message}`);
  console.log(`  ✅ 写入 ${releaseData.length} 条 SDK 版本`);

  // 2. 文档分类
  console.log('\n📂 2) sdk_doc_category');
  await supabase.from('sdk_doc_category').delete().neq('id', 0);
  const { data: catData, error: catErr } = await supabase
    .from('sdk_doc_category')
    .insert(docCategories)
    .select();
  if (catErr) throw new Error(`sdk_doc_category insert: ${catErr.message}`);
  console.log(`  ✅ 写入 ${catData.length} 个分类`);

  // 3. 文档
  console.log('\n📄 3) sdk_doc');
  await supabase.from('sdk_doc').delete().neq('id', 0);
  const docs = docsData.map((d) => {
    const cat = catData.find((c) => c.code === d.category_code);
    if (!cat) throw new Error(`category not found: ${d.category_code}`);
    return {
      category_id: cat.id,
      title: d.title,
      content_format: d.content_format,
      content: d.content,
      excerpt: d.excerpt,
      sort_order: d.sort_order,
      is_published: true,
      is_featured: d.is_featured || false,
      published_at: new Date().toISOString(),
      author_id: 'system',
    };
  });
  const { data: docData, error: docErr } = await supabase
    .from('sdk_doc')
    .insert(docs)
    .select();
  if (docErr) throw new Error(`sdk_doc insert: ${docErr.message}`);
  console.log(`  ✅ 写入 ${docData.length} 篇文档`);

  // 4. 隐私政策
  console.log('\n📜 4) sdk_privacy_policy');
  await supabase.from('sdk_privacy_policy').delete().neq('id', 0);
  const { data: privacyData, error: privacyErr } = await supabase
    .from('sdk_privacy_policy')
    .insert(privacyPolicies)
    .select();
  if (privacyErr) throw new Error(`sdk_privacy_policy insert: ${privacyErr.message}`);
  console.log(`  ✅ 写入 ${privacyData.length} 个隐私政策`);

  console.log('\n🎉 SDK 模块 seed 完成！\n');
  console.log('📊 数据汇总：');
  console.log(`  - SDK 版本: ${releaseData.length} 个（Android 最新 6.0.9 / iOS 最新 1.1.0）`);
  console.log(`  - 文档分类: ${catData.length} 个`);
  console.log(`  - 文档: ${docData.length} 篇`);
  console.log(`  - 隐私政策: ${privacyData.length} 个`);
}

seed().catch((e) => {
  console.error('❌ seed 失败:', e);
  process.exit(1);
});
