<template>
  <div class="report-funnel">
    <el-card shadow="never" class="funnel-intro">
      <div class="intro-row">
        <el-icon :size="40" color="#1E3A8A"><Filter /></el-icon>
        <div class="intro-text">
          <h3>漏斗分析</h3>
          <p>配置用户行为漏斗（PV → 触发广告请求 → 广告填充 → 展示 → 点击 → 转化），跟踪每一步的转化率</p>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="funnel-config">
      <template #header>
        <div class="card-header">
          <span>漏斗配置（11 个标准步骤）</span>
          <el-button type="primary" :icon="Plus" size="small">新建漏斗</el-button>
        </div>
      </template>
      <el-table :data="funnelSteps" stripe>
        <el-table-column prop="order" label="顺序" width="60" />
        <el-table-column prop="code" label="事件 code" width="160" />
        <el-table-column prop="name" label="事件名" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'system' ? 'info' : 'success'" size="small">
              {{ row.type === 'system' ? '系统' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button size="small" link type="primary">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="funnel-results">
      <template #header>
        <div class="card-header">
          <span>漏斗结果（占位）</span>
          <el-radio-group v-model="dateRange" size="small">
            <el-radio-button value="today">今天</el-radio-button>
            <el-radio-button value="7d">近 7 天</el-radio-button>
            <el-radio-button value="30d">近 30 天</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-empty description="漏斗分析模块即将上线（P7 阶段）" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Filter } from '@element-plus/icons-vue';

const dateRange = ref('7d');

const funnelSteps = ref([
  { order: 1, code: 'app_open', name: 'App 启动', type: 'system' },
  { order: 2, code: 'sdk_init', name: 'SDK 初始化', type: 'system' },
  { order: 3, code: 'placement_show', name: '广告位曝光', type: 'system' },
  { order: 4, code: 'ad_request', name: '广告请求', type: 'system' },
  { order: 5, code: 'ad_fill', name: '广告填充', type: 'system' },
  { order: 6, code: 'ad_impression', name: '广告展示', type: 'system' },
  { order: 7, code: 'ad_click', name: '广告点击', type: 'system' },
  { order: 8, code: 'landing_view', name: '落地页 PV', type: 'system' },
  { order: 9, code: 'register_pv', name: '注册页 PV', type: 'system' },
  { order: 10, code: 'register_done', name: '注册完成', type: 'system' },
  { order: 11, code: 'first_purchase', name: '首次付费', type: 'system' },
]);
</script>
