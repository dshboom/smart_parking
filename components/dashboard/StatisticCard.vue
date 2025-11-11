<template>
  <div class="stat-card modern-card" :class="variantClass">
    <div class="card-background">
      <div class="card-icon-wrapper">
        <el-icon class="card-icon">
          <component :is="icon" />
        </el-icon>
      </div>
    </div>
    <div class="card-content">
      <div class="stat-number">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-trend" v-if="trendText">
        <el-icon><TrendCharts /></el-icon>
        <span>{{ trendText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'

const props = defineProps({
  value: { type: [String, Number], required: true },
  label: { type: String, required: true },
  trendText: { type: String, default: '' },
  variant: {
    type: String,
    default: 'total',
    validator: v => ['total','current','today','occupancy','lots','time'].includes(v)
  },
  icon: { type: Object, required: true }
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'total': return 'total-card'
    case 'current': return 'current-card'
    case 'today': return 'today-card'
    case 'occupancy': return 'occupancy-card'
    case 'lots': return 'lots-card'
    case 'time': return 'time-card'
    default: return 'total-card'
  }
})
</script>

<!-- 样式依赖于全局的 src/styles/dashboard.css -->