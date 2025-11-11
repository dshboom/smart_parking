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
                <el-icon><Search /></el-icon>
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
              <el-icon><Search /></el-icon>
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
            <el-icon><List /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ total }}</div>
            <div class="stat-label">总记录数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon enter">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.inParking }}</div>
            <div class="stat-label">在场车辆</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon exit">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.exited }}</div>
            <div class="stat-label">已离场</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue">
            <el-icon><Clock /></el-icon>
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
          <el-icon><List /></el-icon>
          车辆记录列表
        </h3>
        <div class="card-actions">
          <el-button type="success" class="modern-btn export-btn" @click="exportData" v-permission="'record:export'">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button type="warning" class="modern-btn" @click="simulateRealTimeUpdate">
        <el-icon><Refresh /></el-icon>
        测试实时更新
      </el-button>
      <el-button type="info" class="modern-btn" @click="handleVehicleEntry({license_plate: '京A12345', entry_time: new Date().toISOString(), parking_spot: 'A-01'})">
        <el-icon><CircleCheck /></el-icon>
        模拟进入
      </el-button>
      <el-button type="danger" class="modern-btn" @click="handleVehicleExit({license_plate: '京A12345', exit_time: new Date().toISOString(), fee: 25.5})">
        <el-icon><CircleClose /></el-icon>
        模拟离开
      </el-button>
        </div>
      </div>
      <div class="card-content">
        <el-table
          v-loading="listLoading"
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
                <el-icon><Van /></el-icon>
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
                <el-icon v-if="scope.row.is_in_parking"><CircleCheck /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                {{ scope.row.is_in_parking ? '在场内' : '已离场' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进入时间" prop="entry_time" width="180" align="center" sortable="custom">
            <template #default="scope">
              <div class="time-cell">
                <el-icon><Clock /></el-icon>
                <span>{{ scope.row.entry_time }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="离开时间" prop="exit_time" width="180" align="center">
            <template #default="scope">
              <div class="time-cell" v-if="scope.row.exit_time">
                <el-icon><Clock /></el-icon>
                <span>{{ scope.row.exit_time }}</span>
              </div>
              <span v-else class="no-data">在场内</span>
            </template>
          </el-table-column>
          <el-table-column label="停车时长" width="150" align="center">
            <template #default="scope">
              <div class="duration-cell" v-if="scope.row.parking_duration">
                <el-icon><Clock /></el-icon>
                <span>{{ scope.row.parking_duration }}</span>
              </div>
              <span v-else-if="scope.row.is_in_parking" style="color: #67c23a;">在场内</span>
              <span v-else class="no-data">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" class="modern-btn action-btn" @click="handleViewDetails(scope.row)">
                <el-icon><View /></el-icon>
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
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, View, Van, CircleCheck, CircleClose, List, Download, Clock, Delete } from '@element-plus/icons-vue'
import { vehicleEntry, vehicleExit, getVehicleRecordsList } from '@/api/vehicle'
import { wsManager, subscribeToVehicleEntry, subscribeToVehicleExit } from '@/utils/websocket'

export default {
  name: 'VehicleRecords',
  components: {
    Search,
    Refresh
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

  const exportData = async () => {
    try {
      // 获取当前筛选条件下的数据用于导出（最大100条受后端限制）
      const params = { skip: 0, limit: 100 }
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
      let filteredData = rawList.map(r => ({
        license_plate: r.license_plate || r.licensePlate,
        entry_time: formatDateTime(r.entry_time || r.entryTime),
        exit_time: (r.exit_time || r.exitTime) ? formatDateTime(r.exit_time || r.exitTime) : '在场内',
        parking_duration: (r.exit_time || r.exitTime) ? (computeDuration(r.entry_time || r.entryTime, r.exit_time || r.exitTime) || '-') : '在场内',
        status: (typeof r.is_in_parking !== 'undefined' ? r.is_in_parking : r.isInParking) ? '在场内' : '已离场'
      }))

      // 使用新的导出工具类
      const { exportToExcel } = await import('@/utils/export')
      
      const exportData = filteredData.map(row => ({
        '车牌号码': row.license_plate,
        '进入时间': row.entry_time,
        '离开时间': row.exit_time,
        '停车时长': row.parking_duration,
        '状态': row.status
      }))

      await exportToExcel(exportData, '车辆记录', '车辆记录导出')
      ElMessage.success('数据导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请重试')
    }
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
    const simulateRealTimeUpdate = () => {
      const mockEntryData = {
        license_plate: '京A' + Math.floor(Math.random() * 10000),
        entry_time: new Date().toISOString(),
        parking_spot: 'A-' + Math.floor(Math.random() * 100)
      }
      
      const mockExitData = {
        license_plate: '京B' + Math.floor(Math.random() * 10000),
        exit_time: new Date().toISOString(),
        fee: Math.floor(Math.random() * 50) + 10
      }
      
      // 随机触发进入或离开事件
      if (Math.random() > 0.5) {
        handleVehicleEntry(mockEntryData)
      } else {
        handleVehicleExit(mockExitData)
      }
      
      // 模拟WebSocket消息（如果连接存在）
      if (wsManager.isConnected) {
        const mockMessage = {
          type: Math.random() > 0.5 ? 'vehicle_entry' : 'vehicle_exit',
          payload: Math.random() > 0.5 ? mockEntryData : mockExitData,
          timestamp: Date.now()
        }
        wsManager.handleMessage(mockMessage)
      }
    }

    // 车辆进入事件处理（按钮/测试调用）
    const handleVehicleEntry = async (payload) => {
      try {
        const plate = payload?.license_plate
        if (!plate) {
          ElMessage.warning('缺少车牌号码，无法入场')
          return
        }
        // 后端入场记录
        const resp = await vehicleEntry({ license_plate: plate })
        const displayPlate = resp?.vehicle?.license_plate || plate
        ElMessage.success(`车辆 ${displayPlate} 入场成功`)
        // 触发本地订阅者更新（模拟WS推送）
        wsManager.handleMessage({
          type: 'vehicle_entry',
          payload: {
            license_plate: displayPlate,
            entry_time: new Date().toISOString(),
            parking_spot: payload?.parking_spot || null
          }
        })
        // 刷新列表
        getList()
      } catch (error) {
        console.error('车辆入场失败:', error)
        ElMessage.error(error?.response?.data?.detail || error.message || '车辆入场失败')
      }
    }

    // 车辆离开事件处理（按钮/测试调用）
    const handleVehicleExit = async (payload) => {
      try {
        const plate = payload?.license_plate
        if (!plate) {
          ElMessage.warning('缺少车牌号码，无法出场')
          return
        }
        // 后端出场记录
        const resp = await vehicleExit({ license_plate: plate })
        const displayPlate = resp?.vehicle?.license_plate || plate
        ElMessage.success(`车辆 ${displayPlate} 出场成功`)
        // 触发本地订阅者更新（模拟WS推送）
        wsManager.handleMessage({
          type: 'vehicle_exit',
          payload: {
            license_plate: displayPlate,
            exit_time: new Date().toISOString(),
            fee: payload?.fee || null
          }
        })
        // 刷新列表
        getList()
      } catch (error) {
        console.error('车辆出场失败:', error)
        ElMessage.error(error?.response?.data?.detail || error.message || '车辆出场失败')
      }
    }

    // 将模拟函数暴露到全局，便于测试
    if (typeof window !== 'undefined') {
      window.simulateRealTimeUpdate = simulateRealTimeUpdate
      window.wsManager = wsManager
      window.vehicleEntryHandler = handleVehicleEntry
      window.vehicleExitHandler = handleVehicleExit
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
      exportData,
      tableRowClassName,
      simulateRealTimeUpdate,
      handleVehicleEntry,
      handleVehicleExit
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/modern-theme.css';

.vehicle-records-container {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 现代化页面标题 */
.page-header {
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-content {
  padding: 24px;
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
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border: none;
  color: white;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

/* 现代化表格 */
.table-section {
  margin-bottom: 24px;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.export-btn {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border: none;
  color: white;
}

.modern-table {
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
}

.modern-table :deep(.el-table__header-wrapper) {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.modern-table :deep(.el-table__header th) {
  background: transparent;
  color: #ffffff;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 12px;
}

.modern-table :deep(.el-table__body tr) {
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.modern-table :deep(.el-table__body tr:hover) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.01);
}

.modern-table :deep(.el-table__body td) {
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
  color: rgba(255, 255, 255, 0.8);
}

.license-plate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.plate-text {
  font-weight: 600;
  color: #ffffff;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
}

.duration-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
}

.fee-cell {
  text-align: center;
}

.fee-amount {
  font-weight: 600;
  color: #4CAF50;
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
}

.status-tag.in-parking {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #4CAF50;
}

.status-tag.exited {
  background: rgba(158, 158, 158, 0.2);
  border: 1px solid rgba(158, 158, 158, 0.3);
  color: #9E9E9E;
}

.action-btn {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
}

/* 现代化分页 */
.pagination-section {
  display: flex;
  justify-content: center;
}

.modern-pagination {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pagination-modern :deep(.el-pagination) {
  color: rgba(255, 255, 255, 0.8);
}

.pagination-modern :deep(.el-pagination .btn-prev),
.pagination-modern :deep(.el-pagination .btn-next),
.pagination-modern :deep(.el-pagination .el-pager li) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.pagination-modern :deep(.el-pagination .el-pager li:hover),
.pagination-modern :deep(.el-pagination .btn-prev:hover),
.pagination-modern :deep(.el-pagination .btn-next:hover) {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.pagination-modern :deep(.el-pagination .el-pager li.active) {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border-color: #2196F3;
  color: #ffffff;
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

.stat-icon.enter {
  background: var(--success-gradient);
  color: white;
}

.stat-icon.exit {
  background: var(--error-gradient);
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