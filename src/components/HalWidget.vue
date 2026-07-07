<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { ChatDotRound, Service, Close, Position, ArrowDown, Plus, Headset, Promotion, Refresh, WarningFilled, CircleClose } from '@element-plus/icons-vue'
import request from '@/utils/request'

// ============ 状态 ============
type ViewState = 'collapsed' | 'hidden' | 'open'

const STORAGE_KEY = 'hal-widget-state-v1'
const POSITION_KEY = 'hal-widget-pos-v1'

const view = ref<ViewState>('collapsed')
const pos = reactive({ x: 0, y: 0 }) // 由 bottom/right 计算后的位置（px）
const dragging = ref(false)
const dragOffset = reactive({ x: 0, y: 0 })
const pulse = ref(false) // 首次 / 隐藏后重新出现时的高亮脉动

// 会话状态
interface HalSession {
  session_id: string
  title: string
  status: number
  message_count: number
  unresolved_count: number
  human_agent_id: string | null
  started_at: string
  last_message_at: string
}
interface HalMessage {
  message_id: string
  session_id: string
  role: 'user' | 'hal' | 'agent' | 'system'
  content: string
  created_at: string
}
interface HalConfig {
  llmEnabled: boolean
  slackEnabled: boolean
  features: { humanHandoff: boolean; ticketEscalation: boolean; unresolvedThreshold: number }
}

const config = ref<HalConfig | null>(null)
const sessions = ref<HalSession[]>([])
const currentSession = ref<HalSession | null>(null)
const messages = ref<HalMessage[]>([])
const inputMessage = ref('')
const sending = ref(false)
const agentJoined = ref(false)
const showTicketDialog = ref(false)
const showHistoryDialog = ref(false)
const ticketForm = reactive({
  title: '',
  description: '',
  priority: 2,
})

// ============ 派生 ============
const canEscalate = computed(() => {
  if (!config.value) return false
  return currentSession.value !== null &&
    currentSession.value.unresolved_count >= config.value.features.unresolvedThreshold
})

const unresolvedCount = computed(() => currentSession.value?.unresolved_count ?? 0)

// ============ 工具 ============
const defaultPos = () => {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  const w = window.innerWidth
  const h = window.innerHeight
  return { x: Math.max(16, w - 76), y: Math.max(16, h - 76) }
}

const defaultHiddenPos = () => {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  const w = window.innerWidth
  const h = window.innerHeight
  return { x: Math.max(4, w - 32), y: Math.max(4, Math.floor(h / 2) - 40) }
}

const clampPos = (x: number, y: number, isHidden: boolean) => {
  if (typeof window === 'undefined') return { x, y }
  const w = window.innerWidth
  const h = window.innerHeight
  const elW = isHidden ? 32 : 60
  const elH = isHidden ? 88 : 60
  return {
    x: Math.min(Math.max(4, x), Math.max(4, w - elW)),
    y: Math.min(Math.max(4, y), Math.max(4, h - elH)),
  }
}

const loadState = () => {
  if (typeof window === 'undefined') return
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s === 'open' || s === 'hidden' || s === 'collapsed') view.value = s as ViewState
    const p = localStorage.getItem(POSITION_KEY)
    if (p) {
      const parsed = JSON.parse(p) as { x: number; y: number }
      if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
        const clamped = clampPos(parsed.x, parsed.y, view.value === 'hidden')
        pos.x = clamped.x
        pos.y = clamped.y
        return
      }
    }
    if (view.value === 'hidden') {
      const d = defaultHiddenPos()
      pos.x = d.x
      pos.y = d.y
    } else {
      const d = defaultPos()
      pos.x = d.x
      pos.y = d.y
    }
  } catch {
    /* ignore */
  }
}

const saveState = () => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, view.value)
  localStorage.setItem(POSITION_KEY, JSON.stringify({ x: pos.x, y: pos.y }))
}

const onWindowResize = () => {
  if (typeof window === 'undefined') return
  const isHidden = view.value === 'hidden'
  const w = window.innerWidth
  const h = window.innerHeight
  const elW = isHidden ? 32 : 60
  const elH = isHidden ? 88 : 60
  pos.x = Math.min(Math.max(4, pos.x), Math.max(4, w - elW))
  pos.y = Math.min(Math.max(4, pos.y), Math.max(4, h - elH))
  saveState()
}

// ============ 拖拽 ============
const onDragStart = (e: MouseEvent) => {
  if (e.button !== 0) return
  e.preventDefault()
  dragging.value = true
  dragOffset.x = e.clientX - pos.x
  dragOffset.y = e.clientY - pos.y
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

const onDragMove = (e: MouseEvent) => {
  if (!dragging.value) return
  const w = window.innerWidth
  const h = window.innerHeight
  // 根据当前形态选用不同边距：隐藏态的边条 28x80，允许更贴近边缘
  const isHidden = view.value === 'hidden'
  const margin = isHidden ? 4 : 16
  const maxW = isHidden ? 32 : 76
  const maxH = isHidden ? 88 : 76
  pos.x = Math.min(Math.max(margin, e.clientX - dragOffset.x), w - maxW)
  pos.y = Math.min(Math.max(margin, e.clientY - dragOffset.y), h - maxH)
}

const onDragEnd = () => {
  dragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  saveState()
}

// ============ 会话操作 ============
const fetchConfig = async () => {
  try {
    const res = await request.get<{ code: number; data: HalConfig }>('/api/v1/hal/config')
    if (res.code === 0) config.value = res.data
  } catch {
    /* ignore */
  }
}

const fetchSessions = async () => {
  try {
    const res = await request.get<{ code: number; data: { list: HalSession[] } }>(
      '/api/v1/hal/session/list',
      { params: { pageSize: 20 } }
    )
    if (res.code === 0) sessions.value = res.data.list || []
  } catch {
    /* ignore */
  }
}

const startNewSession = async () => {
  try {
    const res = await request.post<{ code: number; data: HalSession }>(
      '/api/v1/hal/session/start',
      { title: inputMessage.value.slice(0, 30) || '新会话' }
    )
    if (res.code === 0) {
      currentSession.value = res.data
      messages.value = []
      sessions.value.unshift(res.data)
    } else {
      throw new Error('failed')
    }
  } catch {
    // 离线回退：本地会话 ID
    currentSession.value = {
      session_id: 'local-' + Date.now(),
      title: inputMessage.value.slice(0, 30) || '本地会话',
      status: 1,
      message_count: 0,
      unresolved_count: 0,
      human_agent_id: null,
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    }
    messages.value = []
  }
}

const loadSessionDetail = async (sid: string) => {
  try {
    const res = await request.get<{ code: number; data: { session: HalSession; messages: HalMessage[] } }>(
      '/api/v1/hal/session/detail',
      { params: { id: sid } }
    )
    if (res.code === 0) {
      currentSession.value = res.data.session
      messages.value = res.data.messages || []
    }
  } catch {
    currentSession.value = sessions.value.find(s => s.session_id === sid) ?? currentSession.value
    messages.value = []
  }
}

const sendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text || sending.value) return

  // 没有会话先建
  if (!currentSession.value) {
    await startNewSession()
  }
  const session = currentSession.value
  if (!session) return

  const userMsg: HalMessage = {
    message_id: 'tmp-' + Date.now(),
    session_id: session.session_id,
    role: 'user',
    content: text,
    created_at: new Date().toISOString(),
  }
  messages.value.push(userMsg)
  inputMessage.value = ''
  sending.value = true

  try {
    const res = await request.post<{ code: number; data: { reply: HalMessage; session: HalSession } }>(
      '/api/v1/hal/session/message',
      { sessionId: session.session_id, content: text }
    )
    if (res.code === 0) {
      const { reply, session: updated } = res.data
      messages.value.push(reply)
      currentSession.value = updated
      // 触发工单建议
      if (updated.unresolved_count >= (config.value?.features.unresolvedThreshold ?? 3) && updated.unresolved_count > 0) {
        ElNotification({
          title: '需要人工协助？',
          message: `已连续 ${updated.unresolved_count} 轮未解决你的问题，建议提交工单。`,
          type: 'warning',
          duration: 5000,
        })
      }
    }
  } catch {
    // 离线兜底
    messages.value.push({
      message_id: 'tmp-r-' + Date.now(),
      session_id: session.session_id,
      role: 'hal',
      content: '（当前网络异常，无法连接 HAL 服务，请稍后重试或点击下方「创建工单」联系我们。）',
      created_at: new Date().toISOString(),
    })
  } finally {
    sending.value = false
    nextTick(() => scrollToBottom())
  }
}

const scrollToBottom = () => {
  const el = document.querySelector('.hal-messages')
  if (el) el.scrollTop = el.scrollHeight
}

watch(messages, () => nextTick(scrollToBottom), { deep: true })

// ============ 人工介入 ============
const requestHumanAgent = () => {
  if (!currentSession.value) return
  agentJoined.value = true
  messages.value.push({
    message_id: 'sys-' + Date.now(),
    session_id: currentSession.value.session_id,
    role: 'system',
    content: '已为你接入 SDK 运营值班同学，运营同学将很快回复你。同时消息已同步到 #SDK 运营 频道。',
    created_at: new Date().toISOString(),
  })
  ElMessage.success('已通知 SDK 运营值班，消息已同步到 Slack')
}

// ============ 工单 ============
const openTicketDialog = () => {
  if (!currentSession.value) {
    ElMessage.warning('请先开始一段对话再创建工单')
    return
  }
  ticketForm.title = currentSession.value.title || 'HAL 会话升级'
  const recent = messages.value.slice(-6).map(m => `[${m.role}] ${m.content}`).join('\n')
  ticketForm.description = `来自 HAL 会话（${currentSession.value.session_id}）的对话内容：\n\n${recent}\n\n请协助处理。`
  showTicketDialog.value = true
}

const submitTicket = async () => {
  if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
    ElMessage.warning('请填写标题和描述')
    return
  }
  try {
    const res = await request.post<{ code: number; data: { ticket_id: string; slack_notified: boolean } }>(
      '/api/v1/hal/ticket/create',
      {
        sessionId: currentSession.value?.session_id,
        title: ticketForm.title,
        description: ticketForm.description,
        priority: ticketForm.priority,
      }
    )
    if (res.code === 0) {
      ElNotification({
        title: '工单已创建',
        message: res.data.slack_notified
          ? `工单 ${res.data.ticket_id} 已提交，#SDK 运营 已收到加急提醒。`
          : `工单 ${res.data.ticket_id} 已提交。`,
        type: 'success',
        duration: 5000,
      })
      showTicketDialog.value = false
    }
  } catch {
    ElMessage.error('创建工单失败，请稍后重试')
  }
}

// ============ UI 控制 ============
const openWidget = () => {
  view.value = 'open'
  saveState()
  fetchSessions()
  nextTick(scrollToBottom)
}

const hideToEdge = () => {
  // 收进侧边栏时，位置放在右侧边缘竖直居中（用户随后可自由拖动）
  if (typeof window !== 'undefined') {
    pos.value.x = Math.max(0, window.innerWidth - 32)
    pos.value.y = Math.max(0, window.innerHeight / 2 - 40)
  }
  view.value = 'hidden'
  saveState()
}

const expandFromEdge = () => {
  // 从边缘恢复：把浮标放回默认右下角（之前收进时 pos 已被推到右边缘）
  if (typeof window !== 'undefined') {
    const d = defaultPos()
    pos.x = d.x
    pos.y = d.y
  }
  view.value = 'collapsed'
  saveState()
  pulse.value = true
  setTimeout(() => { pulse.value = false }, 4000)
}

const toggleClose = () => {
  view.value = 'collapsed'
  saveState()
}

const widgetStyle = computed(() => {
  if (view.value === 'hidden') {
    // 收进侧边栏：使用 pos 让用户可自由拖动，初始收起到右侧边缘
    return {
      right: 'auto',
      bottom: 'auto',
      transform: 'none',
      left: `${pos.value.x}px`,
      top: `${pos.value.y}px`,
    }
  }
  return {
    right: 'auto',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    transform: 'none',
  }
})

const panelStyle = computed(() => {
  const w = 380
  const h = 540
  const margin = 16
  let left = pos.x + 60
  let top = pos.y
  if (typeof window !== 'undefined') {
    if (left + w + margin > window.innerWidth) left = pos.x - w - 12
    if (left < margin) left = margin
    if (top + h + margin > window.innerHeight) top = window.innerHeight - h - margin
    if (top < margin) top = margin
  }
  return { left: `${left}px`, top: `${top}px` }
})

// ============ 生命周期 ============
onMounted(() => {
  loadState()
  fetchConfig()
  window.addEventListener('resize', onWindowResize)
  // 进入页面后先脉动两轮提示位置；用户拖拽 / 点击后会停止
  pulse.value = true
  setTimeout(() => { pulse.value = false }, 5200)
})
</script>

<template>
  <!-- 折叠态：悬浮按钮 -->
  <div
    v-if="view === 'collapsed'"
    class="hal-fab"
    :class="{ 'is-dragging': dragging, 'hal-fab--pulse': pulse && !dragging }"
    :style="widgetStyle"
    @mousedown="onDragStart"
    @click="!dragging && openWidget()"
    role="button"
    aria-label="智能客服 HAL"
  >
    <el-badge v-if="unresolvedCount > 0" :value="unresolvedCount" :max="9" class="hal-fab-badge">
      <div class="hal-fab-icon">
        <el-icon :size="22"><Service /></el-icon>
      </div>
    </el-badge>
    <div v-else class="hal-fab-icon">
      <el-icon :size="22"><Service /></el-icon>
    </div>
    <div class="hal-fab-hint">HAL · 拖我 / 点我问</div>
  </div>

  <!-- 隐藏态：右侧边缘竖条 -->
  <div
    v-else-if="view === 'hidden'"
    class="hal-edge"
    :class="{ 'is-dragging': dragging, 'hal-edge--pulse': pulse && !dragging }"
    :style="widgetStyle"
    @mousedown="onDragStart"
    @click="!dragging && expandFromEdge()"
    role="button"
    aria-label="展开 HAL"
    title="拖动 / 点击展开 HAL"
  >
    <span class="hal-edge-grip" aria-hidden="true">
      <span></span><span></span><span></span>
    </span>
    <el-icon :size="14"><ChatDotRound /></el-icon>
    <span class="hal-edge-label">HAL</span>
  </div>

  <!-- 打开态：聊天面板 -->
  <template v-else>
    <div
      class="hal-fab hal-fab--mini"
      :class="{ 'is-dragging': dragging }"
      :style="widgetStyle"
      @mousedown="onDragStart"
    >
      <div class="hal-fab-icon hal-fab-icon--mini">
        <el-icon :size="18"><Service /></el-icon>
      </div>
    </div>

    <div class="hal-panel" :style="panelStyle" @mousedown.stop>
      <div class="hal-panel-header">
        <div class="hal-panel-title">
          <div class="hal-avatar">
            <el-icon :size="18"><Service /></el-icon>
          </div>
          <div class="hal-title-text">
            <div class="hal-title-name">HAL 智能客服</div>
            <div class="hal-title-sub">
              <span class="hal-status-dot" :class="{ 'is-online': config?.llmEnabled, 'is-human': agentJoined }"></span>
              <span v-if="agentJoined">人工值班已接入</span>
              <span v-else-if="config?.llmEnabled">在线 · 7x24</span>
              <span v-else>本地兜底模式</span>
            </div>
          </div>
        </div>
        <div class="hal-panel-actions">
          <el-tooltip content="历史会话" placement="bottom">
            <el-button text size="small" @click="showHistoryDialog = true">
              <el-icon :size="14"><ArrowDown /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="最小化到角落" placement="bottom">
            <el-button text size="small" @click="toggleClose">
              <el-icon :size="14"><Position /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="隐藏到侧边栏" placement="bottom">
            <el-button text size="small" @click="hideToEdge">
              <el-icon :size="14"><CircleClose /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="hal-messages">
        <template v-if="messages.length === 0">
          <div class="hal-welcome">
            <div class="hal-welcome-icon">
              <el-icon :size="32"><Service /></el-icon>
            </div>
            <div class="hal-welcome-title">你好，我是 HAL</div>
            <div class="hal-welcome-desc">
              关于 SDK 接入、Adapter 对接、广告位配置、流量分组、报表、<br/>
              对账等任何问题都可以问我。
            </div>
            <div class="hal-welcome-suggest">
              <div class="hal-suggest-title">试试这些问题：</div>
              <div class="hal-suggest-list">
                <div class="hal-suggest-item" @click="inputMessage = '如何上传自定义 Adapter？'">如何上传自定义 Adapter？</div>
                <div class="hal-suggest-item" @click="inputMessage = '瀑布流配置如何调整顺序？'">瀑布流配置如何调整顺序？</div>
                <div class="hal-suggest-item" @click="inputMessage = '为什么我的广告填充率低？'">为什么我的广告填充率低？</div>
                <div class="hal-suggest-item" @click="inputMessage = '如何查看对账数据？'">如何查看对账数据？</div>
              </div>
            </div>
          </div>
        </template>

        <div
          v-for="m in messages"
          :key="m.message_id"
          class="hal-msg"
          :class="['hal-msg--' + m.role]"
        >
          <div v-if="m.role !== 'user' && m.role !== 'system'" class="hal-msg-avatar">
            <el-icon :size="14">
              <Headset v-if="m.role === 'agent'" />
              <Service v-else />
            </el-icon>
          </div>
          <div class="hal-msg-bubble">{{ m.content }}</div>
        </div>

        <div v-if="sending" class="hal-msg hal-msg--hal hal-msg--typing">
          <div class="hal-msg-avatar"><el-icon :size="14"><Service /></el-icon></div>
          <div class="hal-msg-bubble">
            <span class="hal-typing-dot"></span>
            <span class="hal-typing-dot"></span>
            <span class="hal-typing-dot"></span>
          </div>
        </div>

        <div v-if="canEscalate" class="hal-escalate-hint">
          <el-icon :size="12"><WarningFilled /></el-icon>
          已连续 {{ unresolvedCount }} 轮未解决，建议创建工单让 SDK 运营值班同学帮你处理。
        </div>
      </div>

      <div class="hal-quick-actions">
        <el-button
          v-if="!agentJoined"
          size="small"
          plain
          :icon="Headset"
          @click="requestHumanAgent"
          :disabled="!currentSession"
        >
          转人工
        </el-button>
        <el-button
          size="small"
          type="primary"
          plain
          :icon="Promotion"
          @click="openTicketDialog"
          :disabled="!currentSession"
        >
          创建工单
        </el-button>
        <el-button
          v-if="canEscalate"
          size="small"
          type="warning"
          plain
          :icon="WarningFilled"
          @click="openTicketDialog"
        >
          加急工单
        </el-button>
      </div>

      <div class="hal-input">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="2"
          placeholder="输入你的问题，Shift+Enter 换行，Enter 发送"
          :disabled="sending"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <el-button
          type="primary"
          :icon="Promotion"
          :loading="sending"
          :disabled="!inputMessage.trim()"
          @click="sendMessage"
        >
          发送
        </el-button>
      </div>

      <div class="hal-footer">
        HAL · 消息将同步到 <span class="hal-footer-channel">#SDK 运营</span>
      </div>
    </div>
  </template>

  <!-- 历史会话弹窗 -->
  <el-dialog v-model="showHistoryDialog" title="历史会话" width="520px" :show-close="true">
    <div v-if="sessions.length === 0" class="hal-history-empty">
      <el-icon :size="32"><ChatDotRound /></el-icon>
      <div>暂无历史会话</div>
    </div>
    <div v-else class="hal-history-list">
      <div
        v-for="s in sessions"
        :key="s.session_id"
        class="hal-history-item"
        @click="loadSessionDetail(s.session_id); showHistoryDialog = false"
      >
        <div class="hal-history-title">{{ s.title || '未命名会话' }}</div>
        <div class="hal-history-meta">
          <span>{{ s.message_count }} 条消息</span>
          <span>{{ s.last_message_at?.slice(0, 16).replace('T', ' ') }}</span>
        </div>
      </div>
    </div>
  </el-dialog>

  <!-- 工单创建弹窗 -->
  <el-dialog v-model="showTicketDialog" title="提交工单" width="520px" :show-close="true">
    <el-form :model="ticketForm" label-width="80px" label-position="top">
      <el-form-item label="标题" required>
        <el-input v-model="ticketForm.title" placeholder="一句话描述你的问题" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="描述" required>
        <el-input
          v-model="ticketForm.description"
          type="textarea"
          :rows="6"
          placeholder="详细描述问题，最好附带复现步骤、错误信息、相关 ID 等"
        />
      </el-form-item>
      <el-form-item label="优先级">
        <el-radio-group v-model="ticketForm.priority">
          <el-radio :value="1">低</el-radio>
          <el-radio :value="2">中</el-radio>
          <el-radio :value="3" :disabled="!canEscalate">高（加急，需连续 {{ config?.features.unresolvedThreshold }} 轮未解决）</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showTicketDialog = false">取消</el-button>
      <el-button type="primary" @click="submitTicket" :icon="Promotion">提交工单</el-button>
    </template>
  </el-dialog>
</template>
