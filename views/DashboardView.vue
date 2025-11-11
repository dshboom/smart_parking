<template>
  <div class="dashboard-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">仪表盘</h1>
          <p class="page-subtitle">停车场系统实时数据概览</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" class="refresh-btn" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 现代化统计卡片 -->
    <div class="stats-grid">
      <StatisticCard
        :value="statistics.totalVehicles"
        label="总车辆数"
        trend-text="+12% 较昨日"
        variant="total"
        :icon="Van"
      />
      <StatisticCard
        :value="statistics.currentInParking"
        label="当前在场"
        trend-text="+5% 较昨日"
        variant="current"
        :icon="Position"
      />
      <StatisticCard
        :value="statistics.todayEntries"
        label="今日入场"
        trend-text="+18% 较昨日"
        variant="today"
        :icon="TrendCharts"
      />
      <StatisticCard
        :value="statistics.occupancyRate"
        label="占用率"
        :trend-text="`${statistics.occupiedSpaces}/${statistics.totalSpaces} 车位`"
        variant="occupancy"
        :icon="CircleCheck"
      />
      <StatisticCard
        :value="statistics.totalParkingLots"
        label="停车场数量"
        trend-text="运营中"
        variant="lots"
        :icon="TrendCharts"
      />
      <StatisticCard
        :value="statistics.avgParkingTime"
        label="平均停车时长"
        trend-text="-8% 较昨日"
        variant="time"
        :icon="Clock"
      />
    </div>

    <!-- 现代化图表区域 -->
    <div class="charts-section">
      <HourlyChart
        :title="'24小时车辆进出趋势'"
        :subtitle="'实时监控车辆流动情况'"
        :x-labels="hourlyLabels"
        :entries="hourlyEntries"
        :exits="hourlyExits"
        @refresh="refreshData"
      />

      <div class="chart-container modern-card">
        <WeeklyChart
          :title="'最近7天停车统计'"
          :subtitle="'周度数据分析报告'"
          :x-labels="weeklyLabels"
          :entries="weeklyEntries"
          :exits="weeklyExits"
          @refresh="refreshData"
        />
      </div>
    </div>

    <!-- 停车场可视化 -->
    <el-row class="charts-row" :gutter="20">
      <el-col :span="24">
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">停车场实时状态</h3>
            <div class="chart-actions">
              <el-button
                type="primary"
                size="small"
                @click="dashboardSimulateEntry"
                style="margin-right: 10px"
              >
                <el-icon><Van /></el-icon>
                模拟入场
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="dashboardSimulateExit"
              >
                <el-icon><Position /></el-icon>
                模拟出场
              </el-button>
            </div>
          </div>
          <div class="chart-content">
            <ParkingLotVisualization
              v-if="selectedParkingLot !== null"
              :parking-lot-id="selectedParkingLot"
              @space-selected="handleSpaceSelected"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 现代化记录表格 -->
    <div class="records-section modern-card">
      <div class="section-header">
        <div class="header-info">
          <h3 class="section-title">最近进出记录</h3>
          <p class="section-subtitle">实时车辆进出监控</p>
        </div>
        <div class="section-actions">
          <el-button type="primary" class="view-all-btn" @click="viewAllRecords" v-permission="'record:view'">
            <el-icon><ViewIcon /></el-icon>
            查看全部
          </el-button>
        </div>
      </div>
      
      <div class="table-container">
        <el-table
          :data="recentRecords"
          style="width: 100%"
          class="modern-table"
          :header-cell-style="{ background: '#f8f9fa', color: '#495057', fontWeight: '600' }"
          :row-class-name="tableRowClassName"
        >
          <el-table-column type="index" width="80" label="序号" align="center">
            <template #default="{ $index }">
              <div class="index-badge">{{ $index + 1 }}</div>
            </template>
          </el-table-column>
          
          <el-table-column prop="license_plate" label="车牌号码" min-width="150" align="center">
            <template #default="{ row }">
              <div class="plate-number">{{ row.license_plate }}</div>
            </template>
          </el-table-column>
          
          <el-table-column prop="entry_time" label="进入时间" width="200" align="center">
            <template #default="{ row }">
              <div class="time-cell">
                <el-icon><Clock /></el-icon>
                <span>{{ row.entry_time }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="exit_time" label="离开时间" width="200" align="center">
            <template #default="{ row }">
              <div class="time-cell">
                <el-icon><Clock /></el-icon>
                <span>{{ row.exit_time || '在场内' }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="row.is_in_parking ? 'success' : 'info'" 
                class="status-tag"
                effect="dark"
              >
                <el-icon><CircleCheck v-if="row.is_in_parking" /><CircleClose v-else /></el-icon>
                {{ row.is_in_parking ? '在场内' : '已离场' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Van, Position, TrendCharts, Clock, Refresh, View as ViewIcon, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { getAdminParkingStats, getAdminParkingTrends, getParkingLots } from '@/api/parking'
import { getVehicleStatsOverview, getVehicleRecordsList } from '@/api/vehicle'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'
import StatisticCard from '@/components/dashboard/StatisticCard.vue'
import HourlyChart from '@/components/dashboard/HourlyChart.vue'
import WeeklyChart from '@/components/dashboard/WeeklyChart.vue'
import { wsManager, subscribeToVehicleEntry, subscribeToVehicleExit, subscribeToParkingUpdates } from '@/utils/websocket'

export default {
  name: 'Dashboard',
  components: {
    Van,
    Position,
    TrendCharts,
    Clock,
    Refresh,
    ViewIcon,
    CircleCheck,
    CircleClose,
    ParkingLotVisualization,
    StatisticCard,
    HourlyChart,
    WeeklyChart
  },
  setup() {
    const router = useRouter()
    const hourlyChart = ref(null)
    const weeklyChart = ref(null)
    let hourlyChartInstance = null
    let weeklyChartInstance = null

    // 小时图表响应式数据，供 HourlyChart 使用
    const hourlyLabels = ref(['00:00','04:00','08:00','12:00','16:00','20:00','24:00'])
    const hourlyEntries = ref([120,132,101,134,90,230,210])
    const hourlyExits = ref([220,182,191,234,290,330,310])

    // 周图表响应式数据，供 WeeklyChart 使用
    const weeklyLabels = ref([])
    const weeklyEntries = ref([])
    const weeklyExits = ref([])

    // 停车场可视化相关
    const parkingLots = ref([])
    const selectedParkingLot = ref(null)

    // 更新图表配置为现代化风格
    const initHourlyChart = () => {
      if (!hourlyChart.value) return
      
      hourlyChartInstance = echarts.init(hourlyChart.value)
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(102, 126, 234, 0.3)',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#667eea'
            }
          }
        },
        legend: {
          data: ['入场', '出场'],
          textStyle: {
            color: '#666',
            fontWeight: '500'
          },
          itemGap: 20
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
          backgroundColor: 'transparent'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
          axisLine: {
            lineStyle: {
              color: 'rgba(102, 126, 234, 0.3)'
            }
          },
          axisLabel: {
            color: '#666',
            fontWeight: '500'
          }
        },
        yAxis: {
          type: 'value',
          name: '车辆数',
          nameTextStyle: {
            color: '#666',
            fontWeight: '500'
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(102, 126, 234, 0.3)'
            }
          },
          axisLabel: {
            color: '#666',
            fontWeight: '500'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(102, 126, 234, 0.1)'
            }
          }
        },
        series: [
          {
            name: '入场',
            type: 'line',
            smooth: true,
            data: [120, 132, 101, 134, 90, 230, 210],
            lineStyle: {
              color: '#667eea',
              width: 3
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
                { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
              ])
            },
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
              color: '#667eea',
              borderColor: '#fff',
              borderWidth: 2
            }
          },
          {
            name: '出场',
            type: 'line',
            smooth: true,
            data: [220, 182, 191, 234, 290, 330, 310],
            lineStyle: {
              color: '#764ba2',
              width: 3
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(118, 75, 162, 0.3)' },
                { offset: 1, color: 'rgba(118, 75, 162, 0.05)' }
              ])
            },
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
              color: '#764ba2',
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ]
      }
      hourlyChartInstance.setOption(option)
    }

    const initWeeklyChart = () => {
      if (!weeklyChart.value) return
      
      weeklyChartInstance = echarts.init(weeklyChart.value)
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(240, 147, 251, 0.3)',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          }
        },
        legend: {
          data: ['入场', '出场'],
          textStyle: {
            color: '#666',
            fontWeight: '500'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
          backgroundColor: 'transparent'
        },
        xAxis: {
          type: 'category',
          data: [],
          axisLine: {
            lineStyle: {
              color: 'rgba(240, 147, 251, 0.3)'
            }
          },
          axisLabel: {
            color: '#666',
            fontWeight: '500'
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '数量',
            nameTextStyle: {
              color: '#666',
              fontWeight: '500'
            },
            axisLine: {
              lineStyle: {
                color: 'rgba(240, 147, 251, 0.3)'
              }
            },
            axisLabel: {
              color: '#666',
              fontWeight: '500'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(240, 147, 251, 0.1)'
              }
            }
          }
        ],
        series: [
          {
            name: '入场',
            type: 'bar',
            data: [],
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
            data: [],
            lineStyle: {
              color: '#764ba2',
              width: 3
            },
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
              color: '#764ba2',
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ]
      }
      weeklyChartInstance.setOption(option)
    }

    const statistics = reactive({
      totalVehicles: 0,
      currentInParking: 0,
      todayEntries: 0,
      avgParkingTime: '0小时',
      totalParkingLots: 0,
      totalSpaces: 0,
      occupiedSpaces: 0,
      occupancyRate: '0%'
    })

    const recentRecords = ref([
      {
        id: 1,
        license_plate: '京A12345',
        entry_time: '2024-01-15 14:30:00',
        exit_time: null,
        is_in_parking: true
      },
      {
        id: 2,
        license_plate: '沪B67890',
        entry_time: '2024-01-15 13:15:00',
        exit_time: '2024-01-15 15:20:00',
        is_in_parking: false
      },
      {
        id: 3,
        license_plate: '粤C11111',
        entry_time: '2024-01-15 12:00:00',
        exit_time: null,
        is_in_parking: true
      },
      {
        id: 4,
        license_plate: '川D22222',
        entry_time: '2024-01-15 11:45:00',
        exit_time: '2024-01-15 14:10:00',
        is_in_parking: false
      }
    ])

    const viewAllRecords = () => {
      router.push('/admin/records')
    }

    const refreshData = () => {
      ElMessage.success('正在刷新数据...')
      loadDashboardData()
    }

    const tableRowClassName = ({ row, rowIndex }) => {
      return row.is_in_parking ? 'in-parking-row' : 'exited-row'
    }

    // 加载统计数据
    const loadStatistics = async () => {
      try {
        const response = await getAdminParkingStats()
        Object.assign(statistics, response)
      } catch (error) {
        ElMessage.error('加载统计数据失败')
      }
    }

    // 加载停车场列表
    const loadParkingLots = async () => {
      try {
        const response = await getParkingLots()
        parkingLots.value = response
        if (parkingLots.value.length > 0 && !selectedParkingLot.value) {
          selectedParkingLot.value = parkingLots.value[0].id
        }
      } catch (error) {
        ElMessage.error('加载停车场列表失败')
      }
    }

    // 处理车位选择
    const handleSpaceSelected = (space) => {
      console.log('选中车位:', space)
    }

    // 计算并更新占用率显示
    const recomputeOccupancyRate = () => {
      const total = statistics.totalSpaces || 0
      const occupied = statistics.occupiedSpaces || 0
      statistics.occupancyRate = total > 0 ? `${Math.round((occupied / total) * 100)}%` : '0%'
    }

    // 将实时事件应用到小时趋势（4小时一个桶）
    const bumpHourlySeries = (isEntry, atTime) => {
      const date = atTime ? new Date(atTime) : new Date()
      const hour = date.getHours()
      // 显示标签包含 24:00 终点，实际桶取 0..5（00,04,08,12,16,20）
      const bucket = Math.min(Math.floor(hour / 4), hourlyLabels.value.length - 2)
      if (isEntry) {
        const next = [...hourlyEntries.value]
        next[bucket] = (next[bucket] || 0) + 1
        hourlyEntries.value = next
      } else {
        const next = [...hourlyExits.value]
        next[bucket] = (next[bucket] || 0) + 1
        hourlyExits.value = next
      }
    }

    // 将实时事件应用到周趋势（按当天日期累加）
    const bumpWeeklySeries = (isEntry) => {
      const today = new Date().toISOString().split('T')[0]
      let idx = weeklyLabels.value.findIndex(d => d === today)
      // 若后台趋势未包含今天，则追加到末尾
      if (idx === -1) {
        weeklyLabels.value = [...weeklyLabels.value, today]
        weeklyEntries.value = [...weeklyEntries.value, 0]
        weeklyExits.value = [...weeklyExits.value, 0]
        idx = weeklyLabels.value.length - 1
      }
      if (isEntry) {
        const next = [...weeklyEntries.value]
        next[idx] = (next[idx] || 0) + 1
        weeklyEntries.value = next
      } else {
        const next = [...weeklyExits.value]
        next[idx] = (next[idx] || 0) + 1
        weeklyExits.value = next
      }
    }

    // 将事件追加到最近记录列表（最多保留10条）
    const pushRecentRecord = (record) => {
      const list = [record, ...recentRecords.value]
      recentRecords.value = list.slice(0, 10)
    }

    // WebSocket 实时数据更新处理（使用真实事件）
    const handleVehicleEntry = (data) => {
      console.log('车辆入场:', data)
      statistics.todayEntries += 1
      statistics.currentInParking += 1

      const entryTime = data?.entry_time || new Date().toISOString()
      pushRecentRecord({
        id: data?.id || Date.now(),
        license_plate: data?.license_plate || '未知车牌',
        entry_time: entryTime,
        exit_time: null,
        is_in_parking: true
      })

      bumpHourlySeries(true, entryTime)
      bumpWeeklySeries(true)
    }

    const handleVehicleExit = (data) => {
      console.log('车辆出场:', data)
      statistics.currentInParking = Math.max(0, statistics.currentInParking - 1)

      const exitTime = data?.exit_time || new Date().toISOString()
      pushRecentRecord({
        id: data?.id || Date.now(),
        license_plate: data?.license_plate || '未知车牌',
        entry_time: data?.entry_time || null,
        exit_time: exitTime,
        is_in_parking: false
      })

      bumpHourlySeries(false, exitTime)
      bumpWeeklySeries(false)
    }

    const handleParkingUpdate = (data) => {
      console.log('停车场状态更新:', data)
      const evt = data?.event || data?.type
      if (evt === 'space_occupied') {
        statistics.occupiedSpaces += 1
      } else if (evt === 'space_vacated') {
        statistics.occupiedSpaces = Math.max(0, statistics.occupiedSpaces - 1)
      }
      recomputeOccupancyRate()
    }

    // 移除随机数据更新，图表由实时事件与趋势接口共同驱动
    const updateChartData = () => {}

    // 初始化WebSocket连接
    // 记录取消订阅函数，确保组件卸载时清理
    let offVehicleEntry = null
    let offVehicleExit = null
    let offParkingUpdates = null

    const initWebSocketConnection = () => {
      // 建立连接（若已连接则跳过）
      try { wsManager.connect() } catch (e) {}

      // 订阅车辆入场事件
      offVehicleEntry = subscribeToVehicleEntry((payload) => {
        handleVehicleEntry(payload)
      })
      
      // 订阅车辆出场事件
      offVehicleExit = subscribeToVehicleExit((payload) => {
        handleVehicleExit(payload)
      })
      
      // 订阅停车场状态更新（space_occupied / space_vacated）
      offParkingUpdates = subscribeToParkingUpdates((payload) => {
        handleParkingUpdate(payload)
      })
      
      // 暴露wsManager到全局对象供调试使用
      if (typeof window !== 'undefined') {
        window.wsManager = wsManager
      }
    }

    // 模拟入场测试函数
    const dashboardSimulateEntry = () => {
      handleVehicleEntry({
        vehicle_id: 'TEST' + Math.floor(Math.random() * 1000),
        license_plate: '京A' + Math.floor(Math.random() * 10000),
        entry_time: new Date().toISOString(),
        parking_lot: 'A区',
        space_number: 'A-' + Math.floor(Math.random() * 50)
      })
    }

    // 模拟出场测试函数
    const dashboardSimulateExit = () => {
      handleVehicleExit({
        vehicle_id: 'TEST' + Math.floor(Math.random() * 1000),
        license_plate: '京A' + Math.floor(Math.random() * 10000),
        exit_time: new Date().toISOString(),
        parking_lot: 'A区',
        space_number: 'A-' + Math.floor(Math.random() * 50),
        duration: Math.floor(Math.random() * 120) + 30,
        fee: Math.floor(Math.random() * 50) + 10
      })
    }

    const loadDashboardData = async () => {
      try {
        // 加载统计数据
        const stats = await getAdminParkingStats()
        if (stats) {
          statistics.totalParkingLots = stats.total_lots || 0
          statistics.totalSpaces = stats.total_spaces || 0
          statistics.occupiedSpaces = stats.occupied_spaces || 0
          statistics.occupancyRate = `${Math.round(((stats.occupancy_rate || 0) * 100))}%`
          statistics.todayEntries = stats.today_entries || 0
          statistics.currentInParking = stats.current_vehicles || 0
          // 使用当前在场作为总车辆的近似展示
          statistics.totalVehicles = statistics.currentInParking
        }

        // 加载车辆平均停车时长（来自车辆统计概览）
        const vehicleStats = await getVehicleStatsOverview()
        if (vehicleStats && typeof vehicleStats.avgParkingDurationHours !== 'undefined') {
          const hours = vehicleStats.avgParkingDurationHours || 0
          statistics.avgParkingTime = `${hours.toFixed(1)}小时`
        }

        // 加载趋势数据
        const trendsResponse = await getAdminParkingTrends(7)
        if (trendsResponse && Array.isArray(trendsResponse.trends)) {
          updateTrendCharts(trendsResponse.trends)
        }

        // 加载最近记录（统一列表响应：items+total，兼容旧 records 字段）
        const recordsResponse = await getVehicleRecordsList({ skip: 0, limit: 10 })
        const rawList = Array.isArray(recordsResponse?.items)
          ? recordsResponse.items
          : (Array.isArray(recordsResponse?.records) ? recordsResponse.records : [])
        recentRecords.value = rawList.map(record => ({
          id: record.id,
          license_plate: record.license_plate || record.licensePlate || '未知车牌',
          entry_time: record.entry_time || record.entryTime,
          exit_time: record.exit_time || record.exitTime,
          is_in_parking: typeof record.is_in_parking !== 'undefined' ? !!record.is_in_parking : !!record.isInParking
        }))

        // 加载停车场列表
        await loadParkingLots()

        ElMessage.success('数据加载完成')
      } catch (error) {
        console.error('加载仪表盘数据失败:', error)
        ElMessage.error('数据加载失败')
      }
    }

    const updateTrendCharts = (trendsList) => {
      // 后端返回 { trends: [{ date, entries, exits, peak_vehicles }, ...] }
      if (Array.isArray(trendsList)) {
        weeklyLabels.value = trendsList.map(t => t.date)
        weeklyEntries.value = trendsList.map(t => t.entries)
        weeklyExits.value = trendsList.map(t => t.exits)
      }
    }

    const handleResize = () => {
      if (hourlyChartInstance) {
        hourlyChartInstance.resize()
      }
      if (weeklyChartInstance) {
        weeklyChartInstance.resize()
      }
    }

    onMounted(() => {
      // 使用 nextTick 确保 DOM 完全渲染后再初始化图表
      nextTick(() => {
        // 先初始化图表实例，再加载数据进行填充
        initHourlyChart()
        initWeeklyChart()
        loadDashboardData()
        initWebSocketConnection()
        window.addEventListener('resize', handleResize, { passive: true })
      })
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize, { passive: true })
      if (hourlyChartInstance) {
        hourlyChartInstance.dispose()
      }
      if (weeklyChartInstance) {
        weeklyChartInstance.dispose()
      }
      // 取消 WebSocket 订阅
      try { if (typeof offParkingUpdates === 'function') offParkingUpdates() } catch (e) {}
      try { if (typeof offVehicleEntry === 'function') offVehicleEntry() } catch (e) {}
      try { if (typeof offVehicleExit === 'function') offVehicleExit() } catch (e) {}
    })

    return {
      statistics,
      recentRecords,
      hourlyChart,
      weeklyChart,
      hourlyLabels,
      hourlyEntries,
      hourlyExits,
      weeklyLabels,
      weeklyEntries,
      weeklyExits,
      parkingLots,
      selectedParkingLot,
      viewAllRecords,
      refreshData,
      tableRowClassName,
      handleSpaceSelected,
      loadDashboardData,
      handleVehicleEntry,
      handleVehicleExit,
      handleParkingUpdate,
      initWebSocketConnection,
      dashboardSimulateEntry,
      dashboardSimulateExit
    }
  }
}
</script>

<style scoped>
.dashboard-container {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

.header-section {
  margin-bottom: 30px;
  text-align: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.title-section {
  text-align: left;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.statistics-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.stat-card:hover {
    transform: translateY(-2px);
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 24px;
  }
  
  .stat-icon.total {
    background-color: #e6f7ff;
    color: #1890ff;
  }
  
  .stat-icon.current {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  .stat-icon.today {
    background-color: #fff7e6;
    color: #fa8c16;
  }
  
  .stat-icon.rate {
    background-color: #f9f0ff;
    color: #722ed1;
  }
  
  .stat-content {
    flex: 1;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 5px;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
  }

  /* 现代化统计卡片样式 */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .modern-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 25px;
    color: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .modern-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    z-index: 1;
  }

  .modern-card > * {
    position: relative;
    z-index: 2;
  }

  .modern-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }

  .total-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .current-card {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .today-card {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .occupancy-card {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  .lots-card {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }

  .time-card {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }

  .card-background {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-icon-wrapper {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-icon {
    font-size: 24px;
    color: white;
  }

  .card-content {
    text-align: left;
  }

  .modern-card .stat-number {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .modern-card .stat-label {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 12px;
    font-weight: 500;
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  .stat-trend .el-icon {
    font-size: 16px;
  }

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.chart-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart-content {
  padding: 20px;
  height: 300px;
}

/* 停车场可视化概览样式 */
.visualization-section {
  margin-bottom: 30px;
}

.visualization-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.visualization-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.visualization-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.visualization-content {
  padding: 20px;
  min-height: 400px;
}

.visualization-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
  font-size: 14px;
}

.visualization-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.chart-content {
  padding: 20px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.recent-records {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.recent-records :deep(.el-table) {
  border: none;
}

.recent-records :deep(.el-table th) {
  background-color: #f5f7fa !important;
  font-weight: 600;
  color: #606266;
}

@media (max-width: 1200px) {
  .statistics-row .el-col {
    margin-bottom: 15px;
  }
  
  .charts-row .el-col {
    margin-bottom: 15px;
  }
}

/* 统计卡片基础样式 */
.stats-section {
  margin-bottom: var(--spacing-xl);
}

.stats-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }

.stat-card {
    background: var(--card-gradient);
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: var(--shadow-md);
    transition: all var(--transition-normal) ease;
    position: relative;
    overflow: hidden;
    border: 1px solid var(--border-light);
  }

.stat-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--primary-gradient);
  transform: scaleX(0);
  transition: transform var(--transition-normal) ease;
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0;
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-xl);
    transition: all var(--transition-normal) ease;
    position: relative;
    overflow: hidden;
  }

.stat-icon.parking {
  background: var(--primary-gradient);
  color: white;
}

.stat-icon.occupied {
  background: var(--error-gradient);
  color: white;
}

.stat-icon.available {
  background: var(--success-gradient);
  color: white;
}

.stat-icon.revenue {
  background: var(--warning-gradient);
  color: white;
}

.stat-card:hover .stat-icon {
  transform: rotate(10deg) scale(1.1);
  box-shadow: var(--shadow-lg);
}

.stat-content {
  flex: 1;
}

.stat-number {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    text-shadow: 0 1px 2px var(--shadow-light);
  }

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 15px;
  }
  
  .header-section {
    margin-bottom: 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-subtitle {
    font-size: 14px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  /* 移动端表格优化 */
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .modern-table {
    min-width: 600px;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .chart-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .section-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .stat-card {
    padding: 12px;
    flex-direction: row;
    text-align: left;
  }
  
  .stat-icon {
    margin-right: 12px;
    margin-bottom: 0;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .stat-number {
    font-size: 18px;
  }
  
  /* 超小屏幕优化 */
  .chart-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .chart-actions .el-button {
    width: 100%;
    justify-content: center;
  }
  
  .section-actions .el-button {
    width: 100%;
    justify-content: center;
  }
  
  .modern-table {
    font-size: 12px;
  }
  
  .index-badge {
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 11px;
  }
  
  .plate-number {
    font-size: 13px;
  }
  
  .time-cell {
    font-size: 11px;
  }
  
  .time-cell .el-icon {
    font-size: 12px;
  }
  
  .status-tag {
    font-size: 11px;
    padding: 0 6px;
    height: 20px;
    line-height: 20px;
  }
  
  .status-tag .el-icon {
    font-size: 10px;
    margin-right: 2px;
  }
}
</style>