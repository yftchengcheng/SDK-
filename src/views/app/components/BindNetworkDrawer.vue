<template>
  <el-drawer
    v-model="visible"
    title="关联广告平台账号"
    direction="rtl"
    size="460px"
    :destroy-on-close="false"
    @closed="handleClosed"
  >
    <div class="bnd-body">
      <!-- 面包屑：关联广告平台账号 - 应用 - {appName} -->
      <div class="bnd-header">
        <div class="bnd-header-crumbs">
          <span>关联广告平台账号</span>
          <el-icon><ArrowRight /></el-icon>
          <span>应用</span>
          <el-icon><ArrowRight /></el-icon>
          <span class="bnd-header-crumbs-app">{{ props.appName || props.appKey }}</span>
        </div>
        <p class="bnd-header-sub">为该应用绑定一个广告平台账号，关联后可同步该平台的广告数据</p>
      </div>

      <!-- 表单：仅 2 字段（应用 + 广告平台） -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="bnd-form"
      >
        <el-form-item label="应用">
          <div class="bnd-static-field">
            <el-icon class="bnd-static-icon"><Cellphone /></el-icon>
            <span class="bnd-static-name">{{ props.appName || props.appKey }}</span>
          </div>
        </el-form-item>
        <el-form-item label="广告平台" prop="networkDefId">
          <el-select
            v-model="form.networkDefId"
            placeholder="请选择"
            style="width: 100%"
            :loading="loadingList"
            :empty-values="[]"
            no-data-text="暂无可关联的广告平台"
          >
            <el-option
              v-for="n in networkList"
              :key="n.id"
              :label="n.network_name"
              :value="n.id"
            >
              <div class="bnd-option">
                <span class="bnd-option-name">{{ n.network_name }}</span>
                <el-tag v-if="n.network_type === 2" type="warning" size="small">自定义</el-tag>
                <el-tag v-else type="info" size="small">内置</el-tag>
              </div>
            </el-option>
          </el-select>
          <div v-if="!loadingList && networkList.length === 0" class="bnd-empty">
            <p class="bnd-empty-tip">暂无可关联的广告平台</p>
            <el-button type="primary" plain size="small" @click="goCreateNetwork">
              <el-icon><Plus /></el-icon>
              去创建广告平台
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="bnd-footer">
        <el-button @click="close">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!form.networkDefId"
          @click="submit"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Cellphone, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'

interface NetworkItem {
  id: number
  network_name: string
  network_type: number
}

const props = defineProps<{
  modelValue: boolean
  appKey: string
  appName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  success: []
}>()

const router = useRouter()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const formRef = ref<FormInstance>()
const form = ref({ networkDefId: undefined as number | undefined })
const rules: FormRules = {
  networkDefId: [{ required: true, message: '请选择广告平台', trigger: 'change' }]
}

const networkList = ref<NetworkItem[]>([])
const loadingList = ref(false)
const submitting = ref(false)

async function loadNetworkList() {
  loadingList.value = true
  try {
    const res = await request.get<{ list: NetworkItem[] }>('/api/v1/console/network/list')
    networkList.value = res.data?.list || []
  } catch (e) {
    networkList.value = []
  } finally {
    loadingList.value = false
  }
}

function reset() {
  form.value.networkDefId = undefined
  formRef.value?.clearValidate()
}

function close() {
  visible.value = false
}

function handleClosed() {
  reset()
}

function goCreateNetwork() {
  visible.value = false
  router.push('/network')
}

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  if (!props.appKey || !form.value.networkDefId) return
  submitting.value = true
  try {
    await request.post('/api/v1/console/network/app/bind', {
      appKey: props.appKey,
      networkDefId: form.value.networkDefId
    })
    ElMessage.success('关联成功')
    emit('success')
    close()
  } catch (e) {
    // request 已统一 ElMessage
  } finally {
    submitting.value = false
  }
}

watch(visible, (v) => {
  if (v) loadNetworkList()
})
</script>
