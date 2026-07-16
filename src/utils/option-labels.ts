/**
 * 报表筛选器中文标签映射（兼容旧 import path）
 *
 * 新代码请用 '@/shared/enum-labels' 的 getEnumLabel / REPORT_*_LABELS
 * 本文件仅做 re-export，避免破坏旧 import
 */

export {
  REPORT_AD_TYPE_LABELS as FORMAT_LABELS,
  REPORT_OS_LABELS as OS_LABELS,
  REPORT_REGION_LABELS as COUNTRY_LABELS,
  APP_PLATFORM_LABELS as PLATFORM_LABELS,
  getEnumLabel as getOptionLabel,
} from '@/shared/enum-labels';

// 注：旧 import { FORMAT_LABELS } from '@/utils/option-labels' 仍能工作
// 但语义已对齐：banner→'横幅广告'（与后端 API 返回的 label 一致）
