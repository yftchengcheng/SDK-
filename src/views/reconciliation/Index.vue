<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import { Download, Search, Refresh, UploadFilled, View, Document, InfoFilled } from '@element-plus/icons-vue'
import http from '@/utils/request'

interface ReconciliationRecord {
  id: string
  developerId: string
  statDate: string
  appKey: string
  networkCode: string
  sdkImpressions: number
  apiImpressions: number
  sdkRevenue: number
  apiRevenue: number
  impressionDiff: number
  revenueDiff: number
  diffRate: number
  status: 'pending' | 'matched' | 'disputed' | 'resolved'
  remark?: string
  createdAt: string
}

const loading = ref(false)
const list = ref<ReconciliationRecord[]>([])
const detailVisible = ref(false)
const detailRecord = ref<ReconciliationRecord | null>(null)

// 导入对话框
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importForm = reactive({
  file: null as File | null,
  fileName: '',
  networkCode: '',
})
const uploadRef = ref()

// 查询
const query = reactive({
  statDate: ['', ''] as [string, string],
  appKey: '',
  status: '' as '' | 'pending' | 'matched' | 'disputed' | 'resolved',
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待对账' },
  { value: 'matched', label: '已对账' },
  { value: 'disputed', label: '有差异' },
  { value: 'resolved', label: '已处理' },
]

const totalRevenue = computed(() => list.value.reduce((s, r) => s + Number(r.sdkRevenue || 0), 0))
const totalImpressions = computed(() => list.value.reduce((s, r) => s + Number(r.sdkImpressions || 0), 0))
const totalDiffCount = computed(() => list.value.filter((r) => r.status === 'disputed').length)
const totalDiffAmount = computed(() =>
  list.value.filter((r) => r.status === 'disputed').reduce((s, r) => s + Math.abs(Number(r.revenueDiff || 0)), 0)
)

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (query.appKey) params.appKey = query.appKey
    if (query.status) params.status = query.status
    if (query.statDate[0]) params.start = query.statDate[0]
    if (query.statDate[1]) params.end = query.statDate[1]
    const res: any = await http.get('/api/v1/console/reconciliation/list', { params })
    list.value = res.data?.list || []
  } catch (err) {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  try {
    const params: Record<string, string> = {}
    if (query.appKey) params.appKey = query.appKey
    if (query.status) params.status = query.status
    if (query.statDate[0]) params.start = query.statDate[0]
    if (query.statDate[1]) params.end = query.statDate[1]
    const blob = await http.get('/api/v1/console/reconciliation/export', {
      params,
      responseType: 'blob',
    } as Record<string, unknown>)
    const url = URL.createObjectURL(new Blob([blob as BlobPart]))
    const a = document.createElement('a')
    a.href = url
    a.download = `对账明细-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('已导出 CSV')
  } catch {
    ElMessage.error('导出失败')
  }
}

function handleImportClick() {
  importForm.file = null
  importForm.fileName = ''
  importForm.networkCode = ''
  importDialogVisible.value = true
}

function onFileChange(file: UploadFile) {
  importForm.file = (file.raw as File) || null
  importForm.fileName = file.name || ''
}

async function handleImportSubmit() {
  if (!importForm.file) {
    ElMessage.warning('请选择对账文件')
    return
  }
  importLoading.value = true
  try {
    const text = await importForm.file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) {
      ElMessage.error('文件格式错误：至少需要表头+1 行数据')
      return
    }
    const headers = lines[0].split(',').map((h) => h.trim())
    const expected = ['report_date', 'app_key', 'network_code', 'impressions', 'revenue']
    const missing = expected.filter((e) => !headers.includes(e))
    if (missing.length) {
      ElMessage.error(`缺少必要列：${missing.join(', ')}`)
      return
    }
    const idx = (k: string) => headers.indexOf(k)
    const records: Record<string, unknown>[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim())
      if (cols.length < headers.length) continue
      records.push({
        stat_date: cols[idx('report_date')],
        app_key: cols[idx('app_key')],
        network_code: cols[idx('network_code')] || importForm.networkCode,
        api_impressions: Number(cols[idx('impressions')]) || 0,
        api_revenue: Number(cols[idx('revenue')]) || 0,
      })
    }
    const res = await http.post('/api/v1/console/reconciliation/import', { records })
    ElMessage.success(`导入完成：成功 ${res.data?.success || records.length} 条，失败 ${res.data?.failed || 0} 条`)
    importDialogVisible.value = false
    fetchList()
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

async function handleResolve(row: ReconciliationRecord) {
  try {
    await ElMessageBox.confirm(`确认将差异记录标记为已处理？`, '提示', { type: 'warning' })
    await http.post('/api/v1/console/reconciliation/resolve', {
      appKey: row.appKey,
      placementId: row.placementId,
      networkDefId: row.networkDefId,
      statDate: row.statDate,
      comment: '已处理差异',
    })
    ElMessage.success('已标记为已处理')
    fetchList()
  } catch {
    // cancelled
  }
}

function showDetail(row: ReconciliationRecord) {
  detailRecord.value = row
  detailVisible.value = true
}

function statusLabel(s: ReconciliationRecord['status']) {
  return statusOptions.find((o) => o.value === s)?.label || s
}

async function onExport() {
  try {
    const blob = await http.post('/api/v1/console/reconciliation/export', { ...query }, { responseType: 'blob' })
    const url = window.URL.createObjectURL(blob as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `对账数据-${Date.now()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err.message || '导出失败')
  }
}

async function onRefresh() {
  await fetchList()
  ElMessage.success('已刷新')
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">对账管理</h1>
          <p class="page-header-subtitle">对比 SDK 上报与广告网络 API 数据，及时发现差异与异常</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Download" @click="onExport">导出对账单</el-button>
        <el-button :icon="UploadFilled" @click="importDialogVisible = true">导入数据</el-button>
        <el-button :icon="Refresh" @click="onRefresh">刷新</el-button>
      </div>
    </div>

    <div class="page-section-card">
      <div class="page-stat-row">
        <div class="page-stat-card">
          <div class="page-stat-label">总展示量</div>
          <div class="page-stat-value">{{ totalImpressions.toLocaleString() }}</div>
        </div>
        <div class="page-stat-card">
          <div class="page-stat-label">总收益 (¥)</div>
          <div class="page-stat-value">{{ totalRevenue.toFixed(2) }}</div>
        </div>
        <div class="page-stat-card">
          <div class="page-stat-label">差异记录数</div>
          <div class="page-stat-value" style="color: var(--color-primary-600)">{{ totalDiffCount }}</div>
        </div>
        <div class="page-stat-card">
          <div class="page-stat-label">差异金额 (¥)</div>
          <div class="page-stat-value" style="color: var(--color-error)">{{ totalDiffAmount.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <div class="page-section-card">
      <div class="page-card"><div class="page-filter"><div class="page-filter-form" style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;flex:1">
          <el-date-picker
            v-model="query.statDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="default"
            style="width: 240px"
          />
          <el-input
            v-model="query.appKey"
            placeholder="应用 Key"
            clearable
            size="default"
            style="width: 180px"
          />
          <el-select v-model="query.status" placeholder="状态" size="default" style="width: 130px" clearable>
            <el-option v-for="o in statusOptions.filter((s) => s.value)" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
          <el-button :icon="Refresh" @click="fetchList">刷新</el-button>
        </div>
        </div><div class="page-filter-actions">
          <el-button :icon="UploadFilled" @click="handleImportClick">导入对账</el-button>
          <el-button type="primary" :icon="Download" @click="handleExport">导出 CSV</el-button>
        </div>
      </div>

      </div></div><div class="page-table-wrap"></div><div class="page-card"><div class="page-table-wrap"><el-table v-loading="loading" :data="list" border stripe size="default">
        <el-table-column prop="statDate" label="日期" width="110" />
        <el-table-column prop="appKey" label="应用" width="120" />
        <el-table-column prop="networkCode" label="广告网络" width="120" />
        <el-table-column label="SDK 展示" width="120" align="right">
          <template #default="{ row }">{{ Number(row.sdkImpressions).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="API 展示" width="120" align="right">
          <template #default="{ row }">{{ Number(row.apiImpressions).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="展示差异" width="100" align="right">
          <template #default="{ row }">
            <span :class="row.impressionDiff !== 0 ? 'diff-cell' : ''">{{ row.impressionDiff }}</span>
          </template>
        </el-table-column>
        <el-table-column label="SDK 收益" width="120" align="right">
          <template #default="{ row }">¥ {{ Number(row.sdkRevenue).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="API 收益" width="120" align="right">
          <template #default="{ row }">¥ {{ Number(row.apiRevenue).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="收益差异" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.revenueDiff !== 0 ? 'diff-cell' : ''">¥ {{ Number(row.revenueDiff).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span class="status-tag" :class="`status-tag--${row.status}`">{{ statusLabel(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :icon="View" @click="showDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'disputed'"
              link
              type="success"
              size="small"
              @click="handleResolve(row)"
            >处理</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无对账数据，请先点击「导入对账」上传第三方对账文件" />
        </template>
      </el-table>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="对账详情" width="640px">
      <div v-if="detailRecord" class="dialog-section">
        <div class="dialog-section-title">基础信息</div>
        <div class="dialog-info-list">
          <div class="info-item"><span class="info-item-label">日期</span><span class="info-item-value">{{ detailRecord.statDate }}</span></div>
          <div class="info-item"><span class="info-item-label">应用</span><span class="info-item-value">{{ detailRecord.appKey }}</span></div>
          <div class="info-item"><span class="info-item-label">广告网络</span><span class="info-item-value">{{ detailRecord.networkCode }}</span></div>
          <div class="info-item"><span class="info-item-label">状态</span><span class="info-item-value">{{ statusLabel(detailRecord.status) }}</span></div>
        </div>
      </div>
      <div v-if="detailRecord" class="dialog-section">
        <div class="dialog-section-title">数据指标</div>
        <div class="dialog-info-list">
          <div class="info-item"><span class="info-item-label">SDK 展示</span><span class="info-item-value">{{ Number(detailRecord.sdkImpressions).toLocaleString() }}</span></div>
          <div class="info-item"><span class="info-item-label">API 展示</span><span class="info-item-value">{{ Number(detailRecord.apiImpressions).toLocaleString() }}</span></div>
          <div class="info-item"><span class="info-item-label">SDK 收益</span><span class="info-item-value">¥ {{ Number(detailRecord.sdkRevenue).toFixed(2) }}</span></div>
          <div class="info-item"><span class="info-item-label">API 收益</span><span class="info-item-value">¥ {{ Number(detailRecord.apiRevenue).toFixed(2) }}</span></div>
        </div>
      </div>
      <div v-if="detailRecord" class="dialog-section">
        <div class="dialog-section-title">差异分析</div>
        <div class="dialog-info-list">
          <div class="info-item"><span class="info-item-label">展示差异</span><span class="info-item-value">{{ detailRecord.impressionDiff }}</span></div>
          <div class="info-item"><span class="info-item-label">收益差异</span><span class="info-item-value">¥ {{ Number(detailRecord.revenueDiff).toFixed(2) }}</span></div>
          <div class="info-item"><span class="info-item-label">差异率</span><span class="info-item-value">{{ (Number(detailRecord.diffRate) * 100).toFixed(2) }}%</span></div>
        </div>
      </div>
      <div v-if="detailRecord" class="dialog-section">
        <div class="dialog-section-title">备注</div>
        <div style="padding: 12px 16px; font-size: 13px; color: var(--color-slate-700); line-height: 1.6;">{{ detailRecord.remark || '-' }}</div>
      </div>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入对账数据" width="560px">
      <el-form label-position="top">
        <div class="dialog-section">
          <div class="dialog-section-title">网络与文件</div>
          <div class="dialog-form-row dialog-form-row--full">
            <el-form-item label="广告网络">
              <el-input v-model="importForm.networkCode" placeholder="选填，CSV 中无 network_code 列时使用" />
              <div class="dialog-form-help">不填时 CSV 每行必须包含 network_code 列</div>
            </el-form-item>
          </div>
          <div class="dialog-form-row dialog-form-row--full" style="padding-top: 0;">
            <el-form-item label="对账文件" required>
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :show-file-list="true"
                :limit="1"
                accept=".csv"
                :on-change="onFileChange"
              >
                <el-button :icon="UploadFilled" type="primary" plain>选择 CSV 文件</el-button>
                <template #tip>
                  <div class="dialog-form-info" style="margin-top: 8px;">
                    <el-icon><InfoFilled /></el-icon>
                    <span>必填列：report_date, app_key, network_code, impressions, revenue</span>
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </div>
          <div v-if="importForm.fileName" class="dialog-form-row dialog-form-row--full" style="padding-top: 0;">
            <el-form-item label="已选择">
              <span class="cell-muted">{{ importForm.fileName }}</span>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportSubmit">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>
