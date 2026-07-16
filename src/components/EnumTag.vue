<template>
  <el-tag
    :type="tagType"
    :effect="effect"
    :size="size"
    :round="round"
    class="enum-tag"
  >
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
/**
 * 通用 enum 展示组件
 *
 * 用法：
 *   <EnumTag dim="app.status" :value="row.status" />
 *   <EnumTag dim="app.platform" :value="row.platform" size="small" />
 *
 * 设计：
 *   - dim 必须是 'table.column' 形式（见 @/shared/enum-labels）
 *   - 自动从 ENUM_LABELS 取 label，自动给 status 类维度配色
 *   - value 为 null/undefined 时显示 '--'
 */

import { computed } from 'vue';
import { getEnumLabel, getEnumTagType } from '@/shared/enum-labels';

interface Props {
  dim: string;                                      // 维度名
  value: string | number | boolean | null | undefined;
  size?: 'small' | 'default' | 'large';
  effect?: 'light' | 'dark' | 'plain';
  round?: boolean;
  /** 非 status 维度也能强制指定 tag type */
  forceType?: '' | 'success' | 'info' | 'warning' | 'danger';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  effect: 'light',
  round: false,
  forceType: undefined,
});

const label = computed(() => getEnumLabel(props.dim, props.value));

const tagType = computed(() => {
  if (props.forceType !== undefined) return props.forceType;
  return getEnumTagType(props.dim, props.value);
});
</script>

<style scoped>
.enum-tag {
  font-weight: 500;
}
</style>
