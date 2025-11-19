<template>
  <div class="mobile-entry">
    <div class="entry-header">
      <h2>🚗 车辆入场</h2>
      <p>请输入车牌号码进行入场登记</p>
    </div>
    
    <div class="entry-form">
      <!-- 使用统一的车牌输入组件 -->
      <LicensePlateInput 
        v-model="entryPlate"
        ref="entryPlateInput"
        @enter="handleEntry"
      />
      
      <div class="entry-actions">
        <el-button 
          type="primary" 
          size="large" 
          class="entry-btn"
          :loading="loading"
          @click="handleEntry"
          :disabled="false"
        >
          <el-icon><Right /></el-icon>
          确认入场
        </el-button>
      </div>
      
      <div class="entry-tips">
        <el-alert
          title="入场提示"
          type="info"
          :closable="false"
          description="确认入场后会跳转至‘寻找车位’页，请先绑定车牌并选择车位，点击‘开始停车’后系统才会记录入场并开始计费"
        />
      </div>
    </div>
    
    <div class="recent-entries" v-if="recentRecords.length > 0">
      <h3>最近入场记录</h3>
      <div class="entry-list">
        <div 
          v-for="entry in recentRecords" 
          :key="entry.id"
          class="entry-item"
          @click="selectPlate(entry.license_plate)"
        >
          <div class="plate-number">{{ entry.license_plate }}</div>
          <div class="entry-time">{{ formatTime(entry.entry_time) }}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="exit-section">
    <div class="exit-header">
      <h2>🚙 车辆出场</h2>
      <p>请选择已入场车辆进行出场</p>
    </div>
    <div class="exit-form">
      <div class="in-parking-list" v-if="activeRecords.length">
        <div 
          v-for="v in activeRecords" 
          :key="v.id" 
          class="vehicle-item"
        >
          <div class="vehicle-info">
            <div class="plate">{{ v.license_plate }}</div>
            <div class="entry-time">入场：{{ formatTime(v.entry_time) }}</div>
          </div>
          <el-button 
            type="danger"
            size="small"
            :loading="exitLoading"
            @click="handleExitItem(v)"
          >
            确认出场
          </el-button>
        </div>
      </div>
      <el-empty v-else description="当前无入场车辆" />
    </div>
    <div class="exit-tips">
      <el-alert
        title="出场提示"
        type="info"
        :closable="false"
        description="选择列表中的车辆点击出场，系统将记录出场时间"
      />
    </div>
  </div>
</template>

<script>
import { Right } from '@element-plus/icons-vue'
import { getMyParkingHistory } from '@/api/user'
import { getParkingSpaces, exitAndSettle } from '@/api/parking'
import { getMyBalance } from '@/api/payments'
import { wsManager } from '@/utils/websocket'
import { getToken } from '@/utils/auth'
import LicensePlateInput from '@/components/LicensePlateInput.vue'

export default {
  name: 'MobileEntryView',
  components: {
    Right,
    LicensePlateInput
  },
  data() {
    return {
      entryPlate: '',
      loading: false,
      exitLoading: false,
      recentRecords: [], // 更改为 recentRecords
      activeRecords: [], // 更改为 activeRecords
      wsOffStarted: null,
      wsOffEnded: null
    }
  },
  async mounted() {
    await this.loadRecords() // 统一调用
    // 按需建立 WebSocket 连接并订阅用户专属提醒
    try { if (getToken()) wsManager.connect() } catch (e) {}
    this.wsOffStarted = wsManager.subscribe('my_parking_started', () => this.loadRecords())
    this.wsOffEnded = wsManager.subscribe('my_parking_ended', () => this.loadRecords())
  },
  unmounted() {
    try { if (typeof this.wsOffStarted === 'function') this.wsOffStarted() } catch (e) {}
    try { if (typeof this.wsOffEnded === 'function') this.wsOffEnded() } catch (e) {}
  },
  activated() {
    // 页面被激活时（例如从其他页面返回），重新加载数据
    this.loadRecords()
  },
  methods: {
    async loadRecords() {
      this.loading = true
      try {
        // 并行加载，提升效率
        const [recentResp, activeResp] = await Promise.all([
          getMyParkingHistory({ limit: 10 }),
          getMyParkingHistory({ status: 'active', limit: 50 })
        ])
        const recentList = Array.isArray(recentResp?.data) ? recentResp.data : (Array.isArray(recentResp) ? recentResp : [])
        let activeList = Array.isArray(activeResp?.data) ? activeResp.data : (Array.isArray(activeResp) ? activeResp : [])
        // 适配字段：为展示与出场操作补充 license_plate 与 space_id
        // 按停车场分组，查询占用车位并回填 space_id
        const byLot = new Map()
        activeList.forEach(r => {
          const lid = r.parking_lot_id
          if (!byLot.has(lid)) byLot.set(lid, [])
          byLot.get(lid).push(r)
        })
        const enriched = []
        for (const [lotId, records] of byLot.entries()) {
          let spaces = []
          try {
            const resp = await getParkingSpaces(lotId, { status_value: 'occupied' })
            spaces = Array.isArray(resp) ? resp : (Array.isArray(resp?.items) ? resp.items : [])
          } catch (e) {
            spaces = []
          }
          const spaceByVehicle = new Map(spaces.map(s => [s.vehicle_id, s]))
          records.forEach(r => {
            const s = spaceByVehicle.get(r.vehicle_id)
            enriched.push({
              ...r,
              license_plate: r.license_plate_snapshot,
              space_id: s?.id || null
            })
          })
        }
        this.recentRecords = recentList.map(r => ({
          ...r,
          license_plate: r.license_plate_snapshot
        }))
        this.activeRecords = enriched
      } catch (error) {
        console.error('加载停车记录失败:', error)
        this.$message.error('加载停车记录失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    async handleEntry() {
      if (!this.$refs.entryPlateInput?.validate()) {
        this.$message.warning('请输入正确的车牌号码')
        return
      }
      const plate = this.entryPlate.replace(/[•·.]/g, '')
      this.loading = true
      try {
        this.$message.success(`车牌 ${plate} 已确认，请选择车位开始计费`)
        this.entryPlate = ''
        const query = { autoNav: '1', plate }
        this.$router.push({ name: 'MobileFind', query })
      } catch (error) {
        this.$message.error(error?.response?.data?.detail || error.message || '入场流程异常，请重试')
      } finally {
        this.loading = false
      }
    },
    
    selectPlate(plateNumber) {
      this.entryPlate = plateNumber
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) {
        return '刚刚'
      } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`
      } else {
        return date.toLocaleDateString()
      }
    },
    async handleExitItem(record) {
      this.exitLoading = true
      try {
        const resp = await exitAndSettle(record.id)
        if (resp?.detail && resp.detail.includes('余额不足')) {
          this.$message.warning('余额不足或结算失败，请在支付页完成支付')
        } else {
          const bal = await getMyBalance()
          const amt = Number(resp?.amount || 0)
          this.$message.success(`车辆 ${record?.license_plate || ''} 已结算 ¥${amt.toFixed(2)}，余额 ¥${Number(bal?.balance || 0).toFixed(2)}`)
        }
        await this.loadRecords()
      } catch (error) {
        this.$message.error(error.response?.data?.detail || '出场失败，请重试')
      } finally {
        this.exitLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-entry {
  padding: 20px 0;
}

.entry-header {
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

/* 统一车牌输入组件的容器间距 */
.plate-container {
  margin-bottom: 20px;
}

.entry-actions {
  margin-bottom: 20px;
  
  .entry-btn {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 25px;
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    border: none;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.entry-tips {
  margin-bottom: 30px;
}

.recent-entries {
  h3 {
    color: #333;
    font-size: 16px;
    margin-bottom: 15px;
    font-weight: 600;
  }
  
  .entry-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .entry-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: #f8f9fa;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }
    
    .plate-number {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }
    
    .entry-time {
      color: #666;
      font-size: 12px;
    }
  }
}

.exit-section {
  margin-top: 30px;
}

.exit-header {
  text-align: center;
  margin-bottom: 20px;
  
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

.exit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.in-parking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vehicle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
}

.vehicle-info .plate {
  font-weight: 600;
  color: #333;
}

.vehicle-info .entry-time {
  color: #666;
  font-size: 12px;
}

.exit-tips {
  margin-top: 20px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .mobile-entry {
    padding: 15px 0;
  }
  
  .entry-header {
    margin-bottom: 25px;
    
    h2 {
      font-size: 20px;
    }
    
    p {
      font-size: 13px;
    }
  }
  
  .license-plate-input {
    margin-bottom: 20px;
  }
  
  .entry-actions {
    margin-bottom: 20px;
    
    .entry-btn {
      height: 45px;
      font-size: 15px;
    }
  }
}
</style>