<template>
  <el-drawer
    :model-value="visible"
    title="关联广告平台账号"
    direction="rtl"
    size="560px"
    :with-header="true"
    :destroy-on-close="true"
    :append-to-body="true"
    @update:model-value="onVisibleChange"
  >
    <div class="bnd-root">
      <!-- 应用只读 -->
      <div class="bnd-static">
        <span class="bnd-static-label">应用</span>
        <span class="bnd-static-name">
          <el-tag size="small" type="info" effect="plain" class="bnd-static-tag">
            <el-icon><Box /></el-icon>
            <span>{{ appName }}</span>
          </el-tag>
        </span>
      </div>

      <!-- 广告平台选择 -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="bnd-form"
      >
        <el-form-item label="广告平台" prop="networkDefId" required>
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

        <!-- 选了广告平台之后：直接显示该网络的字段配置 -->
        <template v-if="formData.networkDefId && isCustomNetwork && visibleFields.length > 0">
          <el-form-item
            v-for="field in visibleFields"
            :key="field.key"
            :prop="field.key"
          >
            <template #label>
              <div class="bnd-field-label">
                <span>{{ field.label }}</span>
                <el-tooltip
                  v-if="field.tooltip"
                  :content="field.tooltip"
                  placement="top"
                  :show-after="200"
                  effect="light"
                  raw-content
                >
                  <el-icon class="bnd-tooltip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <!-- key-value 编辑器 -->
            <div v-if="field.type === 'key-value'" class="bnd-kv">
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
                {{ (field as any).addText || '增加参数' }}
              </el-button>
            </div>
          </el-form-item>
        </template>

        <!-- 预置网络字段：选完网络直接展示 -->
        <template v-else-if="formData.networkDefId && visibleFields.length > 0">
          <el-divider class="bnd-divider">
            <span class="bnd-divider-text">账号配置</span>
          </el-divider>

          <el-form-item
            v-for="field in visibleFields"
            :key="field.key"
            :prop="field.key"
          >
            <template #label>
              <div class="bnd-field-label">
                <span>{{ field.label }}</span>
                <el-tooltip
                  v-if="field.tooltip"
                  :content="field.tooltip"
                  placement="top"
                  :show-after="200"
                  effect="light"
                >
                  <el-icon class="bnd-tooltip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <!-- text / password -->
            <el-input
              v-if="field.type === 'text' || field.type === 'password'"
              v-model="formData[field.key]"
              :type="field.type === 'password' ? 'password' : 'text'"
              :placeholder="field.placeholder || '请输入'"
              :maxlength="field.maxlength"
              clearable
            />

            <!-- switch -->
            <el-switch
              v-else-if="field.type === 'switch'"
              v-model="formData[field.key]"
            />

            <!-- currency 固定显示 -->
            <div v-else-if="field.type === 'currency'" class="bnd-currency">
              <span class="bnd-currency-fixed">{{ getFixed(field) }}</span>
              <span class="bnd-currency-lock">不可修改</span>
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

            <!-- pub-key 百度 -->
            <div v-else-if="field.type === 'pub-key'" class="bnd-pubkey">
              <el-input
                v-model="formData[field.key]"
                type="textarea"
                :rows="3"
                readonly
                placeholder="点击「生成公钥」按钮自动生成"
                class="bnd-pubkey-input"
              />
              <div class="bnd-pubkey-actions">
                <el-button size="small" @click="generatePubKey">
                  <el-icon><Refresh /></el-icon>
                  <span>生成公钥</span>
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!formData[field.key]"
                  @click="copyPubKey"
                >
                  <el-icon><CopyDocument /></el-icon>
                  <span>复制</span>
                </el-button>
              </div>
            </div>
          </el-form-item>
        </template>
      </el-form>

      <div class="bnd-help">
        <el-icon><InfoFilled /></el-icon>
        <span>关联后可在「广告平台 → 账号管理」查看与编辑</span>
      </div>
    </div>

    <template #footer>
      <div class="bnd-footer">
        <el-button @click="onCancel">取消</el-button>
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box, Plus, Delete, Refresh, CopyDocument, QuestionFilled, InfoFilled,
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getSchemaByNetwork, makeInitialData, validateRequired, type FieldDef } from './network-field-schemas'

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
function getDefault(field: FieldDef): string | number | boolean | undefined {
  const f = field as FieldDef & { default?: string | number | boolean }
  return f.default
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

const currentNetworkId = ref<number | null>(null)
const currentNetworkCode = ref('')
const currentNetworkName = ref('')

const formData = ref<Record<string, any>>({
  networkDefId: null,
})

const isCustomNetwork = computed(() => {
  const n = networkList.value.find(x => x.id === formData.value.networkDefId)
  return n?.network_type === 2
})

const schema = computed<FieldDef[]>(() => {
  const n = networkList.value.find(x => x.id === formData.value.networkDefId)
  if (!n) return []
  return getSchemaByNetwork({ network_code: n.network_code, network_type: n.network_type })
})

const visibleFields = computed(() => {
  const fields = schema.value.filter(f => {
    if (!f.showWhen) return true
    return formData.value[f.showWhen.key] === f.showWhen.value
  })
  // eslint-disable-next-line no-console
  console.log('[bnd] visibleFields:', fields.length, JSON.stringify(fields.map(f => ({ k: f.key, t: f.type }))))
  return fields
})

const rules = computed(() => {
  const r: Record<string, any> = {
    networkDefId: [{ required: true, message: '请选择广告平台', trigger: 'change' }],
    accountId: [{ required: true, message: '请选择账号', trigger: 'change' }],
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
        accountId: null,
      }
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
  currentNetworkId.value = n.id
  currentNetworkCode.value = n.network_code
  currentNetworkName.value = n.network_name
  // 选完网络：直接初始化 schema 字段（预置/自定义都直接展示）
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
