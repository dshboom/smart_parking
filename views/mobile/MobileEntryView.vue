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
          description="请确保车牌号码输入正确，系统将自动记录入场时间并分配停车位"
        />
      </div>
    </div>
    
    <div class="recent-entries" v-if="recentEntries.length > 0">
      <h3>最近入场记录</h3>
      <div class="entry-list">
        <div 
          v-for="entry in recentEntries" 
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
      <div class="in-parking-list" v-if="inParkingVehicles.length">
        <div 
          v-for="v in inParkingVehicles" 
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
            @click="handleExitItem(v.license_plate)"
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
import { vehicleExit, getVehiclesInParking } from '@/api/vehicle'
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
      recentEntries: [],
      inParkingVehicles: []
    }
  },
  computed: {
    
  },
  mounted() {
    this.loadRecentEntries()
    this.loadInParkingVehicles()
  },
  methods: {
    async handleEntry() {
      if (!this.$refs.entryPlateInput?.validate()) {
        this.$message.warning('请输入正确的车牌号码')
        return
      }
      
      this.loading = true
      try {
        // 入场API调用
        const resp = await this.$store.dispatch('vehicle/entry', {
          license_plate: this.entryPlate.replace(/[•·.]/g, '')
        })
        
        // 后端确认入场成功后，自动跳转到“寻找”页面，并传递车牌与车辆ID
        const plate = resp?.vehicle?.license_plate || this.entryPlate
        const vehicleId = resp?.vehicle?.id
        this.$message.success(`车辆 ${plate} 入场成功！`)
        this.entryPlate = ''
        this.loadRecentEntries()
        this.loadInParkingVehicles()

        // 跳转并触发自动导航（通过路由参数传递标记与车辆信息）
        const query = { autoNav: '1', plate }
        if (vehicleId) query.vehicleId = String(vehicleId)
        this.$router.push({ name: 'MobileFind', query })
      } catch (error) {
        if (error?.response?.status === 422) {
          this.$message.error('车牌不合法，请重新输入')
        } else {
          this.$message.error(error?.response?.data?.detail || error.message || '入场失败，请重试')
        }
      } finally {
        this.loading = false
      }
    },
    
    selectPlate(plateNumber) {
      this.entryPlate = plateNumber
    },
    
    async loadRecentEntries() {
      try {
        // 模拟获取最近入场记录
        const response = await this.$store.dispatch('vehicle/getRecentEntries')
        this.recentEntries = response?.data || []
      } catch (error) {
        console.error('加载最近入场记录失败:', error)
      }
    },
    async loadInParkingVehicles() {
      try {
        const resp = await getVehiclesInParking()
        this.inParkingVehicles = Array.isArray(resp) ? resp : (resp?.items || [])
      } catch (error) {
        console.error('加载入场车辆失败:', error)
      }
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
    async handleExitItem(licensePlate) {
      this.exitLoading = true
      try {
        const resp = await vehicleExit({ license_plate: licensePlate })
        const msg = resp?.message || `车辆 ${licensePlate} 出场成功！`
        this.$message.success(msg)
        this.loadInParkingVehicles()
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