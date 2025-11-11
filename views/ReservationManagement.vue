<template>
  <div class="reservation-management">
    <div class="page-header">
      <h1>预约管理</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增预约
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总预约数</div>
        </div>
        <div class="stat-icon total">
          <el-icon><Calendar /></el-icon>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.active }}</div>
          <div class="stat-label">活跃预约</div>
        </div>
        <div class="stat-icon active">
          <el-icon><Clock /></el-icon>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.todayNew }}</div>
          <div class="stat-label">今日新增</div>
        </div>
        <div class="stat-icon today">
          <el-icon><TrendCharts /></el-icon>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.cancellationRate }}%</div>
          <div class="stat-label">取消率</div>
        </div>
        <div class="stat-icon cancelled">
          <el-icon><Warning /></el-icon>
        </div>
      </el-card>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="用户">
          <el-input v-model="filterForm.user" placeholder="用户姓名或手机号" clearable />
        </el-form-item>
        
        <el-form-item label="停车场">
          <el-select v-model="filterForm.parkingLotId" placeholder="全部停车场" clearable>
            <el-option label="全部" value="" />
            <el-option 
              v-for="lot in parkingLots" 
              :key="lot.id" 
              :label="lot.name" 
              :value="lot.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预约列表 -->
    <el-card class="list-card">
      <el-table 
        :data="reservations" 
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="预约ID" width="80" />
        <el-table-column prop="userName" label="用户" min-width="120" />
        <el-table-column prop="userPhone" label="手机号" width="120" />
        <el-table-column prop="parkingLotName" label="停车场" min-width="150" />
        <el-table-column prop="spaceNumber" label="车位号" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="费用" width="100">
          <template #default="{ row }">
            ¥{{ row.fee?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetails(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button 
              v-if="row.status === 'active'" 
              type="warning" 
              link 
              @click="handleCancelReservation(row)"
            >
              <el-icon><Close /></el-icon>
              取消
            </el-button>
            <el-button 
              v-if="row.status === 'cancelled'" 
              type="success" 
              link 
              @click="rebookReservation(row)"
            >
              <el-icon><Refresh /></el-icon>
              重新预约
            </el-button>
            <el-button type="danger" link @click="handleDeleteReservation(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增预约对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="新增预约"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="用户" prop="userId">
          <el-select v-model="addForm.userId" placeholder="选择用户" style="width: 100%">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="停车场" prop="parkingLotId">
          <el-select 
            v-model="addForm.parkingLotId" 
            placeholder="选择停车场" 
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
        
        <el-form-item label="车位" prop="spaceNumber">
          <el-select 
            v-model="addForm.spaceNumber" 
            placeholder="选择车位" 
            style="width: 100%"
            :disabled="!addForm.parkingLotId"
          >
            <el-option
              v-for="space in availableSpaces"
              :key="space.number"
              :label="`${space.number}号车位 (${space.type})`"
              :value="space.number"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="预约时间" prop="timeRange">
          <el-date-picker
            v-model="addForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="车辆" prop="vehicleId">
          <el-select v-model="addForm.vehicleId" placeholder="选择车辆" style="width: 100%">
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
            v-model="addForm.remark"
            type="textarea"
            :rows="3"
            placeholder="特殊需求说明"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAdd" :loading="submitting">
          确认预约
        </el-button>
      </template>
    </el-dialog>

    <!-- 预约详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="预约详情"
      width="600px"
    >
      <div v-if="selectedReservation" class="reservation-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预约ID">{{ selectedReservation.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedReservation.status)">
              {{ getStatusText(selectedReservation.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户">{{ selectedReservation.userName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ selectedReservation.userPhone }}</el-descriptions-item>
          <el-descriptions-item label="停车场">{{ selectedReservation.parkingLotName }}</el-descriptions-item>
          <el-descriptions-item label="车位号">{{ selectedReservation.spaceNumber }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(selectedReservation.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(selectedReservation.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="预约费用">¥{{ selectedReservation.fee?.toFixed(2) || '0.00' }}</el-descriptions-item>
          <el-descriptions-item label="车辆">{{ selectedReservation.vehicleInfo }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(selectedReservation.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedReservation.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Refresh, View, Close, Delete, Calendar, 
  Clock, TrendCharts, Warning, TrendCharts as TrendChartsIcon, Download
} from '@element-plus/icons-vue'
import { getReservations, createReservation, updateReservation, deleteReservation, cancelReservation as apiCancelReservation, getReservationStats } from '@/api/reservations'
import { getParkingLots } from '@/api/parking'
import { getUsers } from '@/api/users'
import { wsManager, subscribeToReservationUpdates } from '@/utils/websocket'

// 状态管理
const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const selectedReservation = ref(null)
const selectedIds = ref([])
// 取消订阅句柄
let offReservationUpdates = null

// 统计数据
const stats = reactive({
  total: 0,
  active: 0,
  todayNew: 0,
  cancellationRate: 0
})

// 筛选表单
const filterForm = reactive({
  status: '',
  user: '',
  parkingLotId: '',
  dateRange: null
})

// 新增表单
const addFormRef = ref(null)
const addForm = reactive({
  userId: '',
  parkingLotId: '',
  spaceNumber: '',
  timeRange: null,
  vehicleId: '',
  remark: ''
})

const addRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  parkingLotId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  spaceNumber: [{ required: true, message: '请选择车位', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择预约时间', trigger: 'change' }],
  vehicleId: [{ required: true, message: '请选择车辆', trigger: 'change' }]
}

// 数据列表
const reservations = ref([])
const parkingLots = ref([])
const users = ref([])
const availableSpaces = ref([])
const userVehicles = ref([])

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 状态映射
const getStatusType = (status) => {
  const types = {
    active: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 格式化时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await getReservationStats()
    // 后端返回: { totalReservations, activeReservations, todayNew, todayCompleted, cancellationRate }
    stats.total = Number(response?.totalReservations ?? 0)
    stats.active = Number(response?.activeReservations ?? 0)
    stats.todayNew = Number(response?.todayNew ?? 0)
    stats.cancellationRate = Number(response?.cancellationRate ?? 0)
  } catch (error) {
    ElMessage.error('加载统计数据失败')
  }
}

// 加载预约列表
const loadReservations = async () => {
  loading.value = true
  try {
    const skip = (pagination.current - 1) * pagination.pageSize
    const limit = pagination.pageSize
    const isNumericUser = filterForm.user && /^\d+$/.test(filterForm.user)
    const params = {
      status: filterForm.status || undefined,
      user_id: isNumericUser ? Number(filterForm.user) : undefined,
      start_date: filterForm.dateRange?.[0] ? new Date(filterForm.dateRange[0]).toISOString() : undefined,
      end_date: filterForm.dateRange?.[1] ? new Date(filterForm.dateRange[1]).toISOString() : undefined,
      skip,
      limit
    }

    const response = await getReservations(params)
    // 后端返回: { total, reservations, skip, limit }
    const list = Array.isArray(response?.reservations) ? response.reservations : []
    reservations.value = list.map(r => ({
      id: r.id,
      userName: r.user?.username || '-',
      userPhone: r.user?.phone || '-',
      parkingLotName: r.parkingSpace?.lotName || '-',
      spaceNumber: r.parkingSpace?.position || '-',
      startTime: r.startTime || null,
      endTime: r.endTime || null,
      status: r.status || 'active',
      fee: r.fee ?? null,
      remark: r.remark || ''
    }))
    pagination.total = Number(response?.total ?? list.length)
  } catch (error) {
    ElMessage.error('加载预约列表失败')
  } finally {
    loading.value = false
  }
}

// 加载停车场列表
const loadParkingLots = async () => {
  try {
    const response = await getParkingLots()
    parkingLots.value = response
  } catch (error) {
    ElMessage.error('加载停车场列表失败')
  }
}

// 加载用户列表
const loadUsers = async () => {
  try {
    const response = await getUsers()
    users.value = response
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  }
}

// 导出数据
const exportData = async () => {
  try {
    // 获取所有数据用于导出（不受分页限制）
    const isNumericUser = filterForm.user && /^\d+$/.test(filterForm.user)
    const params = {
      status: filterForm.status || undefined,
      user_id: isNumericUser ? Number(filterForm.user) : undefined,
      start_date: filterForm.dateRange?.[0] ? new Date(filterForm.dateRange[0]).toISOString() : undefined,
      end_date: filterForm.dateRange?.[1] ? new Date(filterForm.dateRange[1]).toISOString() : undefined,
      skip: 0,
      limit: 1000
    }
    const response = await getReservations(params)
    const allReservations = (response?.reservations ?? []).map(r => ({
      id: r.id,
      userName: r.user?.username || '-',
      userPhone: r.user?.phone || '-',
      parkingLotName: r.parkingSpace?.lotName || '-',
      spaceNumber: r.parkingSpace?.position || '-',
      startTime: r.startTime || null,
      endTime: r.endTime || null,
      status: r.status || 'active',
      fee: r.fee ?? null,
      remark: r.remark || ''
    }))
    
    // 使用新的导出工具类
    const { exportToExcel } = await import('@/utils/export')
    
    const exportData = allReservations.map(reservation => ({
      '预约ID': reservation.id,
      '用户姓名': reservation.userName,
      '手机号': reservation.userPhone,
      '停车场': reservation.parkingLotName,
      '车位号': reservation.spaceNumber,
      '开始时间': formatDateTime(reservation.startTime),
      '结束时间': formatDateTime(reservation.endTime),
      '状态': getStatusText(reservation.status),
      '费用': reservation.fee ? `¥${reservation.fee.toFixed(2)}` : '¥0.00',
      '备注': reservation.remark || '-'
    }))
    
    await exportToExcel(exportData, '预约管理', '预约记录导出')
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('数据导出失败')
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadReservations()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    status: '',
    user: '',
    parkingLotId: '',
    dateRange: null
  })
  handleSearch()
}

// 分页变化
const handleSizeChange = (val) => {
  pagination.pageSize = val
  loadReservations()
}

const handleCurrentChange = (val) => {
  pagination.current = val
  loadReservations()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// 停车场变化
const onParkingLotChange = async (parkingLotId) => {
  if (!parkingLotId) {
    availableSpaces.value = []
    return
  }
  
  try {
    // TODO: 获取停车场可用车位
    // const response = await getAvailableSpaces(parkingLotId)
    // availableSpaces.value = response
    
    // 模拟数据
    availableSpaces.value = [
      { number: 'A001', type: '标准车位' },
      { number: 'A002', type: '标准车位' },
      { number: 'B001', type: 'VIP车位' }
    ]
  } catch (error) {
    ElMessage.error('加载车位列表失败')
  }
}

// 查看详情
const viewDetails = (row) => {
  selectedReservation.value = row
  showDetailDialog.value = true
}

// 取消预约
const handleCancelReservation = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await apiCancelReservation(row.id)
    ElMessage.success('预约已取消')
    loadReservations()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消预约失败')
    }
  }
}

// 重新预约
const rebookReservation = (row) => {
  // 填充新增表单
  addForm.userId = row.userId
  addForm.parkingLotId = row.parkingLotId
  addForm.spaceNumber = row.spaceNumber
  addForm.vehicleId = row.vehicleId
  addForm.remark = row.remark
  
  showAddDialog.value = true
}

// 删除预约
const handleDeleteReservation = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteReservation(row.id)
    ElMessage.success('预约已删除')
    loadReservations()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除预约失败')
    }
  }
}

// 提交新增
const submitAdd = async () => {
  if (!addFormRef.value) return
  
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const [startTime, endTime] = addForm.timeRange
      const data = {
        userId: addForm.userId,
        parkingLotId: addForm.parkingLotId,
        spaceNumber: addForm.spaceNumber,
        startTime: startTime,
        endTime: endTime,
        vehicleId: addForm.vehicleId,
        remark: addForm.remark
      }
      
      await createReservation(data)
      ElMessage.success('预约创建成功')
      showAddDialog.value = false
      resetForm()
      loadReservations()
      loadStats()
    } catch (error) {
      ElMessage.error('创建预约失败')
    } finally {
      submitting.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (addFormRef.value) {
    addFormRef.value.resetFields()
  }
  Object.assign(addForm, {
    userId: '',
    parkingLotId: '',
    spaceNumber: '',
    timeRange: null,
    vehicleId: '',
    remark: ''
  })
  availableSpaces.value = []
}

// WebSocket实时数据更新处理
const handleReservationUpdate = (data) => {
  console.log('预约状态更新:', data)
  // 刷新预约列表
  loadReservations()
  // 刷新统计数据
  loadStats()
}

// 初始化WebSocket连接
const initWebSocketConnection = () => {
  // 订阅预约状态更新
  offReservationUpdates = subscribeToReservationUpdates((data) => {
    handleReservationUpdate(data)
  })
  
  // 暴露wsManager到全局对象供调试使用
  if (typeof window !== 'undefined') {
    window.wsManager = wsManager
  }
}

// 初始化
onMounted(() => {
  loadStats()
  loadReservations()
  loadParkingLots()
  loadUsers()
  initWebSocketConnection()
})

// 清理工作
onUnmounted(() => {
  // 取消WebSocket订阅（对 space_reserved / space_unreserved 生效）
  if (typeof offReservationUpdates === 'function') {
    offReservationUpdates()
  }
})
</script>

<style scoped>
.reservation-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

/* 统计卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-left: 20px;
}

.stat-icon.total {
  background-color: #e6f7ff;
  color: #1890ff;
}

.stat-icon.active {
  background-color: #f6ffed;
  color: #52c41a;
}

.stat-icon.today {
  background-color: #fff7e6;
  color: #fa8c16;
}

.stat-icon.cancelled {
  background-color: #fff2e8;
  color: #ff4d4f;
}

/* 筛选卡片样式 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* 列表卡片样式 */
.list-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 详情样式 */
.reservation-detail {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-form {
    flex-direction: column;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .reservation-management {
    padding: 15px;
  }
  
  .stat-card :deep(.el-card__body) {
    padding: 15px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
    margin-left: 15px;
  }
  
  /* 表格移动端优化 */
  .list-card :deep(.el-table) {
    font-size: 12px;
  }
  
  .list-card :deep(.el-table th) {
    padding: 8px 4px !important;
  }
  
  .list-card :deep(.el-table td) {
    padding: 8px 4px !important;
  }
  
  /* 操作按钮组优化 */
  .list-card :deep(.el-button) {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  /* 分页组件优化 */
  .pagination-container :deep(.el-pagination) {
    font-size: 12px;
  }
  
  .pagination-container :deep(.el-pagination button) {
    padding: 0 8px;
    height: 28px;
  }
  
  .pagination-container :deep(.el-pager li) {
    height: 28px;
    line-height: 28px;
    min-width: 28px;
  }
}

@media (max-width: 480px) {
  .reservation-management {
    padding: 10px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .stat-card :deep(.el-card__body) {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }
  
  .stat-icon {
    margin-left: 0;
    margin-bottom: 10px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .filter-form .el-form-item {
    margin-right: 0 !important;
    width: 100%;
  }
  
  .filter-form .el-select,
  .filter-form .el-input,
  .filter-form .el-date-picker {
    width: 100% !important;
  }
  
  /* 对话框移动端优化 */
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  :deep(.el-dialog__body) {
    padding: 15px;
  }
  
  /* 表格横向滚动 */
  .list-card {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .list-card :deep(.el-table) {
    min-width: 600px;
  }
}
</style>