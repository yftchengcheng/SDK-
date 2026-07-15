<!--
  BoardConfigDialog - 新建/编辑看版（仅综合报表）
  仅含：看版名称 + 描述 + 默认时间
  维度/指标/筛选/视图均在报表界面选择
-->
<template>
  <el-dialog
    :model-value="visible"
    :title="form.id ? '编辑看版' : '新建看版'"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
    @open="onOpen"
    @close="onClose"
  >
    <div class="board-config-hint">
      <el-icon><InfoFilled /></el-icon>
      <span>新建看版仅对综合报表生效。维度、指标、筛选器、视图等均在报表界面配置。</span>
    </div>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <el-form-item label="看版名称" prop="name">
        <el-input v-model="form.name" maxlength="50" placeholder="例：综合日报 - 收入维度" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" maxlength="200" placeholder="可选，描述此看版的用途" />
      </el-form-item>
      <el-form-item label="默认时间">
        <el-select v-model="form.config.filters.dateRange" style="width: 200px">
          <el-option label="今天" value="today" />
          <el-option label="昨天" value="yesterday" />
          <el-option label="近 7 天" value="7d" />
          <el-option label="近 14 天" value="14d" />
          <el-option label="近 30 天" value="30d" />
          <el-option label="本月" value="month" />
          <el-option label="上月" value="lastMonth" />
        </el-select>
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
import { InfoFilled } from '@element-plus/icons-vue';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

interface BoardForm {
  id?: number;
  name: string;
  description: string;
  report_type: 'overview';
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
