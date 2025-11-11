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
  title: { type: String, default: '24小时车辆进出趋势' },
  subtitle: { type: String, default: '实时监控车辆流动情况' },
  xLabels: { type: Array, default: () => ['00:00','04:00','08:00','12:00','16:00','20:00','24:00'] },
  entries: { type: Array, default: () => [120,132,101,134,90,230,210] },
  exits: { type: Array, default: () => [220,182,191,234,290,330,310] }
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
      borderColor: 'rgba(102, 126, 234, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#333' },
      axisPointer: { type: 'cross', crossStyle: { color: '#667eea' } }
    },
    legend: {
      data: ['入场','出场'],
      textStyle: { color: '#666', fontWeight: '500' },
      itemGap: 20
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true, backgroundColor: 'transparent' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.xLabels,
      axisLine: { lineStyle: { color: 'rgba(102, 126, 234, 0.3)' } },
      axisLabel: { color: '#666', fontWeight: '500' }
    },
    yAxis: {
      type: 'value',
      name: '车辆数',
      nameTextStyle: { color: '#666', fontWeight: '500' },
      axisLine: { lineStyle: { color: 'rgba(102, 126, 234, 0.3)' } },
      axisLabel: { color: '#666', fontWeight: '500' },
      splitLine: { lineStyle: { color: 'rgba(102, 126, 234, 0.1)' } }
    },
    series: [
      {
        name: '入场',
        type: 'line',
        smooth: true,
        data: props.entries,
        lineStyle: { color: '#667eea', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#667eea', borderColor: '#fff', borderWidth: 2 }
      },
      {
        name: '出场',
        type: 'line',
        smooth: true,
        data: props.exits,
        lineStyle: { color: '#764ba2', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(118, 75, 162, 0.3)' },
            { offset: 1, color: 'rgba(118, 75, 162, 0.05)' }
          ])
        },
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