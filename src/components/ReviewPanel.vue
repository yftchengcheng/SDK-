<template>
  <el-table :data="versions" v-loading="loading" stripe size="small">
    <el-table-column prop="version" label="版本号" width="120" />
    <el-table-column prop="adapter_type" label="类型" width="120">
      <template #default="{ row }">
        <el-tag size="small">{{ typeLabel(row.adapter_type) }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="file_name" label="文件" min-width="160" show-overflow-tooltip />
    <el-table-column prop="file_size" label="大小" width="90">
      <template #default="{ row }">{{ formatSize(row.file_size) }}</template>
    </el-table-column>
    <el-table-column prop="status" label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="created_at" label="上传时间" width="170">
      <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
    </el-table-column>
    <el-table-column prop="review_remark" label="审核备注" min-width="120" show-overflow-tooltip />
    <el-table-column label="操作" width="220" fixed="right">
      <template #default="{ row }">
        <el-button link type="primary" size="small" @click="emit('download', row)">下载</el-button>
        <template v-if="row.status === 0">
          <el-button link type="success" size="small" @click="handleReview(row, 1)">通过</el-button>
          <el-button link type="danger" size="small" @click="handleReview(row, 2)">拒绝</el-button>
        </template>
        <el-button link type="danger" size="small" @click="emit('delete', row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus';

export interface AdapterVersion {
  id: number | string;
  version: string;
  adapter_type: number;
  file_name: string;
  file_size: number;
  status: number;
  review_remark?: string;
  created_at: string;
}

const props = defineProps<{
  versions: AdapterVersion[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'review', payload: { row: AdapterVersion; status: number; remark: string }): void;
  (e: 'download', row: AdapterVersion): void;
  (e: 'delete', row: AdapterVersion): void;
}>();

const typeLabel = (t: number) => ({ 1: '初始化', 2: 'Banner', 3: '插屏', 4: '激励视频', 5: '原生', 6: '开屏' }[t] || '其他');
const statusLabel = (s: number) => ({ 0: '待审核', 1: '已通过', 2: '已拒绝' }[s] || '未知');
const statusType = (s: number) => ({ 0: 'warning', 1: 'success', 2: 'danger' }[s] || 'info');
const formatSize = (bytes: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};
const formatDate = (d: string) => (d ? new Date(d).toLocaleString('zh-CN') : '-');

async function handleReview(row: AdapterVersion, status: number): Promise<void> {
  let remark = '';
  if (status === 2) {
    const r = await ElMessageBox.prompt('请输入拒绝原因', '拒绝审核', { inputType: 'textarea' }).catch(() => null);
    if (!r) return;
    remark = r.value || '';
  }
  emit('review', { row, status, remark });
  // 防止 lint 报 unused
  void props;
}
</script>
