<template>
  <el-drawer
    :model-value="visible"
    title="关联广告平台"
    direction="rtl"
    size="560px"
    :with-header="true"
    :destroy-on-close="true"
    :append-to-body="true"
    class="bnd-drawer"
    @update:model-value="onVisibleChange"
  >
    <div class="bnd-body">
      <!-- 顶部应用信息条 -->
      <div class="bnd-header">
        <div class="bnd-header-icon">
          <el-icon><Cellphone /></el-icon>
        </div>
        <div class="bnd-header-content">
          <p class="bnd-header-title">
            <el-icon :size="12" color="#3B82F6"><Promotion /></el-icon>
            <span>正在为</span>
            <span class="bnd-header-app-name">{{ appName }}</span>
            <span>关联广告平台</span>
          </p>
          <p class="bnd-header-sub">关联后可在「广告平台 → 账号管理」中查看与编辑</p>
        </div>
      </div>

      <!-- 卡片 1：选择广告平台 -->
      <section class="bnd-card">
        <header class="bnd-card-head">
          <el-icon class="bnd-card-head-icon"><Link /></el-icon>
          <span class="bnd-card-head-title">选择广告平台</span>
          <span class="bnd-card-head-extra">必选</span>
        </header>
        <div class="bnd-card-body">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            class="bnd-form"
          >
            <el-form-item label="广告平台" prop="networkDefId">
              <el-select
                v-model="formData.networkDefId"
                placeholder="请选择广告平台"
                filterable
                class="bnd-select"
                :loading="loadingNetworks"
                @change="onNetworkChange"
              >
                <el-option
                  v-for="n in networkList"
                  :key="n.id"
                  :label="`${n.network_name} (${n.network_code})`"
                  :value="n.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </section>

      <!-- 卡片 2：网络字段配置（选了广告平台后出现） -->
      <section v-if="formData.networkDefId" class="bnd-card">
        <header class="bnd-card-head">
          <el-icon class="bnd-card-head-icon"><Setting /></el-icon>
          <span class="bnd-card-head-title">账号与字段配置</span>
          <span class="bnd-card-head-extra">{{ currentNetworkName || '—' }}</span>
        </header>
        <div class="bnd-card-body">
          <!-- 选了网络但没字段（异常） -->
          <div v-if="visibleFields.length === 0" class="bnd-empty">
            <div class="bnd-empty-icon">
              <el-icon><DocumentRemove /></el-icon>
            </div>
            <div>该广告平台暂无可配置字段</div>
          </div>

          <el-form
            v-else
            ref="fieldsFormRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            class="bnd-form"
            @submit.prevent
          >
            <el-form-item
              v-for="field in visibleFields"
              :key="field.key"
              :prop="field.key"
            >
              <template #label>
                <div class="bnd-field-label">
                  <span class="bnd-field-label-text">{{ field.label }}</span>
                  <span v-if="field.required" class="bnd-field-label-required">*</span>
                </div>
              </template>

              <!-- text / password -->
              <el-input
                v-if="field.type === 'text' || field.type === 'password'"
                v-model="formData[field.key]"
                :type="field.type === 'password' ? 'password' : 'text'"
                :placeholder="field.placeholder || '请输入'"
                :maxlength="field.maxlength"
                show-password
                clearable
              />

              <!-- switch -->
              <el-switch
                v-else-if="field.type === 'switch'"
                v-model="formData[field.key]"
                inline-prompt
                active-text="是"
                inactive-text="否"
              />

              <!-- currency 锁死显示 -->
              <div v-else-if="field.type === 'currency'" class="bnd-currency">
                <span class="bnd-currency-value">{{ getFixed(field) }}</span>
                <span class="bnd-currency-lock">
                  <el-icon :size="11"><Lock /></el-icon>
                  不可修改
                </span>
              </div>

              <!-- select -->
              <el-select
                v-else-if="field.type === 'select'"
                v-model="formData[field.key]"
                placeholder="请选择"
                class="bnd-select"
              >
                <el-option
                  v-for="opt in getOptions(field)"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>

              <!-- pub-key 百度新义公钥 -->
              <div v-else-if="field.type === 'pub-key'" class="bnd-pubkey">
                <el-input
                  v-model="formData[field.key]"
                  type="textarea"
                  :rows="4"
                  readonly
                  placeholder="点击「生成公钥」按钮自动生成新义公钥"
                  class="bnd-pubkey-input"
                />
                <div class="bnd-pubkey-actions">
                  <el-button size="small" :icon="Refresh" @click="generatePubKey">
                    {{ getBtnText(field) }}
                  </el-button>
                  <el-button
                    size="small"
                    type="primary"
                    :icon="CopyDocument"
                    :disabled="!formData[field.key]"
                    plain
                    @click="copyPubKey"
                  >
                    {{ getCopyText(field) }}
                  </el-button>
                </div>
              </div>

              <!-- key-value 自定义参数 -->
              <div v-else-if="field.type === 'key-value'" class="bnd-kv">
                <div
                  v-for="(pair, idx) in formData[field.key]"
                  :key="idx"
                  class="bnd-kv-row"
                >
                  <el-input
                    v-model="pair.key"
                    placeholder="参数 key"
                    class="bnd-kv-input-key"
                    clearable
                  />
                  <span class="bnd-kv-eq">=</span>
                  <el-input
                    v-model="pair.value"
                    placeholder="参数 value"
                    class="bnd-kv-input-val"
                    clearable
                  />
                  <el-button
                    link
                    type="danger"
                    :icon="Delete"
                    class="bnd-kv-del"
                    @click="removeKV(field.key, idx)"
                  />
                </div>
                <el-button
                  link
                  type="primary"
                  :icon="Plus"
                  class="bnd-kv-add"
                  @click="addKV(field.key)"
                >
                  {{ getAddText(field) }}
                </el-button>
              </div>

              <!-- 内嵌 hint（替代 el-tooltip 浅框） -->
              <div v-if="field.tooltip" class="bnd-hint">
                <el-icon class="bnd-hint-icon"><InfoFilled /></el-icon>
                <span>{{ field.tooltip }}</span>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="bnd-footer">
        <el-button @click="onCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!formData.networkDefId"
          @click="onSubmit"
        >确认关联</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Cellphone, Promotion, Link, Setting, DocumentRemove, Lock,
  Plus, Delete, Refresh, CopyDocument, InfoFilled,
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getSchemaByNetwork, makeInitialData, type FieldDef } from './network-field-schemas'

// 模板辅助：避免模板里写 (field as any) TS 断言
function getAddText(field: FieldDef): string {
  const f = field as FieldDef & { addText?: string }
  return f.addText || '增加参数'
}
function getFixed(field: FieldDef): string {
  const f = field as FieldDef & { fixed?: string }
  return f.fixed || ''
}
function getOptions(field: FieldDef): { label: string; value: string | number }[] {
  const f = field as FieldDef & { options?: { label: string; value: string | number }[] }
  return f.options || []
}
function getBtnText(field: FieldDef): string {
  const f = field as FieldDef & { btnText?: string }
  return f.btnText || '生成'
}
function getCopyText(field: FieldDef): string {
  const f = field as FieldDef & { copyText?: string }
  return f.copyText || '复制'
}

interface Network {
  id: number
  network_code: string
  network_name: string
  network_type: number
  status: number
}

interface Props {
  modelValue: boolean
  appKey: string
  appName: string
}

interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed(() => props.modelValue)
const formRef = ref()
const submitting = ref(false)
const loadingNetworks = ref(false)

const networkList = ref<Network[]>([])

const currentNetworkName = ref('')

const formData = ref<Record<string, any>>({
  networkDefId: null,
})

const schema = computed<FieldDef[]>(() => {
  const n = networkList.value.find(x => x.id === formData.value.networkDefId)
  if (!n) return []
  return getSchemaByNetwork({ network_code: n.network_code, network_type: n.network_type })
})

const visibleFields = computed(() => {
  return schema.value.filter(f => {
    if (!f.showWhen) return true
    return formData.value[f.showWhen.key] === f.showWhen.value
  })
})

const rules = computed(() => {
  const r: Record<string, any> = {
    networkDefId: [{ required: true, message: '请选择广告平台', trigger: 'change' }],
  }
  for (const f of schema.value) {
    if (f.required) {
      r[f.key] = [
        {
          required: true,
          validator: (_: any, value: any, cb: any) => {
            if (f.type === 'key-value') {
              if (!Array.isArray(value) || value.length === 0) {
                return cb(new Error(`${f.label} 至少添加一对`))
              }
              const hasEmpty = value.some((p: any) => !p.key || !p.value)
              if (hasEmpty) return cb(new Error(`${f.label} key 和 value 都不能为空`))
            } else if (value === undefined || value === null || value === '') {
              return cb(new Error(`${f.label} 必填`))
            }
            cb()
          },
          trigger: ['blur', 'change'],
        },
      ]
    }
  }
  return r
})

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      formData.value = {
        networkDefId: null,
      }
      currentNetworkName.value = ''
      loadNetworks()
    }
  }
)

async function loadNetworks() {
  loadingNetworks.value = true
  try {
    const res: any = await request.get('/api/v1/console/network/list', { params: { status: 1 } })
    if (res?.code === 0) {
      networkList.value = res.data?.list || []
    }
  } catch (e) {
    // ignore
  } finally {
    loadingNetworks.value = false
  }
}

function onNetworkChange(networkDefId: number) {
  const n = networkList.value.find(x => x.id === networkDefId)
  if (!n) return
  currentNetworkName.value = n.network_name
  // 选完网络：直接初始化 schema 字段
  const initData = makeInitialData(schema.value)
  Object.assign(formData.value, initData)
}

function addKV(key: string) {
  if (!Array.isArray(formData.value[key])) formData.value[key] = []
  formData.value[key].push({ key: '', value: '' })
}

function removeKV(key: string, idx: number) {
  formData.value[key].splice(idx, 1)
}

function generatePubKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let s = '-----BEGIN PUBLIC KEY-----\n'
  for (let i = 0; i < 8; i++) {
    let line = ''
    for (let j = 0; j < 48; j++) {
      line += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    s += line + '\n'
  }
  s += '-----END PUBLIC KEY-----'
  formData.value.pubKey = s
}

async function copyPubKey() {
  try {
    await navigator.clipboard.writeText(formData.value.pubKey || '')
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}

function onVisibleChange(v: boolean) {
  emit('update:modelValue', v)
}

function onCancel() {
  emit('update:modelValue', false)
}

async function onSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    // 组装 credentials
    const credentials: Record<string, any> = {}
    for (const f of schema.value) {
      if (formData.value[f.key] !== undefined) {
        credentials[f.key] = formData.value[f.key]
      }
    }
    // 1. 先在 ad_network_account 创建/取一个「默认账号」拿到 accountId
    const accountName = formData.value.accountName || '默认账号'
    const createRes: any = await request.post('/api/v1/console/network/account/create', {
      networkDefId: formData.value.networkDefId,
      appId: props.appKey,
      accountName,
      accountId: formData.value.accountId || `acc_${Date.now()}`,
      credentials,
      status: 1,
    })
    if (createRes?.code !== 0) {
      ElMessage.error(createRes?.message || '创建账号失败')
      return
    }
    const accountId = createRes.data?.id
    // 2. 调用 app/bind，把 accountId 写到 network_app_id
    const payload = {
      appKey: props.appKey,
      networkDefId: formData.value.networkDefId,
      networkAppId: String(accountId || ''),
      adapterVersionId: 0,
      extraParams: {
        credentials,
        accountId,
      },
      status: 1,
    }
    const res: any = await request.post('/api/v1/console/network/app/bind', payload)
    if (res?.code === 0) {
      ElMessage.success('关联成功')
      emit('success')
      emit('update:modelValue', false)
    } else {
      ElMessage.error(res?.message || '关联失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '关联失败')
  } finally {
    submitting.value = false
  }
}
</script>
