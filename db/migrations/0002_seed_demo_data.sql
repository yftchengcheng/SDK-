-- =====================================================================
-- 0002_seed_demo_data.sql
-- 演示数据: 注册一个 demo 开发者 + 配套数据, 方便登录后立即看到效果
-- 密码: demo123456 (bcryptjs hash)
-- =====================================================================

-- 清理旧演示数据
DELETE FROM developer WHERE email = 'demo@xinyi.io';

-- 插入演示开发者
INSERT INTO developer (
  developer_id, email, password_hash, company_name, contact_name, phone, status, api_token
) VALUES (
  'dev-demo-001',
  'demo@xinyi.io',
  '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQHLVR0y5T3YQ0bFe5J8YqJyHKfP0m',
  '新义演示科技有限公司',
  '张三',
  '13800138000',
  'active',
  'demo_api_token_xxxxxxxxxxxxx'
);

-- 演示应用
INSERT INTO app (app_id, developer_id, app_key, app_name, package_name, platform, status, description) VALUES
  ('app-demo-001', 'dev-demo-001', 'app_key_demo_001', '新义快讯', 'com.xinyi.kuaixun', 'android', 'active', '新闻资讯类App'),
  ('app-demo-002', 'dev-demo-001', 'app_key_demo_002', '新义天气', 'com.xinyi.weather', 'ios', 'active', '天气工具App');

-- 演示广告位
INSERT INTO placement (placement_id, app_key, name, ad_format, width, height, status) VALUES
  ('plc-demo-001', 'app_key_demo_001', '首页开屏', 'interstitial', 1080, 1920, 'active'),
  ('plc-demo-002', 'app_key_demo_001', '信息流横幅', 'banner', 320, 50, 'active'),
  ('plc-demo-003', 'app_key_demo_001', '视频激励', 'rewarded', 1280, 720, 'active'),
  ('plc-demo-004', 'app_key_demo_002', '启动页', 'interstitial', 750, 1334, 'active');

-- 演示广告源
INSERT INTO ad_source (ad_source_id, developer_id, name, network_code, app_key, status) VALUES
  ('src-001', 'dev-demo-001', 'AdMob 横幅',     'admob',     'ca-app-pub-demo-001', 'active'),
  ('src-002', 'dev-demo-001', 'Facebook 原生',  'facebook',  'fb-app-demo-001',     'active'),
  ('src-003', 'dev-demo-001', 'Mintegral 激励', 'mintegral', 'mtg-app-demo-001',    'active');

-- 演示流量分组
INSERT INTO traffic_group (traffic_group_id, developer_id, placement_id, name, rules, priority, description) VALUES
  ('tg-001', 'dev-demo-001', 'plc-demo-001', '国内高价值用户', '[{"field":"country","op":"in","value":["CN"]},{"field":"platform","op":"eq","value":"android"}]'::jsonb, 100, 'Android + 中国'),
  ('tg-002', 'dev-demo-001', 'plc-demo-001', 'iOS用户',        '[{"field":"platform","op":"eq","value":"ios"}]'::jsonb, 80, 'iOS全量');

-- 演示瀑布流配置
INSERT INTO waterfall_config (config_id, placement_id, traffic_group_id, version, ab_group, status, description) VALUES
  ('wf-001', 'plc-demo-001', 'tg-001', 1, 'A', 'active', '国内Android - A组'),
  ('wf-002', 'plc-demo-001', 'tg-001', 1, 'B', 'active', '国内Android - B组'),
  ('wf-003', 'plc-demo-001', NULL,     1, 'A', 'active', '默认分组 - A组');

-- 演示瀑布流层级
INSERT INTO waterfall_layer (layer_id, config_id, layer_type, ad_source_id, order_num, ecpm, timeout_ms) VALUES
  ('lyr-001', 'wf-001', 'bidding',   'src-001', 1, 25.50, 3000),
  ('lyr-002', 'wf-001', 'standard',  'src-002', 2, 20.00, 5000),
  ('lyr-003', 'wf-001', 'fallback',  'src-003', 3, 10.00, 5000),
  ('lyr-004', 'wf-002', 'bidding',   'src-003', 1, 22.00, 3000),
  ('lyr-005', 'wf-002', 'standard',  'src-001', 2, 18.00, 5000),
  ('lyr-006', 'wf-003', 'bidding',   'src-001', 1, 20.00, 3000),
  ('lyr-007', 'wf-003', 'fallback',  'src-002', 2, 12.00, 5000);

-- 演示日报表(近7天)
INSERT INTO report_daily (report_id, developer_id, app_key, placement_id, ad_source_id, stat_date, request_count, impression_count, click_count, revenue) VALUES
  ('rpt-001', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-001', CURRENT_DATE - 6, 50000, 45000, 1200, 85.50),
  ('rpt-002', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-002', CURRENT_DATE - 6, 50000, 42000, 980,  72.30),
  ('rpt-003', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-001', CURRENT_DATE - 5, 55000, 50000, 1350, 95.20),
  ('rpt-004', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-002', CURRENT_DATE - 5, 55000, 47000, 1100, 80.10),
  ('rpt-005', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-001', CURRENT_DATE - 4, 60000, 55000, 1500, 105.80),
  ('rpt-006', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-002', CURRENT_DATE - 4, 60000, 51000, 1250, 92.50),
  ('rpt-007', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-001', CURRENT_DATE - 3, 62000, 57000, 1580, 110.20),
  ('rpt-008', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-002', CURRENT_DATE - 3, 62000, 53000, 1320, 98.40),
  ('rpt-009', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-001', CURRENT_DATE - 2, 65000, 60000, 1650, 118.30),
  ('rpt-010', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-002', CURRENT_DATE - 2, 65000, 55000, 1380, 105.20),
  ('rpt-011', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-001', CURRENT_DATE - 1, 68000, 62000, 1720, 125.50),
  ('rpt-012', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-002', CURRENT_DATE - 1, 68000, 58000, 1450, 112.80),
  ('rpt-013', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-001', CURRENT_DATE,     70000, 64000, 1780, 132.00),
  ('rpt-014', 'dev-demo-001', 'app_key_demo_001', 'plc-demo-001', 'src-002', CURRENT_DATE,     70000, 60000, 1500, 118.50);

-- 演示消息
INSERT INTO message (message_id, developer_id, category, title, content, is_read) VALUES
  ('msg-001', 'dev-demo-001', 'system', '欢迎使用新义SDK聚合系统', '系统已初始化完成，您可以开始创建应用和广告位。', false),
  ('msg-002', 'dev-demo-001', 'adapter', 'AdMob Adapter v2.0 已上线', '新版本支持激励视频广告，请前往「广告网络」查看。', false),
  ('msg-003', 'dev-demo-001', 'report', '昨日收益突破 230 元', '您的应用昨日实现 230.30 元收益，较前日增长 8.5%。', true);

-- 演示应用-网络关联
INSERT INTO app_network_binding (binding_id, app_key, network_def_id, status) VALUES
  ('bind-001', 'app_key_demo_001', 'net-admob',     'active'),
  ('bind-002', 'app_key_demo_001', 'net-facebook',  'active'),
  ('bind-003', 'app_key_demo_001', 'net-mintegral', 'active'),
  ('bind-004', 'app_key_demo_002', 'net-admob',     'active');

-- 演示自定义网络
INSERT INTO ad_network_def (network_def_id, network_code, network_name, network_type, description, created_by) VALUES
  ('net-custom-001', 'xinyi_market', '新义市场', 'custom', '本公司自营广告网络', 'dev-demo-001');

-- 演示自定义Adapter版本(待审核)
INSERT INTO custom_adapter_version (version_id, network_def_id, version_code, file_name, file_size, file_md5, changelog, status) VALUES
  ('adp-001', 'net-custom-001', 'v1.0.0', 'XinyiAdapter-v1.0.0.jar', 245678, 'a1b2c3d4e5f6g7h8i9j0', '初始版本, 支持Banner和原生广告', 'pending'),
  ('adp-002', 'net-custom-001', 'v1.1.0', 'XinyiAdapter-v1.1.0.jar', 278934, 'b2c3d4e5f6g7h8i9j0k1', '新增激励视频支持, 修复已知Bug', 'approved');

-- =====================================================================
-- 完成
-- =====================================================================
