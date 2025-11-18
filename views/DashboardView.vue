<template>
  <!-- 停车场可视化 -->
  <div class="parking-visualization">
    <h3 class="section-title">停车场实时状态</h3>
    <ParkingLotVisualization
      v-if="selectedParkingLot !== null"
      :parking-lot-id="selectedParkingLot"
      :read-only="true"
      @space-selected="handleSpaceSelected"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getParkingLots } from '@/api/parking'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'
import { wsManager, subscribeToVehicleEntry, subscribeToVehicleExit, subscribeToParkingUpdates } from '@/utils/websocket'

export default {
    name: 'Dashboard',
    components: {
      ParkingLotVisualization
    },
  setup() {
    // 停车场可视化相关
    const parkingLots = ref([])
    const selectedParkingLot = ref(null)

    // 清理不需要的函数

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

    // 清理不需要的函数

    // WebSocket 实时数据更新处理（使用真实事件）
    const handleVehicleEntry = (data) => {
      // 更新停车场数据
      const lot = parkingLots.value.find(l => l.id === data?.parking_lot_id)
      if (lot) {
        lot.occupied_spaces++
        lot.occupancy_rate = Math.round((lot.occupied_spaces / lot.total_spaces) * 100)
      }
    }

    const handleVehicleExit = (data) => {
      // 更新停车场数据
      const lot = parkingLots.value.find(l => l.id === data?.parking_lot_id)
      if (lot) {
        lot.occupied_spaces--
        lot.occupancy_rate = Math.round((lot.occupied_spaces / lot.total_spaces) * 100)
      }
    }

    const handleParkingUpdate = (data) => {
      console.log('停车场状态更新:', data)
      // 停车场状态更新处理逻辑已简化，只保留日志
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

    // 清理不需要的函数

    const loadDashboardData = async () => {
      try {
        // 只加载停车场列表，其他统计数据已移除
        await loadParkingLots()
        ElMessage.success('数据加载完成')
      } catch (error) {
        console.error('加载仪表盘数据失败:', error)
        ElMessage.error('数据加载失败')
      }
    }

    onMounted(() => {
      loadDashboardData()
      initWebSocketConnection()
    })

    onUnmounted(() => {
      // 取消 WebSocket 订阅
      try { if (typeof offParkingUpdates === 'function') offParkingUpdates() } catch (e) {}
      try { if (typeof offVehicleEntry === 'function') offVehicleEntry() } catch (e) {}
      try { if (typeof offVehicleExit === 'function') offVehicleExit() } catch (e) {}
    })

    return {
      parkingLots,
      selectedParkingLot,
      handleSpaceSelected,
      loadDashboardData,
      handleVehicleEntry,
      handleVehicleExit,
      handleParkingUpdate,
      initWebSocketConnection
    }
  }
}
</script>

<style scoped>
.parking-visualization {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
  margin: 0 auto;
  max-width: 1200px;
}

.parking-visualization:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .chart-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .chart-content {
    height: 350px;
  }
}

@media (max-width: 480px) {
  .chart-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .chart-actions .el-button {
    width: 100%;
    justify-content: center;
  }
  
  .chart-content {
    height: 300px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .chart-container {
    background: #2c3e50;
    color: #ecf0f1;
  }
  
  .chart-title {
    color: #ecf0f1;
  }
}
</style>