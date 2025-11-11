<template>
  <div class="mobile-reservations">
    <div class="reservations-header">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h2>我的预约</h2>
      <div class="header-add" @click="showAddReservation = true">
        <el-icon><Plus /></el-icon>
      </div>
    </div>

    <div class="reservations-content">
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="reservation-tabs">
        <el-tab-pane label="进行中" name="active">
          <div v-if="activeReservations.length > 0" class="reservation-list">
            <div 
              v-for="reservation in activeReservations" 
              :key="reservation.id"
              class="reservation-card active"
            >
              <div class="reservation-header">
                <div class="lot-info">
                  <div class="lot-name">{{ reservation.parkingLotName }}</div>
                  <div class="space-number">{{ reservation.spaceNumber }}号车位</div>
                </div>
                <div class="status-badge active">
                  <el-icon><Clock /></el-icon>
                  进行中
                </div>
              </div>

              <div class="reservation-details">
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">预约时间</div>
                    <div class="detail-value">{{ formatDateTime(reservation.startTime) }}</div>
                  </div>
                </div>

                <div class="detail-item">
                  <el-icon><Timer /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">剩余时间</div>
                    <div class="detail-value countdown">{{ getRemainingTime(reservation.endTime) }}</div>
                  </div>
                </div>

                <div class="detail-item">
                  <el-icon><Location /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">车位位置</div>
                    <div class="detail-value">{{ reservation.location || 'A区地面层' }}</div>
                  </div>
                </div>
              </div>

              <div class="reservation-actions">
                <el-button 
                  type="primary" 
                  @click="navigateToParking(reservation)"
                  size="small"
                >
                  <el-icon><Position /></el-icon>
                  导航
                </el-button>
                <el-button 
                  type="warning" 
                  @click="extendReservation(reservation)"
                  size="small"
                >
                  <el-icon><Refresh /></el-icon>
                  延长
                </el-button>
                <el-button 
                  type="danger" 
                  @click="cancelReservation(reservation)"
                  size="small"
                >
                  <el-icon><Close /></el-icon>
                  取消
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon size="64" color="#ccc"><Calendar /></el-icon>
            <p>暂无进行中的预约</p>
            <el-button type="primary" @click="showAddReservation = true">
              立即预约
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="已完成" name="completed">
          <div v-if="completedReservations.length > 0" class="reservation-list">
            <div 
              v-for="reservation in completedReservations" 
              :key="reservation.id"
              class="reservation-card completed"
            >
              <div class="reservation-header">
                <div class="lot-info">
                  <div class="lot-name">{{ reservation.parkingLotName }}</div>
                  <div class="space-number">{{ reservation.spaceNumber }}号车位</div>
                </div>
                <div class="status-badge completed">
                  <el-icon><Check /></el-icon>
                  已完成
                </div>
              </div>

              <div class="reservation-details">
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">预约时间</div>
                    <div class="detail-value">{{ formatDateTime(reservation.startTime) }}</div>
                  </div>
                </div>

                <div class="detail-item">
                  <el-icon><Clock /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">结束时间</div>
                    <div class="detail-value">{{ formatDateTime(reservation.endTime) }}</div>
                  </div>
                </div>

                <div class="detail-item">
                  <el-icon><Money /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">费用</div>
                    <div class="detail-value">¥{{ reservation.fee.toFixed(2) }}</div>
                  </div>
                </div>
              </div>

              <div class="reservation-actions">
                <el-button 
                  type="info" 
                  @click="viewReservationDetails(reservation)"
                  size="small"
                >
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button 
                  type="success" 
                  @click="rebookReservation(reservation)"
                  size="small"
                >
                  <el-icon><Refresh /></el-icon>
                  再次预约
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon size="64" color="#ccc"><Check /></el-icon>
            <p>暂无已完成的预约</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="已取消" name="cancelled">
          <div v-if="cancelledReservations.length > 0" class="reservation-list">
            <div 
              v-for="reservation in cancelledReservations" 
              :key="reservation.id"
              class="reservation-card cancelled"
            >
              <div class="reservation-header">
                <div class="lot-info">
                  <div class="lot-name">{{ reservation.parkingLotName }}</div>
                  <div class="space-number">{{ reservation.spaceNumber }}号车位</div>
                </div>
                <div class="status-badge cancelled">
                  <el-icon><Close /></el-icon>
                  已取消
                </div>
              </div>

              <div class="reservation-details">
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">预约时间</div>
                    <div class="detail-value">{{ formatDateTime(reservation.startTime) }}</div>
                  </div>
                </div>

                <div class="detail-item">
                  <el-icon><Warning /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">取消时间</div>
                    <div class="detail-value">{{ formatDateTime(reservation.cancelTime) }}</div>
                  </div>
                </div>

                <div class="detail-item">
                  <el-icon><InfoFilled /></el-icon>
                  <div class="detail-content">
                    <div class="detail-label">取消原因</div>
                    <div class="detail-value">{{ reservation.cancelReason || '用户主动取消' }}</div>
                  </div>
                </div>
              </div>

              <div class="reservation-actions">
                <el-button 
                  type="info" 
                  @click="viewReservationDetails(reservation)"
                  size="small"
                >
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button 
                  type="primary" 
                  @click="rebookReservation(reservation)"
                  size="small"
                >
                  <el-icon><Refresh /></el-icon>
                  重新预约
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon size="64" color="#ccc"><Close /></el-icon>
            <p>暂无已取消的预约</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新增预约对话框 -->
    <el-dialog
      v-model="showAddReservation"
      title="新增预约"
      width="90%"
      top="10vh"
      class="add-reservation-dialog"
    >
      <div class="add-reservation-content">
        <el-form :model="newReservation" :rules="reservationRules" ref="reservationFormRef">
          <el-form-item label="停车场" prop="parkingLotId">
            <el-select 
              v-model="newReservation.parkingLotId" 
              placeholder="请选择停车场"
              style="width: 100%"
              @change="onParkingLotChange"
            >
              <el-option
                v-for="lot in parkingLots"
                :key="lot.id"
                :label="lot.name"
                :value="lot.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="车位" prop="parkingSpaceId">
            <el-select 
              v-model="newReservation.parkingSpaceId" 
              placeholder="请选择车位"
              style="width: 100%"
              :disabled="!newReservation.parkingLotId"
            >
              <el-option
                v-for="space in availableSpaces"
                :key="space.id"
                :label="`${space.position || space.space_number || ('#' + space.id)}号车位`"
                :value="space.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="预约日期" prop="date">
            <el-date-picker
              v-model="newReservation.date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              :disabled-date="disabledDate"
            />
          </el-form-item>

          <el-form-item label="预约时段" prop="timeSlot">
            <el-select 
              v-model="newReservation.timeSlot" 
              placeholder="选择时段"
              style="width: 100%"
            >
              <el-option label="08:00-10:00" value="08:00-10:00" />
              <el-option label="10:00-12:00" value="10:00-12:00" />
              <el-option label="12:00-14:00" value="12:00-14:00" />
              <el-option label="14:00-16:00" value="14:00-16:00" />
              <el-option label="16:00-18:00" value="16:00-18:00" />
              <el-option label="18:00-20:00" value="18:00-20:00" />
            </el-select>
          </el-form-item>

          <el-form-item label="车辆" prop="vehicleId">
            <el-select 
              v-model="newReservation.vehicleId" 
              placeholder="请选择车辆"
              style="width: 100%"
            >
              <el-option
                v-for="vehicle in userVehicles"
                :key="vehicle.id"
                :label="`${vehicle.plateNumber} (${vehicle.brand})`"
                :value="vehicle.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="newReservation.remark"
              type="textarea"
              :rows="2"
              placeholder="选填，特殊需求说明"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showAddReservation = false">取消</el-button>
        <el-button type="primary" @click="submitReservation" :loading="submitting">
          确认预约
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  ArrowLeft, Plus, Clock, Calendar, Timer, Location,
  Position, Refresh, Close, Check, Warning, InfoFilled,
  View, Money
} from '@element-plus/icons-vue'

import {
  getMyReservations,
  createMyReservation,
  cancelMyReservation,
  extendMyReservation,
  rebookReservation,
  getReservationNavigation,
  getMyReservationDetail
} from '@/api/reservations'

import { getParkingLots, getParkingSpaces } from '@/api/parking'
import { getMyVehicles } from '@/api/user'

export default {
  name: 'MobileReservationsView',
  components: {
    ArrowLeft, Plus, Clock, Calendar, Timer, Location,
    Position, Refresh, Close, Check, Warning, InfoFilled,
    View, Money
  },
  data() {
    return {
      activeTab: 'active',
      showAddReservation: false,
      submitting: false,
      newReservation: {
        parkingLotId: '',
        parkingSpaceId: '',
        date: '',
        timeSlot: '',
        vehicleId: '',
        remark: ''
      },
      reservationRules: {
        parkingLotId: [
          { required: true, message: '请选择停车场', trigger: 'change' }
        ],
        parkingSpaceId: [
          { required: true, message: '请选择车位', trigger: 'change' }
        ],
        date: [
          { required: true, message: '请选择预约日期', trigger: 'change' }
        ],
        timeSlot: [
          { required: true, message: '请选择预约时段', trigger: 'change' }
        ],
        // 车辆可选，不强制
      },
      parkingLots: [],
      availableSpaces: [],
      userVehicles: [],
      activeReservations: [],
      completedReservations: [],
      cancelledReservations: []
    }
  },
  mounted() {
    this.initData()
  },
  methods: {
    async initData() {
      await Promise.all([
        this.loadParkingLots(),
        this.loadUserVehicles(),
        this.loadReservations()
      ])
    },
    goBack() {
      this.$router.back()
    },

    async loadReservations() {
      try {
        const resp = await getMyReservations({ limit: 200 })
        const list = (resp && resp.reservations) || []
        const mapped = list.map(r => ({
          id: r.id,
          parkingLotName: r.parkingSpace?.lotName || '未知停车场',
          spaceNumber: r.parkingSpace?.position || '',
          location: r.parkingSpace?.lotAddress || '',
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
          // 补充展示用字段
          fee: 0,
          cancelTime: r.updatedAt,
          canCancel: r.canCancel,
          canExtend: r.canExtend,
          parkingSpaceId: r.parkingSpace?.id
        }))
        this.activeReservations = mapped.filter(x => x.status === 'active')
        this.completedReservations = mapped.filter(x => x.status === 'completed')
        this.cancelledReservations = mapped.filter(x => x.status === 'cancelled')
      } catch (error) {
        console.error('加载预约失败:', error)
        this.$message.error('加载预约失败')
      }
    },

    async loadUserVehicles() {
      try {
        const list = await getMyVehicles()
        this.userVehicles = (list || []).map(v => ({
          id: v.id || v.vehicle_id || v.license_plate,
          plateNumber: v.license_plate,
          brand: v.brand || '未知'
        }))
      } catch (error) {
        console.error('加载车辆失败:', error)
      }
    },

    async loadParkingLots() {
      try {
        const lots = await getParkingLots({ limit: 100 })
        this.parkingLots = lots || []
      } catch (e) {
        console.error('加载停车场失败:', e)
      }
    },

    async onParkingLotChange() {
      if (!this.newReservation.parkingLotId) {
        this.availableSpaces = []
        return
      }
      try {
        const spacesRes = await getParkingSpaces(this.newReservation.parkingLotId, { is_available: true })
        const spaces = (spacesRes || []).filter(s => !s.is_reserved && !s.is_occupied && s.is_available)
        this.availableSpaces = spaces
      } catch (e) {
        console.error('加载车位失败:', e)
        this.availableSpaces = []
      }
    },

    disabledDate(date) {
      return date < new Date().setHours(0, 0, 0, 0)
    },

    formatDateTime(dateTimeStr) {
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getRemainingTime(endTimeStr) {
      const now = new Date()
      const endTime = new Date(endTimeStr)
      const diff = endTime - now
      
      if (diff <= 0) return '已过期'
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      } else {
        return `${minutes}分钟`
      }
    },

    async navigateToParking(reservation) {
      try {
        const nav = await getReservationNavigation(reservation.id)
        const pos = nav?.space_position || reservation.spaceNumber
        this.$message.info(`导航至 ${reservation.parkingLotName} ${pos}`)
      } catch (e) {
        this.$message.error('获取导航信息失败')
      }
    },

    async extendReservation(reservation) {
      try {
        const { value } = await this.$prompt('请输入要延长的小时数(1-24)', '延长预约', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /^(?:[1-9]|1\d|2[0-4])$/,
          inputErrorMessage: '请输入1-24的整数'
        })
        const hours = Number(value)
        await extendMyReservation(reservation.id, hours)
        this.$message.success('预约已延长')
        await this.loadReservations()
      } catch (e) {
        if (e !== 'cancel') this.$message.error('延长预约失败')
      }
    },

    async cancelReservation(reservation) {
      try {
        await this.$confirm('确定要取消这个预约吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await cancelMyReservation(reservation.id)
        await this.loadReservations()
        this.$message.success('预约已取消')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('取消预约失败')
        }
      }
    },

    async viewReservationDetails(reservation) {
      try {
        const detail = await getMyReservationDetail(reservation.id)
        this.$message.info(`预约详情：${detail?.parkingSpace?.lotName || ''} ${detail?.parkingSpace?.position || ''}`)
      } catch (e) {
        this.$message.error('获取预约详情失败')
      }
    },

    rebookReservation(reservation) {
      // 使用原预约信息填充新预约表单
      this.newReservation = {
        parkingLotId: '',
        parkingSpaceId: reservation.parkingSpaceId || '',
        date: '',
        timeSlot: '',
        vehicleId: '',
        remark: ''
      }
      this.showAddReservation = true
    },

    // 提交新增预约
    async submitReservation() {
      try {
        this.submitting = true
        await this.$refs.reservationFormRef.validate()
        const { startISO, endISO } = this.computeStartEndISO(this.newReservation.date, this.newReservation.timeSlot)
        const payload = {
          parking_space_id: this.newReservation.parkingSpaceId,
          start_time: startISO,
          end_time: endISO
        }
        await createMyReservation(payload)
        this.$message.success('预约创建成功')
        this.showAddReservation = false
        await this.loadReservations()
      } catch (e) {
        if (e !== 'cancel') this.$message.error('预约创建失败')
      } finally {
        this.submitting = false
      }
    },

    // 工具：将日期+时段转换为 ISO 开始/结束时间
    computeStartEndISO(dateVal, timeSlot) {
      const [startStr, endStr] = (timeSlot || '').split('-')
      const d = new Date(dateVal)
      const makeISO = (hhmm) => {
        const [h, m] = hhmm.split(':').map(x => Number(x))
        const t = new Date(d)
        t.setHours(h, m, 0, 0)
        return t.toISOString()
      }
      return { startISO: makeISO(startStr), endISO: makeISO(endStr) }
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-reservations {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.reservations-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-back {
    margin-right: 15px;
    cursor: pointer;
    color: #666;
    font-size: 20px;
    
    &:hover {
      color: #409eff;
    }
  }

  h2 {
    flex: 1;
    text-align: center;
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }

  .header-add {
    margin-left: 15px;
    cursor: pointer;
    color: #409eff;
    font-size: 20px;
    
    &:hover {
      color: #66b1ff;
    }
  }
}

.reservations-content {
  padding: 20px;
}

.reservation-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
    background: white;
    border-radius: 15px;
    padding: 5px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-tabs__nav) {
    display: flex;
    width: 100%;
  }
  
  :deep(.el-tabs__item) {
    flex: 1;
    text-align: center;
    padding: 0 10px;
    height: 40px;
    line-height: 40px;
    font-weight: 500;
  }
  
  :deep(.el-tabs__active-bar) {
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    height: 3px;
    border-radius: 2px;
  }
}

.reservation-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reservation-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
  
  &.active {
    border-left: 4px solid #67c23a;
  }
  
  &.completed {
    border-left: 4px solid #909399;
  }
  
  &.cancelled {
    border-left: 4px solid #f56c6c;
  }
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  .lot-info {
    .lot-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    
    .space-number {
      font-size: 14px;
      color: #666;
    }
  }
  
  .status-badge {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    
    &.active {
      background: #f0f9ff;
      color: #67c23a;
      
      .el-icon {
        margin-right: 4px;
      }
    }
    
    &.completed {
      background: #f4f4f5;
      color: #909399;
      
      .el-icon {
        margin-right: 4px;
      }
    }
    
    &.cancelled {
      background: #fef0f0;
      color: #f56c6c;
      
      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

.reservation-details {
  margin-bottom: 15px;
  
  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .el-icon {
      margin-right: 12px;
      color: #409eff;
      font-size: 16px;
    }
    
    .detail-content {
      flex: 1;
      
      .detail-label {
        font-size: 12px;
        color: #999;
        margin-bottom: 2px;
      }
      
      .detail-value {
        font-size: 14px;
        color: #333;
        font-weight: 500;
        
        &.countdown {
          color: #f56c6c;
          font-weight: 600;
        }
      }
    }
  }
}

.reservation-actions {
  display: flex;
  gap: 8px;
  
  .el-button {
    flex: 1;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #ccc;
  
  .el-icon {
    margin-bottom: 15px;
  }
  
  p {
    margin-bottom: 20px;
    font-size: 14px;
    color: #999;
  }
}

.add-reservation-dialog {
  :deep(.el-dialog) {
    border-radius: 15px;
  }
  
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #666;
  }
  
  :deep(.el-select),
  :deep(.el-date-editor) {
    width: 100%;
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .reservations-content {
    padding: 15px;
  }
  
  .reservation-card {
    padding: 15px;
  }
  
  .reservation-actions {
    flex-wrap: wrap;
    
    .el-button {
      min-width: calc(50% - 4px);
    }
  }
}

@media screen and (max-width: 375px) {
  .reservations-header {
    padding: 12px 15px;
    
    h2 {
      font-size: 16px;
    }
  }
  
  .reservations-content {
    padding: 12px;
  }
  
  .reservation-card {
    padding: 12px;
  }
  
  .reservation-actions {
    .el-button {
      min-width: 100%;
    }
  }
}
</style>