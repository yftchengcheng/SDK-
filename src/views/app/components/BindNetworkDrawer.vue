<template>
  <el-drawer
    v-model="visible"
    title="关联广告平台账号"
    direction="rtl"
    size="420px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="bnd-body">
      <div class="bnd-crumbs">
        <span class="bnd-crumb bnd-crumb--app">应用</span>
        <el-icon class="bnd-crumb-sep"><ArrowRight /></el-icon>
        <span class="bnd-crumb bnd-crumb--static">{{ appName || '-' }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="bnd-form"
        @submit.prevent
      >
        <el-form-item label="广告平台" prop="networkId">
          <el-select
            v-model="form.networkId"
            placeholder="请选择广告平台"
            style="width: 100%"
            :loading="loadingNetwork"
            @change="onNetworkChange"
          >
            <el-option
              v-for="item in networkList"
              :key="item.id"
              :value="item.id"
              :label="item.network_name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="账号名称" prop="accountId">
          <div class="bnd-account-row">
            <el-select
              v-model="form.accountId"
              placeholder="请选择账号"
              style="flex: 1"
              :loading="loadingAccount"
              :no-data-text="form.networkId ? '该平台暂无账号，请点击右侧添加' : '请先选择广告平台'"
              @focus="onAccountFocus"
            >
              <el-option
                v-for="item in accountList"
                :key="item.id"
                :value="item.id"
                :label="item.account_name"
              />
            </el-select>
            <a class="bnd-add-link" href="javascript:void(0);" @click="openAddAccount">
              <el-icon><Plus /></el-icon>
              <span>添加账号</span>
            </a>
          </div>
        </el-form-item>
      </el-form>

      <div v-if="networkList.length === 0 && !loadingNetwork" class="bnd-empty">
        <div class="bnd-empty-icon">
          <el-icon><Connection /></el-icon>
        </div>
        <div class="bnd-empty-tip">暂无广告平台</div>
        <el-button type="primary" plain @click="goCreate">去创建广告平台</el-button>
      </div>
    </div>

    <template #footer>
      <div class="bnd-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">确认关联</el-button>
      </div>
    </template>

    <AddNetworkAccountDrawer
      v-model="addAccountVisible"
      :network="activeNetwork"
      :app-key="appKey"
      @success="onAccountCreated"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowRight, Plus, Connection } from '@element-plus/icons-vue'
import request from '@/utils/request'
import AddNetworkAccountDrawer from './AddNetworkAccountDrawer.vue'

interface Network {
  id: number
  network_name: string
  logo_color?: string
}
interface Account {
  id: number
  account_name: string
  account_id: string
  network_def_id: number
}

const props = defineProps<{
  modelValue: boolean
  appKey: string
  appName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: []
}>()

const router = useRouter()
const visible = ref(props.modelValue)
watch(() => props.modelValue, v => { visible.value = v })
watch(visible, v => emit('update:modelValue', v))

const formRef = ref<FormInstance>()
const loadingNetwork = ref(false)
const loadingAccount = ref(false)
const submitting = ref(false)
const networkList = ref<Network[]>([])
const accountList = ref<Account[]>([])
const addAccountVisible = ref(false)

const form = reactive({
  networkId: null as number | null,
  accountId: null as number | null,
})

const rules: FormRules = {
  networkId: [{ required: true, message: '请选择广告平台', trigger: 'change' }],
  accountId: [{ required: true, message: '请选择账号', trigger: 'change' }],
}

const activeNetwork = computed(() => networkList.value.find(n => n.id === form.networkId) || null)

const loadNetworks = async () => {
  loadingNetwork.value = true
  try {
    const res: any = await request.get('/api/v1/console/network/list')
    networkList.value = res.data?.list || res.data || []
  } catch (e) {
    networkList.value = []
  } finally {
    loadingNetwork.value = false
  }
}

const loadAccounts = async (networkDefId: number) => {
  loadingAccount.value = true
  try {
    const res: any = await request.get('/api/v1/console/network/account/list', {
      params: { networkDefId },
    })
    accountList.value = res.data?.list || res.data || []
  } catch (e) {
    accountList.value = []
  } finally {
    loadingAccount.value = false
  }
}

const onNetworkChange = (val: number | null) => {
  form.accountId = null
  accountList.value = []
  if (val) loadAccounts(val)
}

const onAccountFocus = () => {
  if (form.networkId && accountList.value.length === 0 && !loadingAccount.value) {
    loadAccounts(form.networkId)
  }
}

const openAddAccount = () => {
  if (!form.networkId) {
    ElMessage.warning('请先选择广告平台')
    return
  }
  addAccountVisible.value = true
}

const onAccountCreated = (acc: { id: number; account_name: string; account_id: string }) => {
  if (form.networkId) {
    loadAccounts(form.networkId).then(() => {
      form.accountId = acc.id
    })
  }
}

const goCreate = () => {
  visible.value = false
  router.push('/network')
}

const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      const res: any = await request.post('/api/v1/console/network/app/bind', {
        appKey: props.appKey,
        networkDefId: form.networkId,
        networkAppId: form.accountId,
      })
      ElMessage.success(res.message || '关联成功')
      emit('success')
      visible.value = false
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message || e?.message || '关联失败')
    } finally {
      submitting.value = false
    }
  })
}

watch(visible, async v => {
  if (v) {
    form.networkId = null
    form.accountId = null
    accountList.value = []
    await loadNetworks()
  }
})
</script>

