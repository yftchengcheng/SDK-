<template>
  <el-drawer
    v-model="visible"
    title="关联广告平台"
    size="480px"
    direction="rtl"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <div class="bnd-body" v-loading="loading">
      <!-- 标题层级：关联广告平台账号 - 应用 - {appName} -->
      <header class="bnd-header">
        <div class="bnd-header-crumbs">
          <span>关联广告平台账号</span>
          <el-icon><ArrowRight /></el-icon>
          <span>应用</span>
          <el-icon><ArrowRight /></el-icon>
          <span class="bnd-header-crumbs-app">{{ appName }}</span>
        </div>
        <p class="bnd-header-sub">
          为「{{ appName }}」关联广告平台。关联后可在该平台下创建广告位并下发广告。
        </p>
      </header>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="92px"
        label-position="right"
        class="bnd-form"
      >
        <el-form-item label="广告平台" prop="networkDefId">
          <el-select
            v-model="form.networkDefId"
            placeholder="请选择广告平台"
            filterable
            style="width: 100%"
            :loading="networkLoading"
            @change="onNetworkChange"
          >
            <el-option
              v-for="n in networkList"
              :key="n.id"
              :label="`${n.network_name}${n.network_type === 2 ? ' (自定义)' : ''}`"
              :value="n.id"
            >
              <div class="bnd-option">
                <span class="bnd-option-name">{{ n.network_name }}</span>
                <el-tag
                  v-if="n.network_type === 2"
                  size="small"
                  type="info"
                  effect="plain"
                >自定义</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="平台应用 ID" prop="networkAppId">
          <el-input
            v-model="form.networkAppId"
            :placeholder="networkAppIdPlaceholder"
            clearable
            maxlength="64"
          />
          <div class="bnd-form-hint">
            请填写在所选广告平台后台注册的应用 ID（App ID），用于上报与对账对齐
          </div>
        </el-form-item>

        <el-form-item label="Adapter 版本">
          <el-select
            v-model="form.adapterVersionId"
            placeholder="使用最新版本（可选）"
            clearable
            style="width: 100%"
            :disabled="!form.networkDefId"
          >
            <el-option
              v-for="v in adapterVersions"
              :key="v.id"
              :label="`v${v.version} (${v.status === 2 ? '已上架' : v.status === 1 ? '审核中' : '草稿'})`"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="bnd-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="onSubmit"
        >确认关联</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue';
import request from '../../../utils/request';

interface NetworkDef {
  id: number;
  network_name: string;
  network_type: number;
}
interface AdapterVersion {
  id: number;
  version: string;
  status: number;
}

const props = defineProps<{
  modelValue: boolean;
  appKey: string;
  appName: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [val: boolean];
  success: [];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const loading = ref(false);
const submitting = ref(false);
const networkLoading = ref(false);
const networkList = ref<NetworkDef[]>([]);
const adapterVersions = ref<AdapterVersion[]>([]);

const formRef = ref<FormInstance>();
const form = reactive({
  networkDefId: null as number | null,
  networkAppId: '',
  adapterVersionId: null as number | null,
});

const networkAppIdPlaceholder = computed(() => {
  const n = networkList.value.find((x) => x.id === form.networkDefId);
  return n ? `例如在「${n.network_name}」后台注册的应用 ID` : '请先选择广告平台';
});

const rules: FormRules = {
  networkDefId: [
    { required: true, message: '请选择广告平台', trigger: 'change' },
  ],
  networkAppId: [
    { required: true, message: '请填写平台应用 ID', trigger: 'blur' },
    { min: 2, max: 64, message: '长度 2-64 字符', trigger: 'blur' },
  ],
};

const fetchNetworks = async () => {
  networkLoading.value = true;
  try {
    const res = await request.get('/api/v1/console/network/list');
    const list = (res.data?.data?.list || []) as NetworkDef[];
    networkList.value = list.filter((n) => n.status === 1 || n.status === undefined);
  } catch (err) {
    ElMessage.error('广告平台列表加载失败');
  } finally {
    networkLoading.value = false;
  }
};

const fetchAdapterVersions = async (networkDefId: number) => {
  try {
    const res = await request.get('/api/v1/console/network/adapter/list', {
      params: { networkDefId },
    });
    const list = (res.data?.data?.list || []) as Array<{ id: number; version: string; status: number }>;
    adapterVersions.value = list.filter((v) => v.status === 2); // 仅已上架
  } catch {
    adapterVersions.value = [];
  }
};

const onNetworkChange = (id: number | null) => {
  form.adapterVersionId = null;
  if (id) {
    fetchAdapterVersions(id);
  } else {
    adapterVersions.value = [];
  }
};

const onSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  if (!form.networkDefId) return;

  submitting.value = true;
  try {
    await request.post('/api/v1/console/network/app/bind', {
      appKey: props.appKey,
      networkDefId: form.networkDefId,
      networkAppId: form.networkAppId.trim(),
      adapterVersionId: form.adapterVersionId || 0,
    });
    ElMessage.success('关联成功');
    visible.value = false;
    emit('success');
  } catch (err: any) {
    const msg = err?.response?.data?.message || '关联失败';
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
};

watch(visible, (v) => {
  if (v) {
    // 重置表单
    form.networkDefId = null;
    form.networkAppId = '';
    form.adapterVersionId = null;
    adapterVersions.value = [];
    fetchNetworks();
  }
});
</script>
