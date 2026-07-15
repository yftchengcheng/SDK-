<!--
  BoardConfigDialog - 看版配置弹窗
  创建/编辑看版的名称、描述、布局类型、默认筛选器
-->
<template>
  <el-dialog
    :model-value="visible"
    :title="form.id ? '编辑看版' : '新建看版'"
    width="640px"
    :close-on-click-modal="false"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
    @open="onOpen"
    @close="onClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <el-form-item label="看版名称" prop="name">
        <el-input v-model="form.name" maxlength="50" placeholder="例：综合日报 - 收入维度" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" maxlength="200" placeholder="可选，描述此看版的用途" />
      </el-form-item>
      <el-form-item label="报表类型" prop="report_type">
        <el-radio-group v-model="form.report_type" :disabled="!!form.id">
          <el-radio value="overview">综合报表</el-radio>
          <el-radio value="funnel">漏斗分析</el-radio>
          <el-radio value="behavior">用户行为</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.report_type === 'overview'" label="默认视图">
        <el-radio-group v-model="form.config.layout.view">
          <el-radio value="table">表格</el-radio>
          <el-radio value="card">卡片</el-radio>
          <el-radio value="trend">趋势图</el-radio>
          <el-radio value="bar">柱状图</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="默认时间">
        <el-select v-model="form.config.filters.dateRange" style="width: 200px">
          <el-option label="今天" value="today" />
          <el-option label="昨天" value="yesterday" />
          <el-option label="近 7 天" value="7d" />
          <el-option label="近 30 天" value="30d" />
          <el-option label="本月" value="month" />
          <el-option label="上月" value="lastMonth" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.report_type === 'overview'" label="默认维度">
        <el-checkbox-group v-model="form.config.dimensions">
          <el-checkbox value="date">日期</el-checkbox>
          <el-checkbox value="app">应用</el-checkbox>
          <el-checkbox value="placement">广告位</el-checkbox>
          <el-checkbox value="ad_source">广告源</el-checkbox>
          <el-checkbox value="country">国家</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

interface BoardForm {
  id?: number;
  name: string;
  description: string;
  report_type: 'overview' | 'funnel' | 'behavior';
  config: {
    dimensions: string[];
    metrics: string[];
    filters: { dateRange: string; appIds?: string[]; placementIds?: string[] };
    layout: { view: 'table' | 'card' | 'trend' | 'bar' };
  };
}

const props = defineProps<{ visible: boolean; board?: BoardForm | null }>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'saved'): void }>();

const formRef = ref();
const submitting = ref(false);

const defaultForm = (): BoardForm => ({
  name: '',
  description: '',
  report_type: 'overview',
  config: {
    dimensions: ['date'],
    metrics: [],
    filters: { dateRange: '7d' },
    layout: { view: 'table' },
  },
});

const form = ref<BoardForm>(defaultForm());

const rules = {
  name: [{ required: true, message: '请输入看版名称', trigger: 'blur' }],
  report_type: [{ required: true, message: '请选择报表类型', trigger: 'change' }],
};

const onOpen = () => {
  if (props.board) {
    form.value = JSON.parse(JSON.stringify(props.board));
  } else {
    form.value = defaultForm();
  }
};

const onClose = () => {
  formRef.value?.resetFields?.();
};

const submit = async () => {
  await formRef.value.validate();
  submitting.value = true;
  try {
    if (form.value.id) {
      await request.patch(`/api/v1/console/report/board/update/${form.value.id}`, form.value);
    } else {
      await request.post('/api/v1/console/report/board/create', form.value);
    }
    ElMessage.success('保存成功');
    emit('saved');
    emit('update:visible', false);
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    submitting.value = false;
  }
};

watch(() => props.board, (v) => {
  if (v) form.value = JSON.parse(JSON.stringify(v));
});
</script>
