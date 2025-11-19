<template>
  <div class="mobile-history">
    <div class="history-header">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h2>停车记录</h2>
      <div class="header-filter" @click="showFilter = true">
        <el-icon><Filter /></el-icon>
      </div>
    </div>

    <div class="history-content" v-loading="loading">
      <!-- 统计卡片 -->
      <div class="stats-section">
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="24" color="#67c23a"><Van /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalParkings }}</div>
              <div class="stat-label">总停车次数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="24" color="#409eff"><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalDuration }}</div>
              <div class="stat-label">总停车时长</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="24" color="#e6a23c"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">¥{{ totalAmount.toFixed(2) }}</div>
              <div class="stat-label">总消费金额</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-tags" v-if="hasActiveFilters">
        <el-tag
          v-for="filter in activeFilters"
          :key="filter.key"
          closable
          @close="removeFilter(filter.key)"
          type="info"
          size="small"
        >
          {{ filter.label }}
        </el-tag>
        <el-button type="text" @click="clearAllFilters" size="small">
          清除全部
        </el-button>
      </div>

      <!-- 停车记录列表 -->
      <div class="history-list">
        <div v-if="parkingHistory.length > 0">
          <div 
            v-for="record in parkingHistory" 
            :key="record.id"
            class="history-item"
          >
            <div class="record-header">
              <div class="record-date">
                {{ formatDate(record.entryTime) }}
              </div>
              <div class="record-status" :class="record.status">
                <el-icon size="14">
                  <component :is="getStatusIcon(record.status)" />
                </el-icon>
                {{ getStatusText(record.status) }}
              </div>
            </div>

            <div class="record-content">
              <div class="parking-info">
                <div class="lot-name">{{ record.parkingLotName }}</div>
                <div class="space-info">
                  <span class="space-number">{{ record.spaceNumber }}号车位</span>
                  <span class="vehicle-info">{{ record.vehiclePlate }}</span>
                </div>
              </div>

              <div class="time-info">
                <div class="time-item">
                  <div class="time-label">入场时间</div>
                  <div class="time-value">{{ formatTime(record.entryTime) }}</div>
                </div>
                <div class="duration-arrow">
                  <el-icon><ArrowRight /></el-icon>
                </div>
                <div class="time-item">
                  <div class="time-label">出场时间</div>
                  <div class="time-value">{{ formatTime(record.exitTime) || '未出场' }}</div>
                </div>
              </div>

              <div class="fee-info">
                <div class="duration">
                  <el-icon><Clock /></el-icon>
                  停车时长: {{ record.duration || '计算中...' }}
                </div>
                <div class="fee">
                  <span class="fee-label">费用:</span>
                  <span class="fee-amount">¥{{ record.fee.toFixed(2) }}</span>
                </div>
              </div>

              <div class="record-actions">
                <el-button 
                  type="primary" 
                  @click="viewDetails(record)"
                  size="small"
                  plain
                >
                  <el-icon><Document /></el-icon>
                  详情
                </el-button>
                
                <el-button 
                  v-if="record.status === 'parking'"
                  type="warning" 
                  @click="extendParking(record)"
                  size="small"
                  plain
                >
                  <el-icon><Refresh /></el-icon>
                  延长
                </el-button>
                <el-button 
                  v-if="record.status === 'parking'"
                  type="danger" 
                  @click="prepareExit(record)"
                  size="small"
                  plain
                >
                  <el-icon><SwitchButton /></el-icon>
                  准备出场
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 加载更多 -->
          <div class="load-more" v-if="hasMore">
            <el-button 
              :loading="loadingMore" 
              @click="loadMore"
              type="link"
            >
              加载更多
            </el-button>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <el-icon size="64" color="#ccc"><Document /></el-icon>
          <p>暂无停车记录</p>
          <el-button type="primary" @click="goToParking">
            立即停车
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选对话框 -->
    <el-drawer
      v-model="showFilter"
      title="筛选条件"
      direction="btt"
      size="70%"
      class="filter-drawer"
    >
      <div class="filter-content">
        <div class="filter-section">
          <div class="filter-title">时间范围</div>
          <div class="filter-options">
            <el-radio-group v-model="filters.timeRange">
              <el-radio label="today">今天</el-radio>
              <el-radio label="week">本周</el-radio>
              <el-radio label="month">本月</el-radio>
              <el-radio label="custom">自定义</el-radio>
            </el-radio-group>
            <div v-if="filters.timeRange === 'custom'" class="custom-date-range">
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                style="width: 100%; margin-top: 10px;"
              />
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-title">停车场</div>
          <div class="filter-options">
            <el-select 
              v-model="filters.parkingLot" 
              placeholder="全部停车场"
              clearable
              size="small"
              style="width: 100%;"
            >
              <el-option
                v-for="lot in parkingLots"
                :key="lot.id"
                :label="lot.name"
                :value="String(lot.id)"
              />
            </el-select>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-title">状态</div>
          <div class="filter-options">
            <el-checkbox-group v-model="filters.status">
              <el-checkbox label="parking">停车中</el-checkbox>
              <el-checkbox label="completed">已完成</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-title">费用范围</div>
          <div class="filter-options">
            <div class="fee-range">
              <el-input-number
                v-model="filters.minFee"
                :min="0"
                :max="filters.maxFee"
                :precision="2"
                size="small"
                placeholder="最低"
                style="width: 45%;"
              />
              <span style="margin: 0 5%;">-</span>
              <el-input-number
                v-model="filters.maxFee"
                :min="filters.minFee"
                :precision="2"
                size="small"
                placeholder="最高"
                style="width: 45%;"
              />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="filter-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="applyFilters">应用筛选</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetails"
      title="停车详情"
      width="90%"
      top="10vh"
      class="details-dialog"
    >
      <div class="details-content" v-if="selectedRecord">
        <div class="detail-section">
          <div class="detail-title">基本信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">停车场:</span>
              <span class="detail-value">{{ selectedRecord.parkingLotName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">车位号:</span>
              <span class="detail-value">{{ selectedRecord.spaceNumber }}号</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">车牌号:</span>
              <span class="detail-value">{{ selectedRecord.vehiclePlate }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">状态:</span>
              <span class="detail-value">{{ getStatusText(selectedRecord.status) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">时间信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">入场时间:</span>
              <span class="detail-value">{{ formatDateTime(selectedRecord.entryTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">出场时间:</span>
              <span class="detail-value">{{ formatDateTime(selectedRecord.exitTime) || '未出场' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">停车时长:</span>
              <span class="detail-value">{{ selectedRecord.duration || '计算中...' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">费用信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">停车费:</span>
              <span class="detail-value">¥{{ selectedRecord.fee.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">支付方式:</span>
              <span class="detail-value">{{ selectedRecord.paymentMethod || '账户余额' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">支付状态:</span>
              <span class="detail-value">{{ selectedRecord.paymentStatus || '已支付' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="selectedRecord.photos && selectedRecord.photos.length > 0">
          <div class="detail-title">现场照片</div>
          <div class="photo-grid">
            <div 
              v-for="(photo, index) in selectedRecord.photos" 
              :key="index"
              class="photo-item"
              @click="viewPhoto(photo)"
            >
              <img :src="photo" alt="停车照片" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetails = false">关闭</el-button>
        
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  ArrowLeft, Filter as FilterIcon, Van, Clock, Money, ArrowRight,
  Document, Refresh, SwitchButton, View as ViewIcon,
  Top, CircleCheck, CircleClose, Warning, Calendar,
  Picture as PictureIcon
} from '@element-plus/icons-vue'
import { getMyParkingHistory } from '@/api/user'
import { ElMessage } from 'element-plus'

export default {
  name: 'MobileHistoryView',
  components: {
    ArrowLeft, FilterIcon, Van, Clock, Money, ArrowRight,
    Document, Refresh, SwitchButton, ViewIcon,
    Top, CircleCheck, CircleClose, Warning, Calendar,
    PictureIcon
  },
  data() {
    return {
      totalParkings: 0,
      totalDuration: '0小时0分',
      totalAmount: 0,
      showFilter: false,
      showDetails: false,
      selectedRecord: null,
      loadingMore: false,
      hasMore: true,
      loading: false,
      skip: 0,
      limit: 10,
      filters: {
        timeRange: 'month',
        dateRange: [],
        parkingLot: '',
        status: ['parking', 'completed'],
        minFee: 0,
        maxFee: 9999
      },
      parkingLots: [],
      filterStorageKey: 'mobileHistoryFilters',
      originalFilters: null,
      parkingHistory: []
    }
  },
  computed: {
    hasActiveFilters() {
      return this.activeFilters.length > 0
    },
    activeFilters() {
      const filters = []
      if (this.filters.timeRange !== 'month') {
        const timeRangeMap = {
          'today': '今天',
          'week': '本周',
          'custom': '自定义时间'
        }
        filters.push({
          key: 'timeRange',
          label: timeRangeMap[this.filters.timeRange]
        })
      }
      if (this.filters.parkingLot) {
        const lot = this.parkingLots.find(l => String(l.id) === String(this.filters.parkingLot))
        const lotName = lot?.name || '指定停车场'
        filters.push({
          key: 'parkingLot',
          label: `停车场: ${lotName}`
        })
      }
      if (Array.isArray(this.filters.status) && this.filters.status.length === 1) {
        const s = this.filters.status[0]
        const text = s === 'parking' ? '停车中' : (s === 'completed' ? '已完成' : '未知')
        filters.push({
          key: 'status',
          label: `状态: ${text}`
        })
      }
      if (this.filters.minFee > 0 || this.filters.maxFee < 9999) {
        filters.push({
          key: 'fee',
          label: `费用: ¥${this.filters.minFee} - ¥${this.filters.maxFee}`
        })
      }
      return filters
    }
  },
  mounted() {
    this.restoreFilters()
    this.originalFilters = { ...this.filters }
    this.loadStats()
    this.loadParkingLots()
    this.reloadHistory()
  },
  methods: {
    goBack() {
      this.$router.back()
    },

    goToParking() {
      this.$router.push('/mobile/find')
    },

    getStatusIcon(status) {
      const iconMap = {
        'parking': 'Top',
        'completed': 'CircleCheck',
        'cancelled': 'CircleClose'
      }
      return iconMap[status] || 'Warning'
    },

    getStatusText(status) {
      const textMap = {
        'parking': '停车中',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return textMap[status] || '未知'
    },

    formatDate(dateTimeStr) {
      const date = new Date(dateTimeStr)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    formatTime(dateTimeStr) {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    viewDetails(record) {
      this.selectedRecord = record
      this.showDetails = true
    },

    

    extendParking(_record) {
      ElMessage.info('延长停车功能开发中...')
      // 实际项目中这里会打开延长停车的对话框
    },

    prepareExit(_record) {
      this.$confirm('确定要准备出场吗？系统将为您计算停车费用。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        ElMessage.success('已为您准备出场，请前往出口')
        // 实际项目中这里会调用准备出场的API
      }).catch(() => {})
    },

    viewPhoto(photo) {
      // 实际项目中这里会打开图片查看器
      window.open(photo, '_blank')
    },

    async loadStats() {
      try {
        const stats = await this.$store.dispatch('user/getStats')
        const hours = Number(stats?.totalHours || 0)
        const h = Math.floor(hours)
        const m = Math.round((hours - h) * 60)
        this.totalParkings = Number(stats?.totalParkings || 0)
        this.totalAmount = Number(stats?.totalAmount || 0)
        this.totalDuration = `${h}小时${m}分`
      } catch (error) {
        // 保持默认统计，不打断页面展示
        console.warn('加载统计失败:', error)
      }
    },

    deriveDateRange() {
      const now = new Date()
      let start = null
      let end = null
      if (this.filters.timeRange === 'today') {
        const s = new Date(now)
        s.setHours(0, 0, 0, 0)
        const e = new Date(now)
        e.setHours(23, 59, 59, 999)
        start = s.toISOString()
        end = e.toISOString()
      } else if (this.filters.timeRange === 'week') {
        const day = now.getDay() || 7
        const s = new Date(now)
        s.setDate(now.getDate() - (day - 1))
        s.setHours(0, 0, 0, 0)
        const e = new Date(s)
        e.setDate(s.getDate() + 6)
        e.setHours(23, 59, 59, 999)
        start = s.toISOString()
        end = e.toISOString()
      } else if (this.filters.timeRange === 'month') {
        const s = new Date(now.getFullYear(), now.getMonth(), 1)
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        s.setHours(0, 0, 0, 0)
        e.setHours(23, 59, 59, 999)
        start = s.toISOString()
        end = e.toISOString()
      } else if (this.filters.timeRange === 'custom' && Array.isArray(this.filters.dateRange) && this.filters.dateRange.length === 2) {
        start = new Date(this.filters.dateRange[0]).toISOString()
        const e = new Date(this.filters.dateRange[1])
        e.setHours(23, 59, 59, 999)
        end = e.toISOString()
      }
      return { start_date: start, end_date: end }
    },

    buildQueryParams(base = {}) {
      const { start_date, end_date } = this.deriveDateRange()
      // 状态映射：UI的 'parking' -> 接口 'active'
      let statusParam
      const statuses = this.filters.status || []
      if (Array.isArray(statuses) && statuses.length === 1) {
        statusParam = statuses[0] === 'parking' ? 'active' : (statuses[0] === 'completed' ? 'completed' : undefined)
      } else {
        statusParam = undefined
      }
      const parkingLotId = this.filters.parkingLot ? Number(this.filters.parkingLot) : undefined
      const minFee = this.filters.minFee != null ? Number(this.filters.minFee) : undefined
      const maxFee = this.filters.maxFee != null ? Number(this.filters.maxFee) : undefined

      return {
        skip: this.skip,
        limit: this.limit,
        start_date,
        end_date,
        parking_lot_id: parkingLotId,
        status: statusParam,
        min_fee: minFee,
        max_fee: maxFee,
        ...base
      }
    },

    mapRecord(rec) {
      // 后端返回字段：id, license_plate, parking_lot_name, parking_space_id, entry_time, exit_time, duration_hours, fee, status(active|completed)
      const durationHours = Number(rec?.duration_hours || 0)
      const h = Math.floor(durationHours)
      const m = Math.round((durationHours - h) * 60)
      const uiStatus = rec?.status === 'active' ? 'parking' : (rec?.status || 'completed')
      return {
        id: rec?.id,
        parkingLotName: rec?.parking_lot_name || '-',
        spaceNumber: rec?.parking_space_id || '-',
        vehiclePlate: rec?.license_plate || '-',
        entryTime: rec?.entry_time || null,
        exitTime: rec?.exit_time || null,
        duration: `${h}小时${m}分`,
        fee: Number(rec?.fee || 0),
        status: uiStatus
      }
    },

    async reloadHistory() {
      this.loading = true
      this.skip = 0
      this.parkingHistory = []
      try {
        const params = this.buildQueryParams({ skip: 0 })
        const list = await getMyParkingHistory(params)
        const items = Array.isArray(list) ? list : (list?.items || [])
        const mapped = items.map(r => this.mapRecord(r))
        this.parkingHistory = mapped
        this.hasMore = items.length >= this.limit
        this.skip = items.length
      } catch (error) {
        console.error('加载停车历史失败:', error)
        ElMessage.error(error?.response?.data?.detail || '加载历史失败')
        this.hasMore = false
      } finally {
        this.loading = false
      }
    },

    applyFilters() {
      this.showFilter = false
      ElMessage.success('筛选条件已应用')
      this.saveFilters()
      this.reloadHistory()
    },

    resetFilters() {
      this.filters = { ...this.originalFilters }
    },

    removeFilter(key) {
      switch (key) {
        case 'timeRange':
          this.filters.timeRange = 'month'
          break
        case 'parkingLot':
          this.filters.parkingLot = ''
          break
        case 'status':
          this.filters.status = ['parking', 'completed']
          break
        case 'fee':
          this.filters.minFee = 0
          this.filters.maxFee = 9999
          break
      }
      this.applyFilters()
    },

    clearAllFilters() {
      this.resetFilters()
      this.clearFiltersStorage()
      this.applyFilters()
    },

    async loadMore() {
      if (!this.hasMore || this.loadingMore) return
      this.loadingMore = true
      try {
        const params = this.buildQueryParams({ skip: this.skip })
        const list = await getMyParkingHistory(params)
        const items = Array.isArray(list) ? list : (list?.items || [])
        const mapped = items.map(r => this.mapRecord(r))
        this.parkingHistory = [...this.parkingHistory, ...mapped]
        this.skip += items.length
        if (items.length < this.limit) {
          this.hasMore = false
        }
      } catch (error) {
        console.error('加载更多失败:', error)
        ElMessage.error(error?.response?.data?.detail || '加载失败')
      } finally {
        this.loadingMore = false
      }
    },

    saveFilters() {
      try {
        localStorage.setItem(this.filterStorageKey, JSON.stringify(this.filters))
      } catch (e) {
        console.warn('保存筛选到本地失败:', e)
      }
    },

    restoreFilters() {
      try {
        const raw = localStorage.getItem(this.filterStorageKey)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          this.filters = { ...this.filters, ...parsed }
        }
      } catch (e) {
        console.warn('恢复筛选失败:', e)
      }
    },

    clearFiltersStorage() {
      try {
        localStorage.removeItem(this.filterStorageKey)
      } catch (e) {
        console.warn('清除筛选缓存失败:', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-history {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.history-header {
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

  .header-filter {
    margin-left: 15px;
    cursor: pointer;
    color: #666;
    font-size: 20px;
    
    &:hover {
      color: #409eff;
    }
  }
}

.history-content {
  padding: 20px;
}

.stats-section {
  margin-bottom: 20px;
  
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
  
  .stat-card {
    background: white;
    border-radius: 15px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }
    
    .stat-icon {
      margin-bottom: 10px;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
    }
  }
}

.filter-tags {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.history-list {
  .history-item {
    background: white;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }
  }
  
  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    .record-date {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .record-status {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      
      &.parking {
        background: #f0f9ff;
        color: #409eff;
      }
      
      &.completed {
        background: #f0f9ff;
        color: #67c23a;
      }
      
      &.cancelled {
        background: #fef0f0;
        color: #f56c6c;
      }
      
      .el-icon {
        margin-right: 4px;
      }
    }
  }
  
  .record-content {
    .parking-info {
      margin-bottom: 15px;
      
      .lot-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin-bottom: 8px;
      }
      
      .space-info {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .space-number {
          color: #409eff;
          font-weight: 500;
        }
        
        .vehicle-info {
          color: #666;
          font-size: 14px;
        }
      }
    }
    
    .time-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      padding: 15px;
      background: #f5f7fa;
      border-radius: 10px;
      
      .time-item {
        text-align: center;
        flex: 1;
        
        .time-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }
        
        .time-value {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
      }
      
      .duration-arrow {
        color: #ccc;
        margin: 0 10px;
      }
    }
    
    .fee-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      .duration {
        display: flex;
        align-items: center;
        color: #666;
        font-size: 14px;
        
        .el-icon {
          margin-right: 4px;
        }
      }
      
      .fee {
        .fee-label {
          color: #666;
          font-size: 14px;
          margin-right: 8px;
        }
        
        .fee-amount {
          color: #f56c6c;
          font-size: 18px;
          font-weight: bold;
        }
      }
    }
    
    .record-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      .el-button {
        flex: 1;
        min-width: calc(50% - 4px);
      }
    }
  }
  
  .load-more {
    text-align: center;
    padding: 20px;
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
}

.filter-drawer {
  :deep(.el-drawer) {
    border-radius: 20px 20px 0 0;
  }
  
  .filter-content {
    padding: 20px;
  }
  
  .filter-section {
    margin-bottom: 25px;
    
    .filter-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
    }
    
    .filter-options {
      .el-radio-group,
      .el-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .custom-date-range {
        margin-top: 10px;
      }
      
      .fee-range {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    }
  }
  
  .filter-actions {
    display: flex;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #e4e7ed;
    
    .el-button {
      flex: 1;
    }
  }
}

.details-dialog {
  :deep(.el-dialog) {
    border-radius: 15px;
  }
  
  .details-content {
    .detail-section {
      margin-bottom: 25px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .detail-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #f0f0f0;
      }
      
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        
        .detail-item {
          display: flex;
          flex-direction: column;
          
          .detail-label {
            font-size: 12px;
            color: #999;
            margin-bottom: 4px;
          }
          
          .detail-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }
        }
      }
      
      .photo-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        
        .photo-item {
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          &:hover {
            transform: scale(1.05);
            transition: transform 0.3s ease;
          }
        }
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .history-content {
    padding: 15px;
  }
  
  .stats-section .stats-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .history-list .record-actions .el-button {
    min-width: calc(50% - 4px);
  }
}

@media screen and (max-width: 375px) {
  .history-header {
    padding: 12px 15px;
    
    h2 {
      font-size: 16px;
    }
  }
  
  .history-content {
    padding: 12px;
  }
  
  .history-list .record-actions .el-button {
    min-width: 100%;
  }
  
  .details-dialog .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
    async loadParkingLots() {
      try {
        const lots = await getParkingLots()
        const arr = Array.isArray(lots) ? lots : (lots?.items ?? [])
        this.parkingLots = arr
      } catch (error) {
        console.warn('加载停车场列表失败:', error)
        this.parkingLots = []
      }
    },