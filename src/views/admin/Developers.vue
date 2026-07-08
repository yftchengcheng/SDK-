<template>
  <div class="page-shell">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="page-header-titles">
          <h1 class="page-header-title">开发者管理</h1>
          <p class="page-header-subtitle">超级管理员视图 · 管理系统所有开发者账号、角色与启用状态</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
      </div>
    </div>

    <div class="page-filter">
      <el-form :inline="true" class="page-filter-form" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="query.q"
            placeholder="邮箱 / 公司 / 联系人"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="query.role" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
            <el-option label="管理员" value="admin" />
            <el-option label="开发者" value="developer" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px" @change="handleSearch">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-filter-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="page-card">
      <div class="page-table-wrap">
        <el-table :data="tableData" v-loading="loading" stripe>
          <el-table-column prop="developerId" label="ID" min-width="120">
            <template #default="{ row }">
              <span class="cell-secondary">{{ row.developerId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="180" />
          <el-table-column prop="company" label="公司" min-width="140">
            <template #default="{ row }">
              <span v-if="row.company">{{ row.company }}</span>
              <span v-else class="cell-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="contactName" label="联系人" min-width="100">
            <template #default="{ row }">
              <span v-if="row.contactName">{{ row.contactName }}</span>
              <span v-else class="cell-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <span class="status-tag" :class="row.role === 'admin' ? 'status-tag--warning' : 'status-tag--neutral'">
                {{ row.role === 'admin' ? '管理员' : '开发者' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span class="status-tag" :class="row.status === 1 ? 'status-tag--active' : 'status-tag--paused'">
                {{ row.status === 1 ? '启用' : '停用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="注册时间" min-width="170">
            <template #default="{ row }">
              <span class="cell-secondary">{{ formatDate(row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <div class="cell-actions">
                <el-button link type="primary" :icon="Edit" @click="openRoleDialog(row)">改角色</el-button>
                <el-button
                  link
                  :type="row.status === 1 ? 'danger' : 'primary'"
                  :icon="row.status === 1 ? CircleClose : CircleCheck"
                  @click="toggleStatus(row)"
                >
                  {{ row.status === 1 ? '停用' : '启用' }}
                </el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无开发者" />
          </template>
        </el-table>
      </div>
      <div class="page-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          small
          background
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <!-- 修改角色 -->
    <el-dialog v-model="roleDialogVisible" title="修改角色" width="480px" :close-on-click-modal="false" destroy-on-close>
      <div v-if="currentRow" class="dialog-section">
        <div class="dialog-section-title">
          <el-icon><User /></el-icon>
          <span>目标账号</span>
          <span class="dialog-section-tag">{{ currentRow.email }}</span>
        </div>
        <div class="dialog-info-list">
          <div class="info-item">
            <span class="info-item-label">邮箱</span>
            <span class="info-item-value">{{ currentRow.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-item-label">公司</span>
            <span class="info-item-value">{{ currentRow.company || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-item-label">当前角色</span>
            <span class="info-item-value">
              <span class="status-tag" :class="currentRow.role === 'admin' ? 'status-tag--warning' : 'status-tag--neutral'">
                {{ currentRow.role === 'admin' ? '管理员' : '开发者' }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-item-label">当前状态</span>
            <span class="info-item-value">
              <span class="status-tag" :class="currentRow.status === 1 ? 'status-tag--active' : 'status-tag--paused'">
                {{ currentRow.status === 1 ? '启用' : '停用' }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="currentRow" class="dialog-section">
        <div class="dialog-section-title">
          <el-icon><Switch /></el-icon>
          <span>新角色</span>
        </div>
        <div class="dialog-form-row dialog-form-row--full">
          <el-radio-group v-model="newRole">
            <el-radio value="developer">开发者</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
          <div v-if="wouldLockSelf" class="dialog-form-warn">
            <el-icon><WarningFilled /></el-icon>
            <span>不能把自己降级为开发者，避免锁死超级管理员</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canSubmit" :loading="submitting" @click="submitRole">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, RefreshLeft, Edit, User, UserFilled,
  WarningFilled, Switch, CircleCheck, CircleClose,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const userStore = useUserStore()

interface Developer {
  developerId: string
  email: string
  company: string | null
  contactName: string | null
  phone: string | null
  role: 'developer' | 'admin'
  status: 1 | 2
  accessType: number | null
  createdAt: string
  updatedAt: string | null
}

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<Developer[]>([])
const total = ref(0)
const query = reactive({ q: '', role: '' as '' | 'admin' | 'developer', status: '' as '' | 1 | 2, page: 1, pageSize: 20 })

const roleDialogVisible = ref(false)
const currentRow = ref<Developer | null>(null)
const newRole = ref<'developer' | 'admin'>('developer')

const isSelf = computed(() => currentRow.value?.developerId === userStore.userInfo?.id)
const wouldLockSelf = computed(() => isSelf.value && newRole.value === 'developer')
const canSubmit = computed(() => !!currentRow.value && !wouldLockSelf.value && newRole.value !== currentRow.value.role)

function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

async function loadList() {
  loading.value = true
  try {
    const params: Record<string, string | number> = { page: query.page, pageSize: query.pageSize }
    if (query.q) params.q = query.q
    if (query.role) params.role = query.role
    if (query.status !== '') params.status = query.status
    const res: any = await request.get('/api/v1/console/admin/developers', { params })
    tableData.value = res?.data?.list || []
    total.value = res?.data?.total || 0
  } catch (e) {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadList()
}

function handleReset() {
  query.q = ''
  query.role = ''
  query.status = ''
  query.page = 1
  loadList()
}

function openRoleDialog(row: Developer) {
  currentRow.value = row
  newRole.value = row.role
  roleDialogVisible.value = true
}

async function submitRole() {
  if (!currentRow.value || !canSubmit.value) return
  submitting.value = true
  try {
    await request.patch(`/api/v1/console/admin/developers/${currentRow.value.developerId}/role`, { role: newRole.value })
    ElMessage.success(`已修改 ${currentRow.value.email} 角色为 ${newRole.value}`)
    roleDialogVisible.value = false
    loadList()
  } catch (e) {
    // request.ts 已统一提示
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row: Developer) {
  const action = row.status === 1 ? '停用' : '启用'
  const nextStatus = row.status === 1 ? 2 : 1
  try {
    await ElMessageBox.confirm(
      `确认${action}开发者「${row.email}」？${action === '停用' ? '该用户将无法登录' : ''}`,
      `${action}确认`,
      { type: 'warning', confirmButtonText: `确认${action}`, cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await request.patch(`/api/v1/console/admin/developers/${row.developerId}/status`, { status: nextStatus })
    ElMessage.success(`已${action}`)
    loadList()
  } catch (e) {
    // 已统一提示
  }
}

onMounted(() => {
  loadList()
})
</script>

