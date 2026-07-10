<template>
  <el-drawer
    v-model="visible"
    title="添加广告平台账号"
    direction="rtl"
    size="420px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="ana-body">
      <div class="ana-header">
        <div class="ana-platform">
          <div class="ana-platform-logo" :style="{ background: network?.logo_color || '#1E40AF' }">
            {{ (network?.network_name || '?').slice(0, 1) }}
          </div>
          <span class="ana-platform-name">{{ network?.network_name || '广告平台' }}</span>
          <span class="ana-platform-tag">AUTO</span>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="ana-form"
        @submit.prevent
      >
        <el-form-item label="账号名称" prop="accountName">
          <el-input
            v-model="form.accountName"
            placeholder="默认账号"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="报表API" prop="reportApi">
          <el-radio-group v-model="form.reportApi" class="ana-toggle">
            <el-radio-button :value="true">已开通</el-radio-button>
            <el-radio-button :value="false">未开通</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="自动创建广告源" prop="autoCreateSource">
          <el-radio-group v-model="form.autoCreateSource" class="ana-toggle">
            <el-radio-button :value="true">是</el-radio-button>
            <el-radio-button :value="false">否</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入" />
        </el-form-item>

        <el-form-item label="Role ID" prop="roleId">
          <el-input v-model="form.roleId" placeholder="请输入" />
        </el-form-item>

        <el-form-item label="Secure Key" prop="secureKey">
          <el-input v-model="form.secureKey" placeholder="请输入" type="password" show-password />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="ana-footer">
        <a class="ana-help" href="javascript:void(0);" @click="onHelp">
          如何找到这些参数？<el-icon><Promotion /></el-icon>
        </a>
        <div class="ana-actions">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="onSubmit">提交</el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import request from '@/utils/request'

interface Network {
  id: number
  network_name: string
  logo_color?: string
}

const props = defineProps<{
  modelValue: boolean
  network: Network | null
  appKey: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  success: [account: { id: number; account_name: string; account_id: string }]
}>()

const visible = ref(props.modelValue)
watch(() => props.modelValue, v => { visible.value = v })
watch(visible, v => emit('update:modelValue', v))

const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({
  accountName: '默认账号',
  reportApi: false,
  autoCreateSource: false,
  userId: '',
  roleId: '',
  secureKey: '',
})

const rules: FormRules = {
  accountName: [{ required: true, message: '请输入账号名称', trigger: 'blur' }],
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  roleId: [{ required: true, message: '请输入 Role ID', trigger: 'blur' }],
  secureKey: [{ required: true, message: '请输入 Secure Key', trigger: 'blur' }],
}

const onHelp = () => {
  ElMessage.info('请到所选广告平台后台开发者中心获取用户ID / Role ID / Secure Key')
}

const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (!valid) return
    if (!props.network || !props.appKey) {
      ElMessage.error('缺少平台或应用信息')
      return
    }
    submitting.value = true
    try {
      const credentials = {
        userId: form.userId,
        roleId: form.roleId,
        secureKey: form.secureKey,
        reportApi: form.reportApi,
        autoCreateSource: form.autoCreateSource,
      }
      const res: any = await request.post('/api/v1/console/network/account/create', {
        networkDefId: props.network.id,
        appId: props.appKey,
        accountName: form.accountName,
        accountId: form.userId,
        credentials,
        status: 1,
      })
      ElMessage.success(res.message || '账号创建成功')
      emit('success', {
        id: res.data.id,
        account_name: res.data.account_name,
        account_id: res.data.account_id,
      })
      visible.value = false
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message || e?.message || '创建失败')
    } finally {
      submitting.value = false
    }
  })
}
</script>

