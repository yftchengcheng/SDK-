<!--
  SaveAsBoardDialog - 「保存为看版」弹窗
  用途：在综合报表界面配置好筛选/维度/指标后，保存为新的看版
  边界：仅综合报表 / 漏斗 / 行为
  流程：用户在默认看版上调整条件 → 点「保存为看版」→ 输入名称（可选描述）→ 创建新看版
  注意：默认看版不可被删除/被覆盖；当前 dialog 永远创建新看版（is_default=false）
-->
<template>
  <el-dialog
    :model-value="visible"
    title="保存为新看版"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
    @open="onOpen"
  >
    <!-- 提示：会保存当前界面的筛选/维度/指标 -->
    <div class="board-config-hint">
      <el-icon><InfoFilled /></el-icon>
      <span>系统会保存当前报表界面的「筛选器、维度、指标」作为新看版的默认配置。</span>
    </div>

    <!-- 当前条件摘要（只读预览） -->
    <div class="save-as-board-summary">
      <div class="summary-row">
        <span class="summary-label">维度：</span>
        <span class="summary-value">
          <el-tag
            v-for="d in config.dimensions"
            :key="d"
            size="small"
            effect="plain"
            type="info"
            class="summary-tag"
          >{{ dimLabel(d) }}</el-tag>
          <span v-if="config.dimensions.length === 0" class="summary-empty">未选</span>
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">指标：</span>
        <span class="summary-value">
          <el-tag
            v-for="m in config.metrics"
            :key="m"
            size="small"
            effect="plain"
            type="success"
            class="summary-tag"
          >{{ metricLabel(m) }}</el-tag>
          <span v-if="config.metrics.length === 0" class="summary-empty">未选</span>
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">筛选：</span>
        <span class="summary-value summary-value--text">{{ filterSummary }}</span>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <el-form-item label="看版名称" prop="name">
        <el-input v-model="form.name" maxlength="50" placeholder="例：综合日报 - 收入维度" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" maxlength="200" placeholder="可选，描述此看版的用途" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

interface BoardConfig {
  dimensions: string[];
  metrics: string[];
  filters: Record<string, unknown>;
  layout: { view: string };
}

const props = defineProps<{
  visible: boolean;
  config: BoardConfig;
  reportType: 'overview' | 'funnel' | 'behavior';
  /** 维度 code -> 中文标签 映射（由父组件传入） */
  dimLabels?: Record<string, string>;
  /** 指标 code -> 中文标签 映射（由父组件传入） */
  metricLabels?: Record<string, string>;
}>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'saved'): void }>();

const formRef = ref();
const submitting = ref(false);

const form = ref({ name: '', description: '' });

const rules = {
  name: [{ required: true, message: '请输入看版名称', trigger: 'blur' }],
};

const dimLabel = (code: string) => props.dimLabels?.[code] || code;
const metricLabel = (code: string) => props.metricLabels?.[code] || code;

const filterSummary = computed(() => {
  const f = props.config.filters || {};
  const parts: string[] = [];
  if (f.dateRange) {
    const map: Record<string, string> = {
      today: '今天', yesterday: '昨天', '7d': '近 7 天', '14d': '近 14 天',
      '30d': '近 30 天', month: '本月', lastMonth: '上月',
    };
    parts.push(map[f.dateRange as string] || String(f.dateRange));
  }
  if (Array.isArray(f.appIds) && f.appIds.length) parts.push(`应用 ${f.appIds.length} 个`);
  if (Array.isArray(f.placementIds) && f.placementIds.length) parts.push(`广告位 ${f.placementIds.length} 个`);
  if (Array.isArray(f.adSourceIds) && f.adSourceIds.length) parts.push(`广告源 ${f.adSourceIds.length} 个`);
  if (Array.isArray(f.formats) && f.formats.length) parts.push(`类型 ${f.formats.length} 个`);
  if (Array.isArray(f.country) && f.country.length) parts.push(`地区 ${f.country.length} 个`);
  if (Array.isArray(f.osList) && f.osList.length) parts.push(`系统 ${f.osList.length} 个`);
  if (Array.isArray(f.platforms) && f.platforms.length) parts.push(`平台 ${f.platforms.join('、')}`);
  return parts.length ? parts.join(' · ') : '无';
});

const onOpen = () => {
  form.value = { name: '', description: '' };
  formRef.value?.clearValidate?.();
};

const submit = async () => {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      report_type: props.reportType,
      config: props.config,
      is_default: false, // 用户创建的看版永远不是默认
    };
    await request.post('/api/v1/console/report/board/create', payload);
    ElMessage.success('已保存为新看版');
    emit('saved');
    emit('update:visible', false);
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    submitting.value = false;
  }
};
</script>
