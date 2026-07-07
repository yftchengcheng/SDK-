-- =====================================================================
-- 0004_placement_enhancement.sql
-- 扩展 placement 表，补全 SDK 对接条件字段
-- =====================================================================
-- 字段说明：
--   bidding_type       竞价类型：1=固价 / 2=竞价
--   screen_orientation 屏幕方向：1=横屏 / 2=竖屏 / 3=横竖兼容
--   ad_size            广告展示大小：1=半屏 / 2=全屏 / 3=优选（仅插屏）
--   material_type      素材形式：1=图片 / 2=视频 / 3=视频+图片
--   video_mute         视频静音：0=否 / 1=是（仅原生 + SDK 接入）
--   auto_play          自动播放：1=总是 / 2=仅WIFI / 3=点击播放（仅原生 + SDK 接入）
--   template_style     模版样式：1~14 枚举（仅原生）
--
-- 适用规则（前端强校验，后端做兜底）：
--   - screen_orientation / video_mute / auto_play 仅在 accessType=SDK 时可填
--   - 屏幕方向字段：广告形式 ∈ {插屏, 原生, 视频} 才出现
--   - 广告展示大小：仅插屏
--   - 素材形式：插屏 / 原生
--   - 视频静音 / 自动播放：仅原生 + SDK
--   - 模版样式：仅原生
-- =====================================================================

ALTER TABLE placement
  ADD COLUMN IF NOT EXISTS bidding_type        SMALLINT,
  ADD COLUMN IF NOT EXISTS screen_orientation  SMALLINT,
  ADD COLUMN IF NOT EXISTS ad_size             SMALLINT,
  ADD COLUMN IF NOT EXISTS material_type       SMALLINT,
  ADD COLUMN IF NOT EXISTS video_mute          SMALLINT,
  ADD COLUMN IF NOT EXISTS auto_play           SMALLINT,
  ADD COLUMN IF NOT EXISTS template_style      SMALLINT;

-- 索引（可选）：按竞价类型做统计分析时常用
CREATE INDEX IF NOT EXISTS idx_placement_bidding ON placement(bidding_type);
CREATE INDEX IF NOT EXISTS idx_placement_orientation ON placement(screen_orientation);
