<template>
  <div class="parking-lot-statistics">
    <el-row :gutter="20">
      <!-- Overview Cards -->
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in overviewStats" :key="stat.title">
        <el-card class="overview-card" :class="stat.class">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="48">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stat.number }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- Status Distribution Chart -->
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <span>停车位状态分布</span>
          </template>
          <div ref="statusChartRef" class="chart-container" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>

      <!-- Type Distribution Chart -->
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <span>停车位类型分布</span>
          </template>
          <div ref="typeChartRef" class="chart-container" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Occupancy Trend Chart -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>占用率趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-container" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Detailed Statistics Table -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>详细统计信息</span>
            <el-button style="float: right;" type="primary" size="small" @click="exportStatistics">
              导出数据
            </el-button>
          </template>
          <el-table :data="detailedStats" style="width: 100%">
            <el-table-column prop="metric" label="指标" width="200" />
            <el-table-column prop="value" label="数值" width="150" />
            <el-table-column prop="description" label="说明" />
            <el-table-column prop="trend" label="趋势" width="100">
              <template #default="{ row }">
                <el-icon v-if="row.trend === 'up'" style="color: #f56c6c;">
                  <Top />
                </el-icon>
                <el-icon v-else-if="row.trend === 'down'" style="color: #67c23a;">
                  <Bottom />
                </el-icon>
                <el-icon v-else style="color: #909399;">
                  <Minus />
                </el-icon>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Top, Bottom, Minus } from '@element-plus/icons-vue'
import * as parkingApi from '@/api/parking'

export default {
  name: 'ParkingLotStatistics',
  components: {
    Top,
    Bottom,
    Minus
  },
  props: {
    parkingLotId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // State
    const statusChartRef = ref(null)
    const typeChartRef = ref(null)
    const trendChartRef = ref(null)
    
    let statusChart = null
    let typeChart = null
    let trendChart = null
    let ro = null
    let initialized = false

    const statistics = ref({
      total_spaces: 0,
      occupied_spaces: 0,
      available_spaces: 0,
      reserved_spaces: 0,
      occupancy_rate: 0,
      space_types: {},
      status_distribution: {},
      hourly_occupancy: []
    })

    // Computed
    const overviewStats = reactive([
      {
        title: '总停车位',
        number: 0,
        icon: 'OfficeBuilding',
        class: 'stat-total'
      },
      {
        title: '已占用',
        number: 0,
        icon: 'Remove',
        class: 'stat-occupied'
      },
      {
        title: '空闲位',
        number: 0,
        icon: 'CircleCheck',
        class: 'stat-available'
      },
      {
        title: '占用率',
        number: '0%',
        icon: 'TrendCharts',
        class: 'stat-occupancy'
      }
    ])

    const detailedStats = reactive([
      {
        metric: '总停车位数',
        value: '0',
        description: '停车场内所有停车位的总数',
        trend: 'stable'
      },
      {
        metric: '普通停车位',
        value: '0',
        description: '普通类型的停车位数量',
        trend: 'stable'
      },
      {
        metric: '残疾人停车位',
        value: '0',
        description: '专门为残疾人预留的停车位数量',
        trend: 'stable'
      },
      
      {
        metric: '当前占用率',
        value: '0%',
        description: '当前被占用的停车位比例',
        trend: 'stable'
      },
      {
        metric: '平均停留时间',
        value: '0小时',
        description: '车辆平均停车时长',
        trend: 'stable'
      }
    ])

    // Methods
    const loadStatistics = async () => {
      try {
        const response = await parkingApi.getParkingLotStats(props.parkingLotId)
        statistics.value = response
        
        // Update overview stats
        overviewStats[0].number = response.total_spaces
        overviewStats[1].number = response.occupied_spaces
        overviewStats[2].number = response.available_spaces
        overviewStats[3].number = `${response.occupancy_rate.toFixed(1)}%`

        // Update detailed stats
        detailedStats[0].value = response.total_spaces.toString()
        detailedStats[1].value = (response.space_types.regular || 0).toString()
        detailedStats[2].value = (response.space_types.disabled || 0).toString()
        detailedStats[3].value = `${response.occupancy_rate.toFixed(1)}%`
        detailedStats[4].value = calculateAverageStayTime(response)

        // Update charts
        updateCharts()
      } catch (error) {
        ElMessage.error('加载统计数据失败')
        console.error('Error loading statistics:', error)
      }
    }

    const updateCharts = () => {
      // Check if charts are initialized
      if (!statusChart || !typeChart || !trendChart) {
        return
      }

      // Status Distribution Chart
      if (statusChart) {
        const statusOption = {
          tooltip: {
            trigger: 'item'
          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [
            {
              name: '状态分布',
              type: 'pie',
              radius: '50%',
              data: [
                { value: statistics.value.available_spaces, name: '空闲' },
                { value: statistics.value.occupied_spaces, name: '占用' },
                { value: statistics.value.reserved_spaces, name: '预留' }
              ],
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        }
        statusChart.setOption(statusOption)
      }

      // Type Distribution Chart
      if (typeChart) {
        const typeOption = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          xAxis: {
            type: 'category',
            data: ['普通', '残疾人']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '数量',
              type: 'bar',
              data: [
                statistics.value.space_types.regular || 0,
                statistics.value.space_types.disabled || 0
              ],
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#83bff6' },
                  { offset: 0.5, color: '#188df0' },
                  { offset: 1, color: '#188df0' }
                ])
              }
            }
          ]
        }
        typeChart.setOption(typeOption)
      }

      // Occupancy Trend Chart
      if (trendChart) {
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
        const trendOption = {
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: hours
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            }
          },
          series: [
            {
              name: '占用率',
              type: 'line',
              smooth: true,
              data: generateMockTrendData(),
              areaStyle: {
                opacity: 0.3
              },
              lineStyle: {
                width: 3
              }
            }
          ]
        }
        trendChart.setOption(trendOption)
      }
    }

    const generateMockTrendData = () => {
      // Generate mock hourly occupancy data
      const data = []
      for (let i = 0; i < 24; i++) {
        let occupancy
        if (i < 6) {
          occupancy = Math.random() * 20 + 5 // 5-25% during night
        } else if (i < 9) {
          occupancy = Math.random() * 30 + 30 // 30-60% morning rush
        } else if (i < 17) {
          occupancy = Math.random() * 20 + 60 // 60-80% during work hours
        } else if (i < 21) {
          occupancy = Math.random() * 25 + 45 // 45-70% evening
        } else {
          occupancy = Math.random() * 20 + 15 // 15-35% late evening
        }
        data.push(Math.round(occupancy))
      }
      return data
    }

    const calculateAverageStayTime = (stats) => {
      // Mock calculation - in real implementation, this would be calculated from actual data
      const avgHours = Math.random() * 4 + 1 // 1-5 hours
      return `${avgHours.toFixed(1)}小时`
    }

    const exportStatistics = () => {
      // Mock export functionality
      const data = {
        overview: overviewStats,
        detailed: detailedStats,
        timestamp: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `parking_statistics_${props.parkingLotId}_${new Date().getTime()}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      ElMessage.success('统计数据导出成功')
    }

    const handleResize = () => {
      if (statusChart) statusChart.resize()
      if (typeChart) typeChart.resize()
      if (trendChart) trendChart.resize()
    }

    // Lifecycle
    const tryInitCharts = () => {
      if (initialized) return
      const sEl = statusChartRef.value
      const tEl = typeChartRef.value
      const trEl = trendChartRef.value
      if (!sEl || !tEl || !trEl) return
      const ok = (el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      }
      if (ok(sEl) && ok(tEl) && ok(trEl)) {
        try {
          statusChart = echarts.init(sEl)
          typeChart = echarts.init(tEl)
          trendChart = echarts.init(trEl)
          initialized = true
          loadStatistics()
          window.addEventListener('resize', handleResize, { passive: true })
          if (ro) ro.disconnect()
        } catch (error) {
          console.error('Error initializing charts:', error)
        }
      }
    }

    onMounted(() => {
      nextTick(() => {
        // Use ResizeObserver to initialize when container becomes visible and sized
        tryInitCharts()
        try {
          ro = new ResizeObserver(() => tryInitCharts())
          if (statusChartRef.value) ro.observe(statusChartRef.value)
          if (typeChartRef.value) ro.observe(typeChartRef.value)
          if (trendChartRef.value) ro.observe(trendChartRef.value)
        } catch (e) {
          // Fallback: timed retries
          setTimeout(tryInitCharts, 300)
          setTimeout(tryInitCharts, 800)
        }
      })
    })

    onUnmounted(() => {
      // Dispose charts
      statusChart?.dispose()
      typeChart?.dispose()
      trendChart?.dispose()
      
      // Remove resize listener
      window.removeEventListener('resize', handleResize, { passive: true })
      try { ro && ro.disconnect() } catch (_) {}
    })

    // Watch for parking lot ID changes
    watch(() => props.parkingLotId, () => {
      loadStatistics()
    })

    return {
      // Refs
      statusChartRef,
      typeChartRef,
      trendChartRef,
      
      // State
      statistics,
      overviewStats,
      detailedStats,
      
      // Methods
      loadStatistics,
      exportStatistics,
      handleResize
    }
  }
}
</script>

<style scoped>
.parking-lot-statistics {
  padding: 20px;
}

.overview-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.8;
}

.stat-info {
  text-align: right;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-total .stat-number {
  color: #409eff;
}

.stat-occupied .stat-number {
  color: #f56c6c;
}

.stat-available .stat-number {
  color: #67c23a;
}

.stat-occupancy .stat-number {
  color: #e6a23c;
}

.chart-container {
  height: 300px;
  width: 100%;
}

@media (max-width: 768px) {
  .parking-lot-statistics {
    padding: 10px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-info {
    text-align: center;
    margin-top: 10px;
  }
}
</style>