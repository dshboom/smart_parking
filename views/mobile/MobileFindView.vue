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

    <!-- 通用操作区：入场前也可见 -->
    <div class="find-actions">
      <el-button
        type="primary"
        :disabled="!canStartParking"
        @click="occupySelectedSpace"
      >开始停车</el-button>
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
    <div class="vehicle-ops" v-if="hasActiveRecord">
      <h4>当前车辆</h4>
      <div class="vehicle-card">
      <div class="vehicle-info">
          <div class="vehicle-line">
            <span class="label">车牌</span>
            <span class="value">{{ currentPlate || '未知' }}</span>
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
          <el-button type="warning" :disabled="!canReserve" :loading="reserveLoading" @click="reserveSelectedSpace">预约此车位</el-button>
          <el-button :disabled="!selectedLotId" @click="computeNearestPath">重新规划</el-button>
          <el-button type="success" :disabled="!canShowExitNav" @click="computeExitPath">离场导航</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Position, OfficeBuilding } from '@element-plus/icons-vue'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'
import { getParkingLots, getParkingLotStats, getParkingLotLayout, findNearestAvailableSpace, calculateNavigationPath, occupyParkingSpace, reserveParkingSpace } from '@/api/parking'
import { settleParkingFee } from '@/api/payments'
import * as userApi from '@/api/user'
import { getToken } from '@/utils/auth'
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
      selectedSpaceIsAvailable: false,
      reserveLoading: false,
      lastOccupiedSpaceCoord: null,
      // 当前车辆信息（来自路由参数）
      currentPlate: '',
      // 路径指标
      navigationDistance: null,
      navigationTime: null
      // 已移除VIP体系相关状态
    }
  },
  mounted() {
    this.loadParkingLots()
    this.prepareAutoNavFromRoute()
    // 尝试从 sessionStorage 恢复车牌号
    const savedPlate = sessionStorage.getItem('currentPlate')
    if (savedPlate) {
      this.currentPlate = savedPlate
    }
    // 检查绑定状态（需要登录）
    const t = getToken()
    if (!t) {
      const current = this.$route?.fullPath || '/'
      this.$router.push(`/login?redirect=${encodeURIComponent(current)}`)
    }
  },
  computed: {
    canShowExitNav() {
      return !!(this.selectedLotId && this.lastOccupiedSpaceCoord)
    }
    ,
    canReserve() {
      return !!(this.selectedLotId && this.selectedSpaceId && this.selectedSpaceIsAvailable && getToken())
    }
    ,
    hasActiveRecord() {
      return !!this.lastOccupiedSpaceCoord
    }
    ,
    canStartParking() {
      return !!(this.selectedLotId && (this.selectedSpaceId || this.highlightSpaceId))
    }
  },
  methods: {
    onSpaceSelected(payload) {
      // 记录选择的车位及其坐标，清空现有路径
      this.selectedSpaceId = (payload && (payload.id || payload.spaceId)) || null
      this.selectedSpaceCoord = payload && typeof payload.row === 'number' && typeof payload.col === 'number'
        ? { row: payload.row, col: payload.col }
        : null
      this.selectedSpaceIsAvailable = !!(payload && String(payload.status).toLowerCase() === 'available' && !payload.is_reserved && !payload.is_under_maintenance)
      this.showPathData = []
      this.navigationDistance = null
      this.navigationTime = null
      if (this.selectedSpaceId && this.selectedSpaceCoord) {
        if (!this.hasActiveRecord) {
          this.$confirm(`当前无入场车辆，是否预约车位 #${this.selectedSpaceId}？`, '预约确认', {
            confirmButtonText: '预约',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.reserveSelectedSpace()
          }).catch(() => {})
        } else {
          this.$confirm(`是否导航前往心仪车位 #${this.selectedSpaceId}？`, '导航确认', {
            confirmButtonText: '导航',
            cancelButtonText: '取消',
            type: 'info'
          }).then(async () => {
            try {
              await this.loadEntrancePosition()
              const start = this.currentEntrancePosition || { row: 0, col: 0 }
              const nav = await calculateNavigationPath(
                this.selectedLotId,
                start,
                { row: this.selectedSpaceCoord.row, col: this.selectedSpaceCoord.col }
              )
              const path = Array.isArray(nav?.path) ? nav.path : []
              this.showPathData = path
              this.highlightSpaceId = this.selectedSpaceId
              this.navigationDistance = nav?.distance ?? (Array.isArray(path) ? path.length : null)
              this.navigationTime = nav?.estimated_time ?? null
              if (this.showPathData.length > 0) {
                this.$message.success('已生成导航路径')
              } else {
                this.$message.warning('未找到可达路径')
              }
            } catch (e) {
              this.$message.error('导航生成失败')
            }
          }).catch(() => {})
        }
      }
    },

    async reserveSelectedSpace() {
      if (!this.selectedSpaceId) {
        this.$message.warning('请先在地图上选择一个空闲车位')
        return
      }
      if (!this.selectedSpaceIsAvailable) {
        this.$message.warning('该车位不可预约')
        return
      }
      if (!getToken()) {
        const current = this.$route?.fullPath || '/'
        this.$router.push(`/login?redirect=${encodeURIComponent(current)}`)
        return
      }
      try {
        this.reserveLoading = true
        const me = await userApi.getInfo()
        const userId = (me && me.data && me.data.id) || me?.id
        const normalizedCurrent = this.normalizePlate(this.currentPlate)
        if (!userId || !normalizedCurrent) {
          this.$message.warning('缺少车牌，请先在入场页确认车牌')
          const current = this.$route?.fullPath || '/'
          this.$router.push(`/mobile/entry?redirect=${encodeURIComponent(current)}`)
          this.reserveLoading = false
          return
        }
        const reservedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
        const rsv = await reserveParkingSpace(this.selectedSpaceId, { user_id: userId, license_plate: normalizedCurrent, reserved_until: reservedUntil })
        try {
          await settleParkingFee({ reservation_id: rsv?.id, amount: 2, payment_type: 'RESERVATION_FEE' })
          this.$message.success('预约成功，已扣费 ¥2.00')
        } catch (e) {
          this.$message.warning('预约成功，余额不足或扣费失败')
        }
        await this.loadParkingStatus()
      } catch (error) {
        const status = error?.response?.status
        if (status === 401) {
          const current = this.$route?.fullPath || '/'
          this.$router.push(`/login?redirect=${encodeURIComponent(current)}`)
          return
        }
        this.$message.error(error?.response?.data?.detail || '预约失败')
      } finally {
        this.reserveLoading = false
      }
    },
    // 已移除VIP门控，无需加载
    async loadParkingLots() {
      try {
        this.loading = true
        const lots = await getParkingLots()
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
        const stats = await getParkingLotStats(this.selectedLotId)
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
      if (q.plate) {
        this.currentPlate = this.normalizePlate(q.plate)
        // 将规范化后的车牌号存入 sessionStorage
        sessionStorage.setItem('currentPlate', this.currentPlate)
      }
    },

    // 在选定车场后触发计算最近路径
    async autoComputeNearestPathIfRequested() {
      if (!this.autoNavRequested || !this.selectedLotId) return
      await this.loadEntrancePosition()
      await this.computeNearestPath()
    },

    // 获取入口位置（若无则回退到 {row:0, col:0}）
    async loadEntrancePosition() {
      try {
        const layout = await getParkingLotLayout(this.selectedLotId)
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
        const nearest = await findNearestAvailableSpace(this.selectedLotId, start, spaceType)
        if (nearest && nearest.space_id) {
          // 询问是否导航前往推荐车位
          this.$confirm(`为您推荐最近车位 #${nearest.space_id}，是否导航前往？`, '导航确认', {
            confirmButtonText: '导航',
            cancelButtonText: '取消',
            type: 'info'
          }).then(async () => {
            try {
              const nav = await calculateNavigationPath(this.selectedLotId, start, { row: nearest.row, col: nearest.col })
              const path = Array.isArray(nav?.path) ? nav.path : []
              this.showPathData = path
              this.highlightSpaceId = nearest.space_id
              this.selectedSpaceId = nearest.space_id
              this.selectedSpaceCoord = { row: nearest.row, col: nearest.col }
              this.navigationDistance = nearest.distance ?? null
              this.navigationTime = (Array.isArray(path) ? path.length : 0)
              this.$message?.success?.('已生成导航路径')
            } catch (e) {
              this.$message.error('导航生成失败')
            }
          }).catch(() => {})
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

    // 不再通过管理端车辆接口补全ID，直接使用用户车牌与专属开始停车接口

    // 选择车位后开始我的停车（占用+计费）
    async occupySelectedSpace() {
      const targetSpaceId = this.selectedSpaceId || this.highlightSpaceId
      if (!targetSpaceId) {
        this.$message.warning('请先在地图上选择一个车位')
        return
      }
      if (!getToken()) {
        const current = this.$route?.fullPath || '/'
        this.$router.push(`/login?redirect=${encodeURIComponent(current)}`)
        return
      }
      try {
        const targetCoord = this.selectedSpaceCoord || (this.highlightSpaceId ? { row: this.selectedSpaceCoord?.row ?? null, col: this.selectedSpaceCoord?.col ?? null } : null)
        const normPlate = this.normalizePlate(this.currentPlate)
        if (!normPlate) {
          this.$message.warning('缺少车牌，请先在入场页确认车牌')
          const query = { autoNav: '1' }
          this.$router.push({ name: 'MobileEntry', query })
          return
        }
        await occupyParkingSpace(targetSpaceId, { license_plate: normPlate })
        this.$message.success('入场成功，已占用车位并开始计费')
        await this.loadParkingStatus()
        this.lastOccupiedSpaceCoord = targetCoord || this.selectedSpaceCoord
        this.showPathData = []
        this.navigationDistance = null
        this.navigationTime = null
      } catch (error) {
        console.error('开始停车失败:', error)
        const status = error?.response?.status
        if (status === 401) {
          const current = this.$route?.fullPath || '/'
          this.$router.push(`/login?redirect=${encodeURIComponent(current)}`)
          return
        }
        const detail = error?.response?.data?.detail
        this.$message.error(detail ? `开始停车失败：${detail}` : '开始停车失败')
      }
    },

    // 规范化车牌：移除分隔符与空格并转为大写
    normalizePlate(plate) {
      if (!plate) return ''
      return String(plate).replace(/[•·\.\s]/g, '').toUpperCase()
    },

    // 检查当前车牌是否已绑定到账户
    

    async computeExitPath() {
      if (!this.selectedLotId || !this.lastOccupiedSpaceCoord) {
        this.$message.warning('缺少车位或停车场信息')
        return
      }
      try {
        const layout = await getParkingLotLayout(this.selectedLotId)
        const exit = layout?.exit_position || { row: 0, col: 0 }
        const nav = await calculateNavigationPath(
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
