<template>
  <div class="vehicle-management modern-container">
    <!-- 现代化页面标题 -->
    <div class="page-header modern-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">车辆管理</h2>
          <p class="page-subtitle">Vehicle Management</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" class="modern-btn" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 现代化搜索和筛选 -->
    <div class="modern-card filter-section">
      <div class="card-header">
        <h3 class="card-title">
          <el-icon><Search /></el-icon>
          数据筛选
        </h3>
      </div>
      <div class="card-content">
        <el-form :inline="true" :model="filterForm" class="modern-filter-form">
          <el-form-item label="车牌号码">
            <el-input
              v-model="filterForm.license_plate"
              placeholder="输入车牌号码"
              clearable
              @clear="handleFilter"
              @keyup.enter="handleFilter"
              class="modern-input"
            />
          </el-form-item>
          <el-form-item label="停车状态">
            <el-select
              v-model="filterForm.is_in_parking"
              placeholder="选择状态"
              clearable
              @change="handleFilter"
              class="modern-select"
            >
              <el-option label="全部" value="" />
              <el-option label="在停车场" :value="true" />
              <el-option label="已离场" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filterForm.date_range"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleFilter"
              class="modern-date-picker"
            />
          </el-form-item>
          <el-form-item class="action-buttons">
            <el-button type="primary" class="modern-btn search-btn" @click="handleFilter">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button class="modern-btn reset-btn" @click="resetFilter">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 现代化数据统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card modern-card total-card">
        <div class="card-background">
          <div class="card-icon-wrapper">
            <el-icon class="card-icon"><Van /></el-icon>
          </div>
        </div>
        <div class="card-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总车辆数</div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>+5% 较昨日</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card modern-card current-card">
        <div class="card-background">
          <div class="card-icon-wrapper">
            <el-icon class="card-icon"><Position /></el-icon>
          </div>
        </div>
        <div class="card-content">
          <div class="stat-number">{{ stats.currentInParking }}</div>
          <div class="stat-label">当前在场</div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>+2% 较昨日</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card modern-card today-card">
        <div class="card-background">
          <div class="card-icon-wrapper">
            <el-icon class="card-icon"><TrendCharts /></el-icon>
          </div>
        </div>
        <div class="card-content">
          <div class="stat-number">{{ stats.todayEntries }}</div>
          <div class="stat-label">今日入场</div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>+8% 较昨日</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card modern-card exit-card">
        <div class="card-background">
          <div class="card-icon-wrapper">
            <el-icon class="card-icon"><Clock /></el-icon>
          </div>
        </div>
        <div class="card-content">
          <div class="stat-number">{{ stats.todayExits }}</div>
          <div class="stat-label">今日出场</div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>+3% 较昨日</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 现代化车辆列表 -->
    <div class="modern-card table-section">
      <div class="card-header">
        <h3 class="card-title">
          <el-icon><List /></el-icon>
          车辆列表
        </h3>
        <div class="card-actions">
          <el-button type="primary" class="modern-btn export-btn" @click="exportData" v-permission="'vehicle:export'">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>
      <div class="card-content">
        <el-table
          :data="vehicleList"
          v-loading="loading"
          style="width: 100%"
          @sort-change="handleSortChange"
          class="modern-table"
          :row-class-name="tableRowClassName"
        >
          <el-table-column
            prop="license_plate"
            label="车牌号码"
            width="120"
            sortable="custom"
          >
            <template #default="scope">
              <div class="plate-number">
                <el-icon><Van /></el-icon>
                <span>{{ scope.row.license_plate }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="is_in_parking"
            label="状态"
            width="100"
            align="center"
          >
            <template #default="scope">
              <el-tag
                :type="scope.row.is_in_parking ? 'success' : 'info'"
                size="small"
                class="status-tag"
              >
                <el-icon v-if="scope.row.is_in_parking"><CircleCheck /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                {{ scope.row.is_in_parking ? '在场' : '已离场' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="entry_time"
            label="入场时间"
            width="160"
            sortable="custom"
          >
            <template #default="scope">
              <div class="time-cell">
                <el-icon><Clock /></el-icon>
                <span>{{ formatDateTime(scope.row.entry_time) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="exit_time"
            label="出场时间"
            width="160"
            sortable="custom"
          >
            <template #default="scope">
              <div class="time-cell">
                <el-icon><Clock /></el-icon>
                <span>{{ formatDateTime(scope.row.exit_time) || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="parking_duration"
            label="停车时长"
            width="120"
            align="center"
          >
            <template #default="scope">
              <div class="duration-cell">
                <el-icon><Timer /></el-icon>
                <span>{{ formatDuration(scope.row.parking_duration) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="150"
            align="center"
            fixed="right"
          >
            <template #default="scope">
              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="small"
                  class="action-btn"
                  @click="viewDetails(scope.row)"
                >
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button
                  v-if="scope.row.is_in_parking"
                  type="danger"
                  size="small"
                  class="action-btn exit-btn"
                  @click="handleExit(scope.row)"
                  v-permission="'vehicle:exit'"
                >
                  <el-icon><SwitchButton /></el-icon>
                  出场
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 现代化分页 -->
        <div class="modern-pagination">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            class="pagination-modern"
          />
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="车辆详情"
      width="600px"
    >
      <div v-if="currentVehicle" class="vehicle-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="车牌号码">
            {{ currentVehicle.license_plate }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag
              :type="currentVehicle.is_in_parking ? 'success' : 'info'"
              size="small"
            >
              {{ currentVehicle.is_in_parking ? '在场' : '已离场' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="入场时间">
            {{ formatDateTime(currentVehicle.entry_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="出场时间">
            {{ formatDateTime(currentVehicle.exit_time) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="停车时长">
            {{ formatDuration(currentVehicle.parking_duration) }}
          </el-descriptions-item>
          <el-descriptions-item label="停车费用">
            {{ formatCurrency(currentVehicle.parking_fee) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getVehicles, vehicleExit, getVehicleStatsOverview } from '@/api/vehicle'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Van, Position, TrendCharts, Clock, List, Search, Refresh, CircleCheck, CircleClose, View, SwitchButton, Download, Timer } from '@element-plus/icons-vue'

export default {
  name: 'VehicleManagementView',
  components: {
    Van, Position, TrendCharts, Clock, List, Search, Refresh, CircleCheck, CircleClose, View, SwitchButton, Download, Timer
  },
  data() {
    return {
      loading: false,
      vehicleList: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      filterForm: {
        license_plate: '',
        is_in_parking: '',
        date_range: null
      },
      sortField: 'entry_time',
      sortOrder: 'descending',
      detailDialogVisible: false,
      currentVehicle: null,
      stats: {
        total: 0,
        currentInParking: 0,
        todayEntries: 0,
        todayExits: 0
      }
    }
  },
  created() {
    this.fetchData()
    this.fetchStats()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          // 后端使用 skip/limit，这里先保留原分页参数，后续可转换
          page: this.currentPage,
          page_size: this.pageSize,
          license_plate: this.filterForm.license_plate || undefined,
          is_in_parking: this.filterForm.is_in_parking !== '' ? this.filterForm.is_in_parking : undefined,
          start_date: this.filterForm.date_range?.[0],
          end_date: this.filterForm.date_range?.[1],
          sort_by: this.sortField,
          sort_order: this.sortOrder === 'ascending' ? 'asc' : 'desc'
        }
        
        const resp = await getVehicles(params)
        // axios 封装已返回 response.data；后端 /vehicles 返回的是数组
        const items = Array.isArray(resp)
          ? resp
          : (resp?.items || resp?.data?.items || resp?.data || [])
        this.vehicleList = items
        this.total = Array.isArray(resp)
          ? resp.length
          : (resp?.total ?? items.length)
        
      } catch (error) {
        ElMessage.error('获取车辆数据失败：' + (error.response?.data?.detail || error.message))
        this.vehicleList = this.getMockData()
        this.total = this.vehicleList.length
      } finally {
        this.loading = false
      }
    },
    
    async fetchStats() {
      try {
        const resp = await getVehicleStatsOverview()
        // 后端返回的键：totalVehicles, currentInParking, todayEntry, todayExit, avgParkingDurationHours
        const avgHours = resp.avgParkingDurationHours || 0
        const hours = Math.floor(avgHours)
        const minutes = Math.round((avgHours - hours) * 60)
        this.stats = {
          total: resp.totalVehicles || 0,
          currentInParking: resp.currentInParking || 0,
          todayEntries: resp.todayEntry || 0,
          todayExits: resp.todayExit || 0,
          averageParkingTime: `${hours}小时${minutes}分`
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error('获取统计数据失败：' + (error.response?.data?.detail || error.message))
      }
    },
    
    handleFilter() {
      this.currentPage = 1
      this.fetchData()
    },
    
    resetFilter() {
      this.filterForm = {
        license_plate: '',
        is_in_parking: '',
        date_range: null
      }
      this.handleFilter()
    },
    
    handleSortChange({ prop, order }) {
      this.sortField = prop
      this.sortOrder = order
      this.fetchData()
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.fetchData()
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchData()
    },
    
    viewDetails(vehicle) {
      this.currentVehicle = vehicle
      this.detailDialogVisible = true
    },
    
    async handleExit(vehicle) {
      try {
        await ElMessageBox.confirm(`确认车辆 ${vehicle.license_plate} 出场？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        this.loading = true
        const response = await vehicleExit({ license_plate: vehicle.license_plate })
        
        ElMessage.success(response.message || '车辆出场成功')
        this.fetchData()
        this.fetchStats()
        
      } catch (error) {
        const cancelled = error === 'cancel' || error === 'close' || error?.message === 'cancel' || error?.code === 'ERR_CANCELLED'
        if (!cancelled) {
          ElMessage.error('车辆出场失败：' + (error.response?.data?.detail || error.message))
        }
      } finally {
        this.loading = false
      }
    },
    
    refreshData() {
      this.fetchData()
      this.fetchStats()
    },
    
    async exportData() {
      try {
        // 获取所有数据用于导出
        const params = {}
        if (this.filterForm.is_in_parking !== '') {
          params.is_in_parking = this.filterForm.is_in_parking
        }

        const resp = await getVehicles(params)
        const rawList = Array.isArray(resp) ? resp : (resp?.items || resp?.data?.items || resp?.data || [])
        let filteredData = rawList.map(v => ({
          license_plate: v.license_plate,
          status: v.is_in_parking ? '在场' : '已离场',
          entry_time: this.formatDateTime(v.entry_time),
          exit_time: v.exit_time ? this.formatDateTime(v.exit_time) : '-',
          parking_duration: v.parking_duration ? this.formatDuration(v.parking_duration) : '-',
          parking_fee: v.parking_fee ? this.formatCurrency(v.parking_fee) : '-'
        }))

        // 应用当前筛选条件
        if (this.filterForm.license_plate) {
          const q = this.filterForm.license_plate.toLowerCase()
          filteredData = filteredData.filter(record => 
            record.license_plate.toLowerCase().includes(q)
          )
        }

        if (this.filterForm.date_range && this.filterForm.date_range.length === 2) {
          const startDate = new Date(this.filterForm.date_range[0])
          const endDate = new Date(this.filterForm.date_range[1])
          filteredData = filteredData.filter(record => {
            if (!record.entry_time || record.entry_time === '-') return false
            const entryDate = new Date(record.entry_time.split(' ')[0])
            return entryDate >= startDate && entryDate <= endDate
          })
        }

        // 使用新的导出工具类
        const { exportToExcel } = await import('@/utils/export')
        
        const exportData = filteredData.map(row => ({
          '车牌号码': row.license_plate,
          '状态': row.status,
          '入场时间': row.entry_time,
          '出场时间': row.exit_time,
          '停车时长': row.parking_duration,
          '停车费用': row.parking_fee
        }))

        await exportToExcel(exportData, '车辆管理', '车辆数据导出')
        this.$message.success('数据导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败，请重试')
      }
    },
    
    tableRowClassName({ row }) {
      return row.is_in_parking ? 'parking-row' : 'exited-row'
    },
    
    formatDateTime(dateTime) {
      if (!dateTime) return null
      return new Date(dateTime).toLocaleString('zh-CN')
    },
    
    formatDuration(duration) {
      if (!duration) return '-'
      if (duration < 60) return `${duration}分钟`
      if (duration < 1440) return `${Math.floor(duration / 60)}小时${duration % 60}分钟`
      return `${Math.floor(duration / 1440)}天${Math.floor((duration % 1440) / 60)}小时`
    },
    
    formatCurrency(amount) {
      if (!amount) return '¥0.00'
      return `¥${amount.toFixed(2)}`
    },
    
    getMockData() {
      // 模拟数据，用于API失败时的回退
      const mockVehicles = []
      for (let i = 0; i < 20; i++) {
        const isInParking = Math.random() > 0.5
        const entryTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        const exitTime = isInParking ? null : new Date(entryTime.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        
        mockVehicles.push({
          id: i + 1,
          license_plate: `京A${Math.floor(Math.random() * 90000 + 10000)}`,
          is_in_parking: isInParking,
          entry_time: entryTime.toISOString(),
          exit_time: exitTime?.toISOString(),
          parking_duration: exitTime ? Math.floor((exitTime - entryTime) / (1000 * 60)) : null,
          parking_fee: exitTime ? Math.floor((exitTime - entryTime) / (1000 * 60 * 60)) * 5 : null
        })
      }
      return mockVehicles
    }
  }
}
</script>

<style scoped>
/* 导入现代主题 */
@import '@/styles/modern-theme.css';

.vehicle-management {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section .page-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 4px 0;
}

.title-section .page-subtitle {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 24px;
}

.modern-filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.modern-filter-form .el-form-item {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.stat-card .card-background {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transform: translate(20px, -20px);
}

.stat-card .card-icon-wrapper {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
}

.stat-card .card-icon {
  font-size: 24px;
  color: #fff;
}

.stat-card.total-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-card.current-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-card.today-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-card.exit-card {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: #fff;
}

.stat-card .stat-number {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card .stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
}

.stat-card .stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.8;
}

/* 表格区域 */
.table-section {
  margin-bottom: 24px;
}

.table-section .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.table-section .card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

/* 表格样式 */
.modern-table {
  border-radius: 12px;
  overflow: hidden;
}

.modern-table :deep(.el-table__header-wrapper) {
  background: rgba(255, 255, 255, 0.1);
}

.modern-table :deep(.el-table__header) {
  background: transparent;
}

.modern-table :deep(.el-table__header th) {
  background: rgba(102, 126, 234, 0.1);
  color: #2c3e50;
  font-weight: 600;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.modern-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.modern-table :deep(.el-table__row:hover) {
  background: rgba(102, 126, 234, 0.05);
  transform: scale(1.01);
}

.modern-table :deep(.parking-row) {
  background: rgba(76, 175, 80, 0.05);
}

.modern-table :deep(.exited-row) {
  background: rgba(244, 67, 54, 0.05);
}

.plate-number {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
}

.duration-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  color: #606266;
}

.status-tag {
  border-radius: 20px;
  padding: 4px 12px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
}

.exit-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border: none;
}

/* 分页样式 */
.modern-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.pagination-modern :deep(.el-pagination__total),
.pagination-modern :deep(.el-pagination__sizes),
.pagination-modern :deep(.el-pagination__jump) {
  color: #606266;
}

.pagination-modern :deep(.el-pager li) {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  margin: 0 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.pagination-modern :deep(.el-pager li:hover) {
  background: rgba(255, 255, 255, 0.3);
}

.pagination-modern :deep(.el-pager li.active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

.pagination-modern :deep(.btn-prev),
.pagination-modern :deep(.btn-next) {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  border-radius: 8px;
}

/* 详情对话框 */
.vehicle-detail {
  padding: 20px;
}

/* 统计卡片基础样式 */
.stats-section {
  margin-bottom: var(--spacing-xl);
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.stat-card {
  background: var(--card-gradient);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
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
  margin-right: var(--spacing-lg);
  font-size: var(--font-size-xl);
  transition: all var(--transition-normal) ease;
  position: relative;
  overflow: hidden;
}

.stat-icon.total {
  background: var(--primary-gradient);
  color: white;
}

.stat-icon.active {
  background: var(--success-gradient);
  color: white;
}

.stat-icon.inactive {
  background: var(--error-gradient);
  color: white;
}

.stat-icon.maintain {
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
  font-size: var(--font-size-2xl);
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

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .stat-card {
    padding: var(--spacing-md);
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: var(--spacing-md);
  }
  
  .stat-number {
    font-size: var(--font-size-xl);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .vehicle-management {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .title-section .page-title {
    font-size: 24px;
  }
  
  .modern-filter-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .table-section .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modern-table {
    font-size: 12px;
  }
  
  .modern-pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .vehicle-management {
    padding: var(--spacing-sm);
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .filter-container {
    padding: var(--spacing-sm);
  }
  
  .pagination-container {
    padding: var(--spacing-md);
  }
  
  .stats-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .stat-card {
    padding: var(--spacing-md);
    flex-direction: row;
    text-align: left;
  }
  
  .stat-icon {
    margin-right: var(--spacing-md);
    margin-bottom: 0;
    width: 48px;
    height: 48px;
    font-size: var(--font-size-lg);
  }
  
  .stat-number {
    font-size: var(--font-size-lg);
  }
  
  .vehicle-info {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-xs);
  }
  
  .vehicle-avatar {
    margin: 0 auto;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .edit-btn, .more-btn {
    width: 100%;
  }
}
</style>