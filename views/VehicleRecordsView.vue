<template>
  <div class="vehicle-records-container modern-container">
    <!-- 现代化页面标题 -->
    <div class="page-header modern-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">车辆进出记录</h2>
          <p class="page-subtitle">Vehicle Entry & Exit Records</p>
        </div>
        <div class="header-actions">
          <!-- 头部操作按钮已移除 -->
        </div>
      </div>
    </div>

    <!-- 现代化搜索和筛选 -->
    <div class="modern-card filter-section">
      <div class="card-header">
        <h3 class="card-title">
          <el-icon><SearchIcon /></el-icon>
          数据筛选
        </h3>
      </div>
      <div class="card-content">
        <el-row :gutter="20" class="modern-filter-form">
          <el-col :span="6">
            <el-input 
              v-model="listQuery.license_plate" 
              placeholder="搜索车牌号码" 
              clearable
              @keyup.enter="handleFilter"
              @clear="handleFilter"
              class="modern-input"
            >
              <template #prefix>
                <el-icon><SearchIcon /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select 
              v-model="listQuery.status" 
              placeholder="车辆状态" 
              clearable 
              @change="handleFilter"
              class="modern-select"
            >
              <el-option label="全部" value="" />
              <el-option label="在场内" value="in" />
              <el-option label="已离场" value="out" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="listQuery.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleFilter"
              class="modern-date-picker"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="4">
            <el-select 
              v-model="listQuery.sort" 
              placeholder="排序方式" 
              clearable 
              @change="handleFilter"
              class="modern-select"
            >
              <el-option label="进入时间倒序" value="-entry_time" />
              <el-option label="进入时间正序" value="+entry_time" />
            </el-select>
          </el-col>
          <el-col :span="4" class="action-buttons">
            <el-button type="primary" class="modern-btn search-btn" @click="handleFilter" :loading="listLoading">
              <el-icon><SearchIcon /></el-icon>
              搜索
            </el-button>
            <el-button class="modern-btn reset-btn" @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 现代化统计卡片 -->
    <div class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon total">
            <el-icon><ListIcon /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ total }}</div>
            <div class="stat-label">总记录数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon enter">
            <el-icon><CircleCheckIcon /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.inParking }}</div>
            <div class="stat-label">在场车辆</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon exit">
            <el-icon><CircleCloseIcon /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.exited }}</div>
            <div class="stat-label">已离场</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue">
            <el-icon><ClockIcon /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.todayRecords }}</div>
            <div class="stat-label">今日记录</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 现代化表格 -->
    <div class="modern-card table-section">
      <div class="card-header">
        <h3 class="card-title">
          <el-icon><ListIcon /></el-icon>
          车辆记录列表
        </h3>
        <div class="card-actions">
        </div>
      </div>
      <div class="card-content" v-loading="listLoading">
        <el-table
          :data="list"
          class="modern-table"
          :row-class-name="tableRowClassName"
          @sort-change="sortChange"
          style="width: 100%"
        >
          <el-table-column label="序号" type="index" width="80" align="center">
            <template #default="scope">
              <span class="index-number">{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="车牌号码" prop="license_plate" min-width="120" align="center">
            <template #default="scope">
              <div class="license-plate-cell">
                <el-icon><VanIcon /></el-icon>
                <span class="plate-text">{{ scope.row.license_plate }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="status" width="120" align="center">
            <template #default="scope">
              <el-tag 
                :type="scope.row.is_in_parking ? 'success' : 'info'"
                class="status-tag"
                :class="{ 'in-parking': scope.row.is_in_parking, 'exited': !scope.row.is_in_parking }"
              >
                <el-icon v-if="scope.row.is_in_parking"><CircleCheckIcon /></el-icon>
                <el-icon v-else><CircleCloseIcon /></el-icon>
                {{ scope.row.is_in_parking ? '在场内' : '已离场' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进入时间" prop="entry_time" width="180" align="center" sortable="custom">
            <template #default="scope">
              <div class="time-cell">
                <el-icon><ClockIcon /></el-icon>
                <span>{{ scope.row.entry_time }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="离开时间" prop="exit_time" width="180" align="center">
            <template #default="scope">
              <div class="time-cell" v-if="scope.row.exit_time">
                <el-icon><ClockIcon /></el-icon>
                <span>{{ scope.row.exit_time }}</span>
              </div>
              <span v-else class="no-data">在场内</span>
            </template>
          </el-table-column>
          <el-table-column label="停车时长" width="150" align="center">
            <template #default="scope">
              <div class="duration-cell" v-if="scope.row.parking_duration">
                <el-icon><ClockIcon /></el-icon>
                <span>{{ scope.row.parking_duration }}</span>
              </div>
              <span v-else-if="scope.row.is_in_parking" style="color: #67c23a;">在场内</span>
              <span v-else class="no-data">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" class="modern-btn action-btn" @click="handleViewDetails(scope.row)">
                <el-icon><ViewIcon /></el-icon>
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 现代化分页 -->
    <div class="pagination-section">
      <div class="modern-pagination">
        <el-pagination
          v-model:current-page="listQuery.page"
          v-model:page-size="listQuery.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
          class="pagination-modern"
        />
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="车辆记录详情"
      width="500px"
      @close="handleDialogClose"
    >
      <div class="detail-content" v-if="currentRecord">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="车牌号码">{{ currentRecord.license_plate }}</el-descriptions-item>
          <el-descriptions-item label="进入时间">{{ currentRecord.entry_time }}</el-descriptions-item>
          <el-descriptions-item label="离开时间">
            {{ currentRecord.exit_time || '在场内' }}
          </el-descriptions-item>
          <el-descriptions-item label="停车时长">
            {{ currentRecord.parking_duration || (currentRecord.is_in_parking ? '在场内' : '-') }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRecord.is_in_parking ? 'success' : 'info'">
              {{ currentRecord.is_in_parking ? '在场内' : '已离场' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Search as SearchIcon,
  View as ViewIcon,
  Van as VanIcon,
  CircleCheck as CircleCheckIcon,
  CircleClose as CircleCloseIcon,
  List as ListIcon,
  Clock as ClockIcon
} from '@element-plus/icons-vue'
import { getVehicleRecordsList } from '@/api/vehicle'
import { wsManager, subscribeToVehicleEntry, subscribeToVehicleExit } from '@/utils/websocket'

export default {
  name: 'VehicleRecords',
    components: {
      SearchIcon,
      ViewIcon,
      VanIcon,
      CircleCheckIcon,
      CircleCloseIcon,
      ListIcon,
      ClockIcon
    },
  setup() {
    const listLoading = ref(false)
    const total = ref(0)
    const dialogVisible = ref(false)
    const currentRecord = ref(null)

    const listQuery = reactive({
      page: 1,
      limit: 10,
      license_plate: '',
      status: '', // 'in', 'out', ''
      dateRange: null,
      sort: '-entry_time' // 默认按进入时间倒序
    })

    const list = ref([])
    // 保存 WebSocket 订阅的卸载函数，避免清空其他组件的处理器
    let offVehicleEntry = null
    let offVehicleExit = null

    // 统计数据
    const stats = reactive({
      inParking: 0,
      exited: 0,
      todayRecords: 0
    })

    // 工具函数：格式化时间与计算时长
    const formatDateTime = (value) => {
      if (!value) return null
      const dt = new Date(value)
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const d = String(dt.getDate()).padStart(2, '0')
      const hh = String(dt.getHours()).padStart(2, '0')
      const mm = String(dt.getMinutes()).padStart(2, '0')
      const ss = String(dt.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
    }

    const computeDuration = (start, end) => {
      if (!start || !end) return null
      const s = new Date(start)
      const e = new Date(end)
      const ms = e - s
      if (isNaN(ms) || ms <= 0) return null
      const hours = Math.floor(ms / 3600000)
      const minutes = Math.floor((ms % 3600000) / 60000)
      return `${hours}小时${minutes}分钟`
    }

    const getList = async () => {
      listLoading.value = true
      try {
        // 组装后端查询参数（支持分页与筛选）
        const params = {
          skip: (listQuery.page - 1) * listQuery.limit,
          limit: listQuery.limit
        }
        if (listQuery.status === 'in') params.is_in_parking = true
        else if (listQuery.status === 'out') params.is_in_parking = false
        if (listQuery.license_plate) params.license_plate = listQuery.license_plate
        if (listQuery.dateRange && listQuery.dateRange.length === 2) {
          params.start_date = listQuery.dateRange[0]
          params.end_date = listQuery.dateRange[1]
        }

        const resp = await getVehicleRecordsList(params)
        const rawList = Array.isArray(resp?.items)
          ? resp.items
          : (Array.isArray(resp?.records) ? resp.records : [])
        // 后端已按进入时间倒序，若选择正序则在当前页内反向排序
        let mapped = rawList.map(r => {
          const licensePlate = r.license_plate || r.licensePlate
          const entry = r.entry_time || r.entryTime
          const exit = r.exit_time || r.exitTime
          const isIn = typeof r.is_in_parking !== 'undefined' ? r.is_in_parking : r.isInParking
          return {
            id: r.id,
            license_plate: licensePlate,
            entry_time: entry ? formatDateTime(entry) : null,
            exit_time: exit ? formatDateTime(exit) : null,
            parking_duration: exit ? computeDuration(entry, exit) : null,
            is_in_parking: !!isIn
          }
        })

        if (listQuery.sort === '+entry_time') {
          mapped.sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time))
        } else {
          // 保持后端默认的倒序，或手动确保倒序
          mapped.sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time))
        }

        // 统计数据（基于当前页数据）
        stats.inParking = mapped.filter(item => item.is_in_parking).length
        stats.exited = mapped.filter(item => !item.is_in_parking).length
        const today = new Date().toISOString().split('T')[0]
        stats.todayRecords = mapped.filter(item => 
          item.entry_time && item.entry_time.startsWith(today)
        ).length

        total.value = Number.isFinite(resp?.total) ? resp.total : mapped.length
        list.value = mapped
      } catch (e) {
        console.error('获取车辆记录失败:', e)
        ElMessage.error(e.response?.data?.detail || '获取车辆记录失败')
      } finally {
        listLoading.value = false
      }
    }

    const handleFilter = () => {
      listQuery.page = 1
      getList()
    }

    const handleReset = () => {
    listQuery.license_plate = ''
    listQuery.status = ''
    listQuery.dateRange = null
    listQuery.page = 1
    getList()
  }

  const refreshData = async () => {
    listLoading.value = true
    await getList()
    ElMessage.success('数据已刷新')
    listLoading.value = false
  }


  const tableRowClassName = ({ row }) => {
    return row.is_in_parking ? 'parking-row' : 'exited-row'
  }

    const handleSizeChange = (val) => {
      listQuery.limit = val
      getList()
    }

    const handleCurrentChange = (val) => {
      listQuery.page = val
      getList()
    }

    const handleViewDetails = (row) => {
      currentRecord.value = row
      dialogVisible.value = true
    }

    const handleDialogClose = () => {
      currentRecord.value = null
    }

    const sortChange = (data) => {
      const { prop, order } = data
      if (prop === 'entry_time') {
        if (order === 'ascending') {
          listQuery.sort = '+entry_time'
        } else {
          listQuery.sort = '-entry_time'
        }
        getList()
      }
    }

    onMounted(() => {
      getList()
      // 初始化 WebSocket 连接并订阅事件
      if (!wsManager.isConnected) {
        wsManager.connect()
      }
      offVehicleEntry = subscribeToVehicleEntry((data) => {
        console.log('Vehicle entry detected:', data)
        ElMessage.info(`车辆 ${data.license_plate} 已进入停车场`)
        getList() // 刷新列表
      })
      offVehicleExit = subscribeToVehicleExit((data) => {
        console.log('Vehicle exit detected:', data)
        ElMessage.info(`车辆 ${data.license_plate} 已离开停车场`)
        getList() // 刷新列表
      })
    })

    onUnmounted(() => {
       // 取消订阅（仅移除当前组件的处理器，避免影响其他订阅者）
       try {
         if (typeof offVehicleEntry === 'function') offVehicleEntry()
         if (typeof offVehicleExit === 'function') offVehicleExit()
       } catch (err) {
         console.error('取消车辆事件订阅失败:', err)
       }
       // 保持连接供其他管理页面使用，避免路由切换后需要重新连接
    })

    // 暴露WebSocket管理器供调试使用
      if (typeof window !== 'undefined') {
        window.wsManager = wsManager
      }

    // 模拟实时数据更新（用于测试）

    // 将模拟函数暴露到全局，便于测试
    if (typeof window !== 'undefined') {
      window.wsManager = wsManager
    }

    return {
      list,
      total,
      listLoading,
      listQuery,
      dialogVisible,
      currentRecord,
      stats,
      getList,
      handleFilter,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleViewDetails,
      handleDialogClose,
      sortChange,
      refreshData,
      tableRowClassName,
      
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/modern-theme.css';

.vehicle-records-container {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 20px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.vehicle-records-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 现代化页面标题 */
.page-header {
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff, #5da8ff);
  opacity: 0.8;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  position: relative;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
}

.header-actions .modern-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.header-actions .modern-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 现代化筛选区域 */
.filter-section {
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  transition: all 0.4s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-content {
  padding: 0;
}

.modern-filter-form {
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.search-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(82, 196, 26, 0.4);
}

.reset-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #606266;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
}

/* 现代化表格 */
.table-section {
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  transition: all 0.4s ease;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.export-btn {
  background: linear-gradient(135deg, #409eff 0%, #5da8ff 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

.modern-table {
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.modern-table :deep(.el-table__header-wrapper) {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.modern-table :deep(.el-table__header th) {
  background: transparent;
  color: #2c3e50;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 12px;
}

.modern-table :deep(.el-table__body tr) {
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.modern-table :deep(.el-table__body tr:hover) {
  background: rgba(240, 247, 255, 0.95);
  transform: scale(1.005);
}

.modern-table :deep(.el-table__body td) {
  color: #2c3e50;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 12px;
}

/* 表格行样式 */
.parking-row {
  background: rgba(76, 175, 80, 0.1) !important;
}

.exited-row {
  background: rgba(158, 158, 158, 0.1) !important;
}

/* 表格单元格样式 */
.index-number {
  font-weight: 600;
  color: #7f8c8d;
}

.license-plate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  color: #2c3e50;
}

.plate-text {
  font-weight: 600;
  color: #2c3e50;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  color: #7f8c8d;
}

.duration-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  color: #7f8c8d;
}

.fee-cell {
  text-align: center;
}

.fee-amount {
  font-weight: 600;
  color: #52c41a;
}

.no-data {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.status-tag.in-parking {
  background: rgba(82, 196, 26, 0.15);
  border: 1px solid rgba(82, 196, 26, 0.3);
  color: #52c41a;
}

.status-tag.exited {
  background: rgba(158, 158, 158, 0.15);
  border: 1px solid rgba(158, 158, 158, 0.3);
  color: #8c8c8c;
}

.status-tag:hover {
  transform: scale(1.05);
}

.action-btn {
  background: linear-gradient(135deg, #409eff 0%, #5da8ff 100%);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

/* 现代化分页 */
.pagination-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  display: flex;
  justify-content: center;
}

.pagination-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(82, 196, 26, 0.05) 100%);
  border-radius: 16px;
  z-index: -1;
}

.modern-pagination {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.pagination-modern :deep(.el-pagination) {
  color: #2c3e50;
}

.pagination-modern :deep(.el-pagination .btn-prev),
.pagination-modern :deep(.el-pagination .btn-next),
.pagination-modern :deep(.el-pagination .el-pager li) {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #2c3e50;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.pagination-modern :deep(.el-pagination .el-pager li:hover),
.pagination-modern :deep(.el-pagination .btn-prev:hover),
.pagination-modern :deep(.el-pagination .btn-next:hover) {
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.pagination-modern :deep(.el-pagination .btn-prev:disabled),
.pagination-modern :deep(.el-pagination .btn-next:disabled) {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.05);
  color: rgba(44, 62, 80, 0.3);
}

.pagination-modern :deep(.el-pagination .el-pager li.active) {
  background: linear-gradient(135deg, #409eff 0%, #5da8ff 100%);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.page-size-selector {
  margin-right: 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  font-weight: 500;
  padding: 6px 12px;
  transition: all 0.3s ease;
}

.page-size-selector:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
}

.page-jump-input {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  font-weight: 500;
  margin: 0 8px;
  text-align: center;
  transition: all 0.3s ease;
}

.page-jump-input:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
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
  background: linear-gradient(135deg, #409eff 0%, #5da8ff 100%);
  color: white;
}

.stat-icon.enter {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
}

.stat-icon.exit {
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
  color: white;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
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
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .vehicle-records-container {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .modern-filter-form .el-col {
    margin-bottom: 12px;
  }
  
  .action-buttons {
    justify-content: center;
    margin-top: 12px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .modern-table :deep(.el-table__header th),
  .modern-table :deep(.el-table__body td) {
    padding: 12px 8px;
  }
  
  .pagination-section {
    padding: 0;
  }
  
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

@media (max-width: 480px) {
  .vehicle-records-container {
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
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-section,
.table-section,
.pagination-section {
  animation: fadeInUp 0.6s ease-out;
}

.filter-section {
  animation-delay: 0.1s;
}

.table-section {
  animation-delay: 0.2s;
}

.pagination-section {
  animation-delay: 0.3s;
}
</style>