<script setup lang="ts">
import { computed } from 'vue'
import { getSchemaByNetwork, type FieldDef } from './network-field-schemas'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  /** 单条 binding 记录（含 network_name/code/type + extra_params） */
  binding: BoundNetworkItem | null
}
interface Emits {
  (e: 'update:modelValue', v: boolean): void
}

interface BoundNetworkItem {
  id: number
  network_def_id: number
  network_name?: string
  network_code?: string
  network_type?: number
  is_preset?: boolean
  network_app_id?: string
  account_id?: number | null
  account_name?: string
  extra_params?: {
    app_dim_params?: Record<string, string>
    credentials?: Record<string, unknown>
  } | null
  created_at?: string
  status?: number
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const schema = computed<FieldDef[]>(() => {
  if (!props.binding) return []
  return getSchemaByNetwork({
    network_code: props.binding.network_code,
    is_preset: props.binding.is_preset,
  })
})

const isCustom = computed(() => props.binding?.is_preset === false)

/** 字段值：优先 credentials，再 fallback customParams */
const fieldValue = (key: string): unknown => {
  const ep = props.binding?.extra_params
  if (!ep) return ''
  if (ep.credentials && key in ep.credentials) return ep.credentials[key]
  return ''
}

/** 自定义网络：app_dim_params 是 { [key]: value } 对象，转成 [{key,value}] 列表 */
const appDimParams = computed<Array<{ key: string; value: string }>>(() => {
  const m = props.binding?.extra_params?.app_dim_params
  if (!m || typeof m !== 'object') return []
  return Object.entries(m).map(([k, v]) => ({ key: k, value: String(v ?? '') }))
})

/** 字段类型为 switch 时显示"是"/"否" */
const switchText = (key: string): string => {
  const v = fieldValue(key)
  if (v === true || v === 1) return '是'
  if (v === false || v === 0) return '否'
  return String(v ?? '—')
}

/** select 选项找 label */
const selectText = (field: FieldDef): string => {
  const v = fieldValue(field.key)
  if (v === undefined || v === null || v === '') return '—'
  const opt = field.options?.find((o) => o.value === v)
  return opt?.label ?? String(v)
}

/** K-V 多对（custom 网络） */
const kvList = computed(() => {
  return appDimParams.value
})

/** status 文案 */
const statusText = computed(() => {
  const s = props.binding?.status
  if (s === 1) return '已启用'
  if (s === 0) return '已停用'
  return '—'
})

/** 复制账号ID/账号名称到剪贴板 */
const copyAccountId = async () => {
  const v = isCustom.value ? props.binding?.account_name : props.binding?.network_app_id
  if (!v) return
  try {
    await navigator.clipboard.writeText(v)
    ElMessage.success(isCustom.value ? '账号名称已复制' : '账号ID 已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择')
  }
}

/** 把后端可能的值规整成显示字符串 */
const display = (key: string): string => {
  const v = fieldValue(key)
  if (v === undefined || v === null || v === '') return '—'
  if (typeof v === 'boolean') return v ? '是' : '否'
  return String(v)
}

/** 主动关闭：emit 由父组件处理 v-model */
const close = () => emit('update:modelValue', false)
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    size="520"
    :with-header="false"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div v-if="binding" class="vnd-root">
      <header class="vnd-header">
        <div class="vnd-header-inner">
          <div class="vnd-title-row">
            <h2 class="vnd-title">广告平台配置详情</h2>
            <button class="vnd-close" @click="close" aria-label="关闭">×</button>
          </div>
          <p class="vnd-subtitle">查看当前应用与该广告平台的关联配置（只读）</p>
        </div>
      </header>

      <div class="vnd-body">
        <!-- 基本信息卡 -->
        <section class="vnd-card">
          <header class="vnd-card-head">
            <div class="vnd-card-head-icon"><span class="dot">●</span></div>
            <h3 class="vnd-card-head-title">基本信息</h3>
            <span class="vnd-card-head-extra">网络元数据</span>
          </header>
          <div class="vnd-card-body vnd-info">
            <div class="vnd-info-row">
              <span class="vnd-info-label">广告平台</span>
              <div class="vnd-info-value">
                <span class="vnd-code-chip">{{ binding.network_code || '—' }}</span>
                <span class="vnd-info-name">{{ binding.network_name || '—' }}</span>
              </div>
            </div>
            <div class="vnd-info-row">
              <span class="vnd-info-label">网络类型</span>
              <div class="vnd-info-value">
                <span class="vnd-tag" :class="isCustom ? 'vnd-tag-custom' : 'vnd-tag-preset'">
                  {{ isCustom ? '自定义网络' : '预置网络' }}
                </span>
              </div>
            </div>
            <div class="vnd-info-row">
              <span class="vnd-info-label">{{ isCustom ? '账号名称' : '账号 ID' }}</span>
              <div class="vnd-info-value vnd-account">
                <code v-if="isCustom" class="vnd-account-id">{{ binding.account_name || '—' }}</code>
                <code v-else class="vnd-account-id">{{ binding.network_app_id || '—' }}</code>
                <button v-if="(isCustom && binding.account_name) || (!isCustom && binding.network_app_id)" class="vnd-copy-btn" @click="copyAccountId">复制</button>
              </div>
            </div>
            <div class="vnd-info-row">
              <span class="vnd-info-label">状态</span>
              <div class="vnd-info-value">
                <span class="vnd-tag" :class="binding.status === 1 ? 'vnd-tag-on' : 'vnd-tag-off'">
                  {{ statusText }}
                </span>
              </div>
            </div>
            <div class="vnd-info-row">
              <span class="vnd-info-label">关联时间</span>
              <div class="vnd-info-value vnd-mono">{{ binding.created_at || '—' }}</div>
            </div>
          </div>
        </section>

        <!-- 字段配置卡（自定义网络 K-V / 预置网络 schema 字段） -->
        <section class="vnd-card">
          <header class="vnd-card-head">
            <div class="vnd-card-head-icon"><span class="dot">●</span></div>
            <h3 class="vnd-card-head-title">账号与字段配置</h3>
            <span class="vnd-card-head-extra">只读</span>
          </header>
          <div class="vnd-card-body">
            <!-- 自定义网络：直接展示 K-V -->
            <div v-if="isCustom" class="vnd-kv-block">
              <div v-if="kvList.length === 0" class="vnd-empty">该自定义网络未配置应用维度参数</div>
              <div v-else class="vnd-kv-list">
                <div v-for="(item, idx) in kvList" :key="idx" class="vnd-kv-row">
                  <div class="vnd-kv-key">{{ item.key || '—' }}</div>
                  <div class="vnd-kv-eq">=</div>
                  <div class="vnd-kv-val">{{ item.value || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- 预置网络：按 schema 字段平铺 -->
            <div v-else class="vnd-fields">
              <div
                v-for="field in schema"
                :key="field.key"
                class="vnd-field"
              >
                <div class="vnd-field-label">
                  {{ field.label }}
                  <span v-if="field.required" class="vnd-required">*</span>
                </div>
                <div class="vnd-field-value">
                  <!-- 文本/密码 -->
                  <span
                    v-if="field.type === 'text' || field.type === 'password'"
                    class="vnd-text"
                  >{{ display(field.key) }}</span>

                  <!-- 开关 -->
                  <span
                    v-else-if="field.type === 'switch'"
                    class="vnd-switch-val"
                    :class="fieldValue(field.key) ? 'is-on' : 'is-off'"
                  >{{ switchText(field.key) }}</span>

                  <!-- select -->
                  <span
                    v-else-if="field.type === 'select'"
                    class="vnd-text"
                  >{{ selectText(field) }}</span>

                  <!-- 币种锁死 -->
                  <span
                    v-else-if="field.type === 'currency'"
                    class="vnd-currency"
                  >
                    <span class="vnd-currency-text">人民币 (CNY)</span>
                    <span class="vnd-currency-lock">🔒 不可修改</span>
                  </span>

                  <!-- pub-key（百度用） -->
                  <span
                    v-else-if="field.type === 'pub-key'"
                    class="vnd-text vnd-mono"
                  >{{ display(field.key) || '—' }}</span>

                  <!-- key-value（预置网络 schema 里没有，但防御） -->
                  <span v-else class="vnd-text">{{ display(field.key) }}</span>

                  <!-- 提示 hint（与绑定页一致） -->
                  <div v-if="field.hint" class="vnd-hint">
                    <span class="vnd-hint-icon">ⓘ</span>
                    <span class="vnd-hint-text">{{ field.hint }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 原始 JSON 折叠卡 -->
        <section class="vnd-card vnd-card-collapse">
          <details>
            <summary class="vnd-collapse-head">
              <span class="vnd-collapse-icon">▸</span>
              <span>查看原始配置 (extra_params)</span>
            </summary>
            <pre class="vnd-json">{{ JSON.stringify(binding.extra_params || {}, null, 2) }}</pre>
          </details>
        </section>
      </div>

      <footer class="vnd-footer">
        <button class="vnd-btn vnd-btn-ghost" @click="close">关闭</button>
      </footer>
    </div>
  </el-drawer>
</template>
