<script setup lang="ts">
/**
 * 统一分页组件
 *
 * 用法：
 *   <TablePagination
 *     v-model:current-page="page"
 *     v-model:page-size="pageSize"
 *     :total="total"
 *     @change="fetchList"
 *   />
 */
import { computed } from 'vue';

interface Props {
  currentPage?: number;
  pageSize?: number;
  total?: number;
  pageSizes?: number[];
  layout?: string;
  small?: boolean;
  background?: boolean;
  hideOnSinglePage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 20,
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  small: false,
  background: true,
  hideOnSinglePage: false,
});

const emit = defineEmits<{
  (e: 'update:currentPage', v: number): void;
  (e: 'update:pageSize', v: number): void;
  (e: 'change', payload: { page: number; size: number }): void;
}>();

const page = computed({
  get: () => props.currentPage,
  set: (v) => {
    emit('update:currentPage', v);
    emit('change', { page: v, size: props.pageSize });
  },
});

const size = computed({
  get: () => props.pageSize,
  set: (v) => {
    emit('update:pageSize', v);
    emit('update:currentPage', 1);
    emit('change', { page: 1, size: v });
  },
});
</script>

<template>
  <div class="page-pagination">
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      :small="small"
      :background="background"
      :hide-on-single-page="hideOnSinglePage"
    />
  </div>
</template>
