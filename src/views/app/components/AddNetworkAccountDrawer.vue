<template>
  <el-drawer
    :model-value="visible"
    title="添加广告平台账号"
    direction="rtl"
    size="520px"
    :with-header="true"
    :destroy-on-close="true"
    :append-to-body="true"
    @update:model-value="onVisibleChange"
  >
    <div class="ana-root">
      <!-- 网络只读 + AUTO 徽标 -->
      <div class="ana-static">
        <span class="ana-static-label">广告平台</span>
        <span class="ana-static-name">
          <el-tag size="small" type="info" effect="plain" class="ana-static-tag">{{ networkName }}</el-tag>
          <span class="ana-static-badge">AUTO</span>
        </span>
      </div>

      <!-- 动态字段（按 networkCode 渲染） -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="ana-form"
      >
        <el-form-item
          v-for="field in visibleFields"
          :key="field.key"
          :label="renderLabel(field)"
          :prop="field.key"
          :required="!!field.required"
        >
          <!-- text / password -->
          <el-input
            v-if="field.type === 'text' || field.type === 'password'"
            v-model="formData[field.key]"
            :type="field.type === 'password' ? 'password' : 'text'"
            :placeholder="field.placeholder || '请输入'"
            :maxlength="field.maxlength"
            show-word-limit
            clearable
          />

          <!-- switch -->
          <el-switch
            v-else-if="field.type === 'switch'"
            v-model="formData[field.key]"
          />

          <!-- currency 固定显示 -->
          <div v-else-if="field.type === 'currency'" class="ana-currency">
            <span class="ana-currency-fixed">{{ (field as any).fixed }}</span>
            <span class="ana-currency-lock">不可修改</span>
          </div>

          <!-- select -->
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formData[field.key]"
            placeholder="请选择"
            class="ana-select"
          >
            <el-option
              v-for="opt in (field as any).options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- pub-key 百度专用：生成+复制 -->
          <div v-else-if="field.type === 'pub-key'" class="ana-pubkey">
            <el-input
              v-model="formData[field.key]"
              type="textarea"
              :rows="3"
              readonly
              placeholder="点击「生成公钥」按钮自动生成"
              class="ana-pubkey-input"
            />
            <div class="ana-pubkey-actions">
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

          <!-- key-value 百度/自定义 K-V 对 -->
          <div v-else-if="field.type === 'key-value'" class="ana-kv">
            <div
              v-for="(pair, idx) in formData[field.key]"
              :key="idx"
              class="ana-kv-row"
            >
              <el-input
                v-model="pair.key"
                placeholder="参数 key"
                class="ana-kv-input-key"
                clearable
              />
              <span class="ana-kv-eq">=</span>
              <el-input
                v-model="pair.value"
                placeholder="参数 value"
                class="ana-kv-input-val"
                clearable
              />
              <el-button
                link
                type="danger"
                :icon="Delete"
                class="ana-kv-del"
                @click="removeKV(field.key, idx)"
              />
            </div>
            <el-button
              link
              type="primary"
              :icon="Plus"
              class="ana-kv-add"
              @click="addKV(field.key)"
            >
              {{ (field as any).addText || '增加参数' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="ana-help">
        <el-icon><InfoFilled /></el-icon>
        <span>如何找到这些参数？请前往对应广告平台后台 → 开发者中心 → 应用管理查看</span>
      </div>
    </div>

    <template #footer>
      <div class="ana-footer">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">提交</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Refresh, CopyDocument, Delete, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getSchemaByNetwork, makeInitialData, validateRequired, type FieldDef } from './network-field-schemas'

interface Props {
  modelValue: boolean
  networkId: number | null
  networkCode: string
  networkName: string
}

interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', account: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed(() => props.modelValue)
const formRef = ref()
const formData = ref<Record<string, any>>({})
const submitting = ref(false)

const schema = computed<FieldDef[]>(() => {
  return getSchemaByNetwork({ network_code: props.networkCode, network_type: 1 })
})

// 显隐字段（根据 showWhen 过滤）
const visibleFields = computed(() => {
  return schema.value.filter(f => {
    if (!f.showWhen) return true
    return formData.value[f.showWhen.key] === f.showWhen.value
  })
})

// 表单校验规则
const rules = computed(() => {
  const r: Record<string, any> = {}
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
  () => [props.modelValue, props.networkCode] as const,
  ([vis]) => {
    if (vis) {
      formData.value = makeInitialData(schema.value)
    }
  },
  { immediate: true }
)

function renderLabel(field: FieldDef) {
  return field.label
}

function addKV(key: string) {
  if (!Array.isArray(formData.value[key])) formData.value[key] = []
  formData.value[key].push({ key: '', value: '' })
}

function removeKV(key: string, idx: number) {
  formData.value[key].splice(idx, 1)
}

function generatePubKey() {
  // 模拟生成 RSA 公钥（MVP：随机字符串）
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
  } catch (e) {
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
  // 先校验
  const requiredKey = validateRequired(schema.value, formData.value)
  if (requiredKey) {
    ElMessage.warning('请填写必填项')
    return
  }
  // 触发 el-form 校验
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    // 组装 payload
    const credentials: Record<string, any> = {}
    for (const f of schema.value) {
      if (formData.value[f.key] !== undefined) {
        credentials[f.key] = formData.value[f.key]
      }
    }
    const payload = {
      networkDefId: props.networkId,
      appId: null,
      accountName: formData.value.accountName || '默认账号',
      credentials,
      status: 1,
    }
    const res: any = await request.post('/api/v1/console/network/account/create', payload)
    if (res?.code === 0) {
      ElMessage.success('账号添加成功')
      emit('success', res.data)
      emit('update:modelValue', false)
    } else {
      ElMessage.error(res?.message || '添加失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '添加失败')
  } finally {
    submitting.value = false
  }
}
</script>
