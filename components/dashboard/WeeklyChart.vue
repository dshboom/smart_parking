<template>
  <div class="chart-container modern-card">
    <div class="chart-header">
      <div class="header-info">
        <h3 class="chart-title">{{ title }}</h3>
        <p class="chart-subtitle">{{ subtitle }}</p>
      </div>
      <div class="chart-actions">
        <el-button type="link" class="chart-btn" @click="$emit('refresh')">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="chart-content">
      <div ref="chartRef" class="chart-area"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, default: '最近7天停车统计' },
  subtitle: { type: String, default: '周度数据分析报告' },
  xLabels: { type: Array, default: () => [] },
  entries: { type: Array, default: () => [] },
  exits: { type: Array, default: () => [] }
})

const chartRef = ref(null)
let chartInstance = null

const setOptions = () => {
  if (!chartInstance) return
  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(240, 147, 251, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#333' }
    },
    legend: {
      data: ['入场','出场'],
      textStyle: { color: '#666', fontWeight: '500' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true, backgroundColor: 'transparent' },
    xAxis: {
      type: 'category',
      data: props.xLabels,
      axisLine: { lineStyle: { color: 'rgba(240, 147, 251, 0.3)' } },
      axisLabel: { color: '#666', fontWeight: '500' }
    },
    yAxis: [{
      type: 'value',
      name: '数量',
      nameTextStyle: { color: '#666', fontWeight: '500' },
      axisLine: { lineStyle: { color: 'rgba(240, 147, 251, 0.3)' } },
      axisLabel: { color: '#666', fontWeight: '500' },
      splitLine: { lineStyle: { color: 'rgba(240, 147, 251, 0.1)' } }
    }],
    series: [
      {
        name: '入场',
        type: 'bar',
        data: props.entries,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f093fb' },
            { offset: 1, color: '#f5576c' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      },
      {
        name: '出场',
        type: 'line',
        yAxisIndex: 0,
        data: props.exits,
        lineStyle: { color: '#764ba2', width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#764ba2', borderColor: '#fff', borderWidth: 2 }
      }
    ]
  })
}

onMounted(() => {
  nextTick(() => {
    if (!chartRef.value) return
    chartInstance = echarts.init(chartRef.value)
    setOptions()
    window.addEventListener('resize', handleResize, { passive: true })
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize, { passive: true })
  if (chartInstance) chartInstance.dispose()
})

const handleResize = () => {
  chartInstance && chartInstance.resize()
}

watch(() => [props.entries, props.exits, props.xLabels], () => {
  setOptions()
})
</script>

<!-- 样式依赖于全局的 src/styles/dashboard.css -->