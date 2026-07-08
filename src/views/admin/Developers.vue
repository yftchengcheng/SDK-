<template>
  <div class="page-admin-developers page-container">
    <div class="page-header">
      <h1>开发者管理</h1>
      <span class="page-header-hint">超级管理员视图 · 当前共 {{ total }} 位开发者</span>
    </div>

    <!-- 筛选条 -->
    <div class="filter-bar">
      <el-input
        v-model="query.q"
        placeholder="搜索邮箱/公司/联系人"
        clearable
        class="filter-input"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="query.role" placeholder="角色" clearable @change="handleSearch" class="filter-select">
        <el-option label="全部" value="" />
        <el-option label="管理员 (admin)" value="admin" />
        <el-option label="开发者 (developer)" value="developer" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable @change="handleSearch" class="filter-select">
        <el-option label="全部" value="" />
        <el-option label="启用" :value="1" />
        <el-option label="停用" :value="2" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="developerId" label="ID" min-width="120">
          <template #default="{ row }">
            <span class="text-secondary">{{ row.developerId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="company" label="公司" min-width="140" />
        <el-table-column prop="contactName" label="联系人" min-width="100" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'admin'" type="warning" size="small">管理员</el-tag>
            <el-tag v-else type="info" size="small">开发者</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success" size="small">启用</el-tag>
            <el-tag v-else type="danger" size="small">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" min-width="170">
          <template #default="{ row }">
            <span class="text-secondary">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openRoleDialog(row)">改角色</el-button>
            <el-button link :type="row.status === 1 ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无开发者" />
        </template>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <!-- 改角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="修改角色" width="420px" :close-on-click-modal="false">
      <div v-if="currentRow" class="role-dialog-body">
        <div class="role-dialog-row">
          <span class="role-dialog-label">邮箱</span>
          <span class="role-dialog-value">{{ currentRow.email }}</span>
        </div>
        <div class="role-dialog-row">
          <span class="role-dialog-label">当前角色</span>
          <el-tag v-if="currentRow.role === 'admin'" type="warning" size="small">管理员</el-tag>
          <el-tag v-else type="info" size="small">开发者</el-tag>
        </div>
        <div class="role-dialog-row">
          <span class="role-dialog-label">新角色</span>
          <el-radio-group v-model="newRole">
            <el-radio value="developer">开发者</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </div>
        <div v-if="wouldLockSelf" class="role-dialog-warn">
          <el-icon><WarningFilled /></el-icon>
          <span>不能把自己降级为开发者，避免锁死超级管理员</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canSubmit" :loading="submitting" @click="submitRole">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, WarningFilled } from '@element-plus/icons-vue'
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

