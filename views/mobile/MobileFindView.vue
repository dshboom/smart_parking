<template>
  <div class="mobile-find">
    <div class="find-header">
      <h2>🔍 寻找车位</h2>
      <p>实时查看停车场状态与导航</p>
    </div>

    <!-- 车场选择器 -->
    <div class="lot-selector">
      <el-form inline>
        <el-form-item label="选择停车场">
          <el-select v-model="selectedLotId" placeholder="请选择" @change="handleLotChange" style="min-width: 200px">
            <el-option
              v-for="lot in parkingLots"
              :key="lot.id"
              :label="lot.name"
              :value="lot.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 实时可视化（只读） -->
    <div class="realtime-visual">
      <template v-if="selectedLotId">
        <ParkingLotVisualization 
          :parkingLotId="selectedLotId" 
          :readOnly="true"
          :selectMode="true"
          :showPath="showPathData"
          :highlightSpace="highlightSpaceId"
          :currentPosition="currentEntrancePosition"
          @space-selected="onSpaceSelected"
        />
      </template>
      <template v-else>
        <el-empty description="请先选择停车场" />
      </template>
    </div>
    
    <div class="current-status">
      <h4>当前状态</h4>
      <div class="status-cards">
        <div class="status-card">
          <div class="status-icon">
            <el-icon><Position /></el-icon>
          </div>
          <div class="status-info">
            <div class="status-number">{{ totalVehicles }}</div>
            <div class="status-label">总车辆数</div>
          </div>
        </div>
        <div class="status-card">
          <div class="status-icon">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div class="status-info">
            <div class="status-number">{{ availableSpots }}</div>
            <div class="status-label">空余车位</div>
          </div>
        </div>
      </div>
    </div>


    <!-- 当前车辆与操作 -->
    <div class="vehicle-ops">
      <h4>当前车辆</h4>
      <div class="vehicle-card">
        <div class="vehicle-info">
          <div class="vehicle-line">
            <span class="label">车牌</span>
            <span class="value">{{ currentPlate || '未知' }}</span>
          </div>
          <div class="vehicle-line" v-if="currentVehicleId">
            <span class="label">车辆ID</span>
            <span class="value">{{ currentVehicleId }}</span>
          </div>
          <div class="vehicle-line" v-if="selectedSpaceId">
            <span class="label">已选择车位</span>
            <span class="value">#{{ selectedSpaceId }}</span>
          </div>
          <div class="vehicle-line" v-if="highlightSpaceId">
            <span class="label">推荐车位</span>
            <span class="value">#{{ highlightSpaceId }}</span>
          </div>
          <div class="vehicle-line" v-if="navigationDistance != null">
            <span class="label">距离</span>
            <span class="value">{{ navigationDistance }} 米</span>
          </div>
          <div class="vehicle-line" v-if="navigationTime != null">
            <span class="label">预计时间</span>
            <span class="value">{{ formatDuration(navigationTime) }}</span>
          </div>
        </div>
    <div class="vehicle-actions">
          <el-button type="primary" :disabled="!currentVehicleId || !selectedSpaceId" @click="occupySelectedSpace">占用此车位</el-button>
          <el-button type="warning" :disabled="!selectedSpaceId" @click="openReservationDialog">预约此车位</el-button>
          <el-button :disabled="!selectedLotId" @click="computeNearestPath">重新规划</el-button>
          <el-button type="success" :disabled="!canShowExitNav" @click="computeExitPath">离场导航</el-button>
          <el-button type="danger" @click="mockPay">演示支付</el-button>
          <!-- 预约弹窗放在同一模板中 -->
          <el-dialog v-model="reservationDialogVisible" title="预约此车位" width="90%">
            <el-form label-width="90px">
              <el-form-item label="开始时间">
                <el-date-picker v-model="reservationForm.start_time" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.sssZ" />
              </el-form-item>
              <el-form-item label="结束时间">
                <el-date-picker v-model="reservationForm.end_time" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.sssZ" />
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="reservationDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitReservation">确认预约</el-button>
              </span>
            </template>
          </el-dialog>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Position, OfficeBuilding } from '@element-plus/icons-vue'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'
import * as parkingApi from '@/api/parking'
import * as reservationsApi from '@/api/reservations'
import * as vehicleApi from '@/api/vehicle'
// 已移除VIP体系，无需定价配置的VIP校验

export default {
  name: 'MobileFindView',
  components: {
    Position,
    OfficeBuilding,
    ParkingLotVisualization
  },
  data() {
    return {
      totalVehicles: 0,
      availableSpots: 0,
      parkingLots: [],
      selectedLotId: null,
      loading: false,
      // 自动导航相关状态
      autoNavRequested: false,
      currentEntrancePosition: null,
      showPathData: [],
      highlightSpaceId: null,
      selectedSpaceId: null,
      selectedSpaceCoord: null,
      lastOccupiedSpaceCoord: null,
      // 当前车辆信息（来自路由参数）
      currentPlate: '',
      currentVehicleId: null,
      // 路径指标
      navigationDistance: null,
      navigationTime: null
      ,
      // 预约弹窗与表单
      reservationDialogVisible: false,
      reservationForm: {
        start_time: '',
        end_time: ''
      },
      lastReservationId: null,
      lastPaymentMessage: '',
      // 已移除VIP体系相关状态
    }
  },
  mounted() {
    this.loadParkingLots()
    this.prepareAutoNavFromRoute()
    // 无VIP门控，直接加载
  },
  computed: {
    canShowExitNav() {
      return !!(this.selectedLotId && this.lastOccupiedSpaceCoord)
    }
  },
  methods: {
    onSpaceSelected(payload) {
      // 记录选择的车位及其坐标，清空现有路径
      this.selectedSpaceId = payload?.spaceId || null
      this.selectedSpaceCoord = payload && typeof payload.row === 'number' && typeof payload.col === 'number'
        ? { row: payload.row, col: payload.col }
        : null
      this.showPathData = []
      this.navigationDistance = null
      this.navigationTime = null
    },
    // 已移除VIP门控，无需加载
    async loadParkingLots() {
      try {
        this.loading = true
        const lots = await parkingApi.getParkingLots()
        this.parkingLots = Array.isArray(lots) ? lots : (lots?.items ?? [])
        if (this.parkingLots.length > 0) {
          this.selectedLotId = this.parkingLots[0].id
          await this.loadParkingStatus()
          await this.autoComputeNearestPathIfRequested()
        }
      } catch (error) {
        console.error('加载停车场列表失败:', error)
      } finally {
        this.loading = false
      }
    },
    async handleLotChange() {
      await this.loadParkingStatus()
      await this.autoComputeNearestPathIfRequested()
    },
    async loadParkingStatus() {
      try {
        if (!this.selectedLotId) return
        const stats = await parkingApi.getParkingLotStats(this.selectedLotId)
        if (stats) {
          // 使用后端统计：占用数视为当前车辆数，可用数直接使用
          this.totalVehicles = stats.occupied_spaces ?? 0
          this.availableSpots = stats.available_spaces ?? 0
        }
      } catch (error) {
        console.error('加载停车场状态失败:', error)
      }
    },

    // 路由中是否请求自动导航
    prepareAutoNavFromRoute() {
      const q = this.$route?.query || {}
      this.autoNavRequested = q.autoNav === '1' || q.autoNav === 1
      this.currentPlate = q.plate || ''
      this.currentVehicleId = q.vehicleId ? Number(q.vehicleId) : null
    },

    // 在选定车场后触发计算最近路径
    async autoComputeNearestPathIfRequested() {
      if (!this.autoNavRequested || !this.selectedLotId) return
      await this.ensureVehicleId()
      await this.loadEntrancePosition()
      await this.computeNearestPath()
    },

    // 获取入口位置（若无则回退到 {row:0, col:0}）
    async loadEntrancePosition() {
      try {
        const layout = await parkingApi.getParkingLotLayout(this.selectedLotId)
        const ep = layout?.entrance_position
        if (ep && typeof ep.row === 'number' && typeof ep.col === 'number') {
          this.currentEntrancePosition = { row: ep.row, col: ep.col }
        } else {
          this.currentEntrancePosition = { row: 0, col: 0 }
        }
      } catch (error) {
        this.currentEntrancePosition = { row: 0, col: 0 }
        console.error('加载入口位置失败，使用默认入口(0,0):', error)
      }
    },

    // 检测用户类型选择合适车位类型
    async resolveSpaceType() {
      // 无VIP体系，统一返回普通车位
      return 'standard'
    },

    // 调用后端计算最近可用车位路径，并将结果传递给可视化
    async computeNearestPath() {
      try {
        const spaceType = await this.resolveSpaceType()
        const start = this.currentEntrancePosition || { row: 0, col: 0 }
        const result = await parkingApi.findNearestAvailableSpace(
          this.selectedLotId,
          start,
          spaceType
        )

        const path = result?.navigation_path?.path || []
        const distance = result?.navigation_path?.distance ?? null
        const eta = result?.navigation_path?.estimated_time ?? null
        const space = result?.space || null
        if (Array.isArray(path) && path.length > 0 && space?.id) {
          this.showPathData = path
          this.highlightSpaceId = space.id
          this.navigationDistance = distance
          this.navigationTime = eta
          this.$message?.success?.('已自动规划到最近的可用车位')
        } else {
          this.showPathData = []
          this.highlightSpaceId = null
          this.navigationDistance = null
          this.navigationTime = null
          this.$message?.warning?.('未找到可用车位')
        }
      } catch (error) {
        this.showPathData = []
        this.highlightSpaceId = null
        this.navigationDistance = null
        this.navigationTime = null
        console.error('自动计算最近路径失败:', error)
        this.$message?.error?.('自动导航失败')
      }
    },

    // 若缺少车辆ID，则通过车牌补全
    async ensureVehicleId() {
      if (this.currentVehicleId || !this.currentPlate) return
      try {
        const vehicle = await vehicleApi.getVehicleByLicensePlate(this.currentPlate)
        if (vehicle && vehicle.id) {
          this.currentVehicleId = Number(vehicle.id)
        }
      } catch (error) {
        console.warn('根据车牌解析车辆ID失败:', error)
      }
    },

    // 占用推荐车位
    async occupySelectedSpace() {
      if (!this.selectedSpaceId) {
        this.$message.warning('请先在地图上选择一个车位')
        return
      }
      if (!this.currentVehicleId) {
        this.$message.warning('缺少车辆信息，无法占用')
        return
      }
      try {
        await parkingApi.occupyParkingSpace(this.selectedSpaceId, this.currentVehicleId)
        this.$message.success('占用成功，已更新车位状态')
        await this.loadParkingStatus()
        // 记录最近一次占用的坐标，用于离场导航
        this.lastOccupiedSpaceCoord = this.selectedSpaceCoord
        // 清空路径显示，等待用户点击“离场导航”
        this.showPathData = []
        this.navigationDistance = null
        this.navigationTime = null
      } catch (error) {
        console.error('占用车位失败:', error)
        this.$message.error(error?.response?.data?.detail || '占用失败')
      }
    },

    async computeExitPath() {
      if (!this.selectedLotId || !this.lastOccupiedSpaceCoord) {
        this.$message.warning('缺少车位或停车场信息')
        return
      }
      try {
        const layout = await parkingApi.getParkingLotLayout(this.selectedLotId)
        const exit = layout?.exit_position || { row: 0, col: 0 }
        const nav = await parkingApi.calculateNavigationPath(
          this.selectedLotId,
          this.lastOccupiedSpaceCoord,
          { row: exit.row ?? 0, col: exit.col ?? 0 }
        )
        const path = nav?.path || []
        this.showPathData = Array.isArray(path) ? path : []
        this.navigationDistance = nav?.distance ?? null
        this.navigationTime = nav?.estimated_time ?? null
        if (this.showPathData.length > 0) {
          this.$message.success('已生成离场最短路径')
        } else {
          this.$message.warning('未找到离场路径')
        }
      } catch (error) {
        console.error('离场路径计算失败:', error)
        this.$message.error('离场导航失败')
      }
    },

    formatDuration(seconds) {
      if (seconds == null) return '-'
      const s = Math.round(seconds)
      if (s >= 60) return `${Math.round(s / 60)} 分钟`
      return `${s} 秒`
    }
    ,
    // 打开预约弹窗
    openReservationDialog() {
      if (!this.selectedSpaceId) {
        this.$message.warning('请先选择车位')
        return
      }
      // 已移除VIP门控，直接打开预约弹窗
      const now = new Date()
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      this.reservationForm.start_time = now.toISOString()
      this.reservationForm.end_time = twoHoursLater.toISOString()
      this.reservationDialogVisible = true
    },
    // 已移除VIP页面跳转
    // 提交预约
    async submitReservation() {
      try {
        // 确保时间为ISO字符串
        const start = new Date(this.reservationForm.start_time)
        const end = new Date(this.reservationForm.end_time)
        const payload = {
          parking_space_id: this.selectedSpaceId,
          start_time: isNaN(start) ? this.reservationForm.start_time : start.toISOString(),
          end_time: isNaN(end) ? this.reservationForm.end_time : end.toISOString()
        }
        const res = await reservationsApi.createReservation(payload)
        this.lastReservationId = res?.id || res?.reservation_id || null
        this.$message.success('预约成功！您可前往“我的预约”查看详情')
        this.reservationDialogVisible = false
      } catch (error) {
        console.error('创建预约失败:', error)
        this.$message.error(error?.response?.data?.detail || '创建预约失败，请稍后再试')
      }
    },
    // 演示支付按钮：仅前端提示
    mockPay() {
      const id = this.lastReservationId ? `预约ID ${this.lastReservationId} ` : ''
      this.lastPaymentMessage = `已完成支付（演示）${id}`
      this.$message.success(this.lastPaymentMessage)
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-find {
  padding: 20px 0;
}

.find-header {
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    color: #333;
    font-size: 24px;
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
}

.lot-selector {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px 12px 4px 12px;
  margin-bottom: 16px;
}

.realtime-visual {
  margin-bottom: 20px;
}

  .current-status {
    h4 {
      color: #333;
      font-size: 16px;
      margin-bottom: 15px;
      font-weight: 600;
    }
  
  .status-cards {
    display: flex;
    gap: 15px;
    
    .status-card {
      flex: 1;
      background: white;
      border-radius: 15px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }
      
      .status-icon {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
      }
      
      .status-info {
        flex: 1;
        
        .status-number {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }
        
        .status-label {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}

.vehicle-ops {
  margin-top: 16px;
  h4 {
    color: #333;
    font-size: 16px;
    margin-bottom: 12px;
    font-weight: 600;
  }
}


.vehicle-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 15px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.vehicle-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.vehicle-line {
  display: flex;
  gap: 8px;
  align-items: center;
  .label {
    color: #666;
    font-size: 12px;
  }
  .value {
    color: #333;
    font-size: 14px;
    font-weight: 600;
  }
}

.vehicle-actions {
  display: flex;
  gap: 10px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .mobile-find {
    padding: 15px 0;
  }
  
  .find-header {
    margin-bottom: 25px;
    
    h2 {
      font-size: 20px;
    }
    
    p {
      font-size: 13px;
    }
  }
  
  .lot-selector {
    padding: 10px 10px 2px 10px;
  }
  
  .current-status {
    .status-cards {
      gap: 10px;
      
      .status-card {
        padding: 15px;
        gap: 12px;
        
        .status-icon {
          width: 40px;
          height: 40px;
          font-size: 20px;
        }
        
        .status-info {
          .status-number {
            font-size: 20px;
          }
          
          .status-label {
            font-size: 11px;
          }
        }
      }
    }
  }

  /* 移动端适配：避免 el-card__body 在窄边距下内容裁剪 */
  :deep(.el-card) {
    --el-card-padding: 10px;
  }
  :deep(.el-card__body) {
    overflow: visible;
  }
}
</style>