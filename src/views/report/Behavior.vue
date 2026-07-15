<template>
  <div class="report-behavior">
    <el-card shadow="never" class="behavior-intro">
      <div class="intro-row">
        <el-icon :size="40" color="#1E3A8A"><User /></el-icon>
        <div class="intro-text">
          <h3>用户行为</h3>
          <p>展示频次、用户价值、使用时长三大子报表，分析用户质量与活跃度</p>
        </div>
      </div>
    </el-card>

    <div class="behavior-tabs">
      <el-radio-group v-model="activeTab" size="large">
        <el-radio-button value="frequency">展示频次</el-radio-button>
        <el-radio-button value="value">用户价值</el-radio-button>
        <el-radio-button value="duration">使用时长</el-radio-button>
      </el-radio-group>
    </div>

    <el-card v-if="activeTab === 'frequency'" shadow="never">
      <template #header>
        <div class="card-header">
          <span>展示频次分布</span>
          <el-radio-group v-model="dateRange" size="small">
            <el-radio-button value="7d">近 7 天</el-radio-button>
            <el-radio-button value="30d">近 30 天</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-empty description="展示频次分析模块即将上线（P8 阶段）" />
    </el-card>

    <el-card v-else-if="activeTab === 'value'" shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户价值分布</span>
          <el-radio-group v-model="dateRange" size="small">
            <el-radio-button value="7d">近 7 天</el-radio-button>
            <el-radio-button value="30d">近 30 天</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-empty description="用户价值分析模块即将上线（P8 阶段）" />
    </el-card>

    <el-card v-else shadow="never">
      <template #header>
        <div class="card-header">
          <span>使用时长（人均使用时长 / 人均会话次数 / 单次使用时长）</span>
          <el-radio-group v-model="dateRange" size="small">
            <el-radio-button value="7d">近 7 天</el-radio-button>
            <el-radio-button value="30d">近 30 天</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-empty description="使用时长分析模块即将上线（P8 阶段）" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User } from '@element-plus/icons-vue';

const activeTab = ref<'frequency' | 'value' | 'duration'>('frequency');
const dateRange = ref('7d');
</script>
