<template>
  <div class="parking-spaces-list">
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="空闲" value="available" />
            <el-option label="占用" value="occupied" />
            <el-option label="预留" value="reserved" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.space_type" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="普通" value="standard" />
            <el-option label="残疾人" value="disabled" />
            
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadParkingSpaces">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="spaces-grid">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="space in parkingSpaces" :key="space.id">
          <el-card class="space-card" :class="getSpaceCardClass(space)">
            <template #header>
              <div class="space-header">
                <span class="space-number">{{ space.space_number }}</span>
                <el-tag :type="getSpaceStatusType(space.status)" size="small">
                  {{ getSpaceStatusText(space.status) }}
                </el-tag>
              </div>
            </template>
            
            <div class="space-info">
              <div class="info-item">
                <span class="label">位置:</span>
                <span class="value">{{ space.row }}, {{ space.col }}</span>
              </div>
              <div class="info-item">
                <span class="label">类型:</span>
                <span class="value">{{ getSpaceTypeText(space.space_type) }}</span>
              </div>
              <div class="info-item" v-if="space.vehicle">
                <span class="label">车牌:</span>
                <span class="value">{{ space.vehicle.license_plate }}</span>
              </div>
              <div class="info-item" v-if="space.occupied_at">
                <span class="label">占用时间:</span>
                <span class="value">{{ formatTime(space.occupied_at) }}</span>
              </div>
            </div>

            <div class="space-actions">
              <el-button
                v-if="space.status === 'occupied'"
                type="success"
                size="small"
                @click="vacateSpace(space)"
              >
                释放
              </el-button>
              <el-button
                v-else-if="space.status === 'available'"
                type="warning"
                size="small"
                @click="reserveSpace(space)"
              >
                预留
              </el-button>
              <el-button
                v-if="space.status === 'reserved'"
                type="primary"
                size="small"
                @click="occupySpace(space)"
              >
                占用
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="showSpaceDetail(space)"
              >
                详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 40, 80, 160]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Space Detail Dialog -->
    <el-dialog
      v-model="showDetailDialog"
      title="停车位详情"
      width="600px"
    >
      <div v-if="selectedSpace" class="space-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="停车位编号">
            {{ selectedSpace.space_number }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getSpaceStatusType(selectedSpace.status)">
              {{ getSpaceStatusText(selectedSpace.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置">
            第 {{ selectedSpace.row }} 行，第 {{ selectedSpace.col }} 列
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ getSpaceTypeText(selectedSpace.space_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatTime(selectedSpace.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2" v-if="selectedSpace.updated_at">
            {{ formatTime(selectedSpace.updated_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="占用时间" :span="2" v-if="selectedSpace.occupied_at">
            {{ formatTime(selectedSpace.occupied_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="车辆信息" :span="2" v-if="selectedSpace.vehicle">
            <div class="vehicle-info">
              <p><strong>车牌号:</strong> {{ selectedSpace.vehicle.license_plate }}</p>
              <p><strong>车主:</strong> {{ selectedSpace.vehicle.owner_name }}</p>
              <p><strong>联系电话:</strong> {{ selectedSpace.vehicle.owner_phone }}</p>
              <p><strong>入场时间:</strong> {{ formatTime(selectedSpace.vehicle.entry_time) }}</p>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as parkingApi from '@/api/parking'

export default {
  name: 'ParkingSpacesList',
  props: {
    parkingLotId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // State
    const parkingSpaces = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)
    const showDetailDialog = ref(false)
    const selectedSpace = ref(null)

    // Filter
    const filterForm = reactive({
      status: '',
      space_type: ''
    })

    // Methods
    const loadParkingSpaces = async () => {
      loading.value = true
      try {
        const response = await parkingApi.getParkingSpaces(props.parkingLotId, {
          skip: (currentPage.value - 1) * pageSize.value,
          limit: pageSize.value,
          status_value: filterForm.status || undefined,
          space_type: filterForm.space_type || undefined
        })
        
        parkingSpaces.value = response
        total.value = response.length // 假设后端返回的是分页数据
      } catch (error) {
        ElMessage.error('加载停车位列表失败')
        console.error('Error loading parking spaces:', error)
      } finally {
        loading.value = false
      }
    }

    const vacateSpace = async (space) => {
      try {
        await ElMessageBox.confirm(
          `确定要释放停车位 "${space.space_number}" 吗？`,
          '确认释放',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await parkingApi.vacateParkingSpace(space.id)
        ElMessage.success('停车位释放成功')
        loadParkingSpaces()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('停车位释放失败')
        }
      }
    }

    const reserveSpace = async (space) => {
      try {
        await ElMessageBox.confirm(
          `确定要预留停车位 "${space.space_number}" 吗？`,
          '确认预留',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        // 获取当前用户与默认车辆
        const me = await (await import('@/api/user')).getInfo()
        const uid = me?.id
        const myVehicles = await (await import('@/api/user')).getMyVehicles()
        const arr = Array.isArray(myVehicles) ? myVehicles : []
        const def = arr.find(v => v.is_default) || arr[0]
        const vid = def?.id
        const until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        await parkingApi.reserveParkingSpace(space.id, { user_id: uid, vehicle_id: vid, reserved_until: until })
        ElMessage.success('停车位预留成功')
        loadParkingSpaces()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('停车位预留失败')
        }
      }
    }

    const occupySpace = async (space) => {
      try {
        const { value } = await ElMessageBox.prompt(
          `请输入要占用车位 "${space.space_number}" 的车辆车牌号：`,
          '占用停车位',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /^[\u4e00-\u9fa5]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9\u4e00-\u9fa5]{1}$/,
            inputErrorMessage: '请输入有效的车牌号格式（如：京A12345）'
          }
        )
        
        await parkingApi.occupyParkingSpace(space.id, { license_plate: value })
        ElMessage.success('停车位占用成功')
        loadParkingSpaces()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('停车位占用失败')
        }
      }
    }

    const showSpaceDetail = (space) => {
      selectedSpace.value = space
      showDetailDialog.value = true
    }

    const resetFilter = () => {
      filterForm.status = ''
      filterForm.space_type = ''
      loadParkingSpaces()
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      loadParkingSpaces()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      loadParkingSpaces()
    }

    // Helper functions
    const getSpaceStatusType = (status) => {
      const statusMap = {
        available: 'success',
        occupied: 'danger',
        reserved: 'warning'
      }
      return statusMap[status] || 'info'
    }

    const getSpaceStatusText = (status) => {
      const statusMap = {
        available: '空闲',
        occupied: '占用',
        reserved: '预留'
      }
      return statusMap[status] || status
    }

    const getSpaceTypeText = (type) => {
      const typeMap = {
        regular: '普通',
        disabled: '残疾人',
        
      }
      return typeMap[type] || type
    }

    const getSpaceCardClass = (space) => {
      return {
        'space-available': space.status === 'available',
        'space-occupied': space.status === 'occupied',
        'space-reserved': space.status === 'reserved'
      }
    }

    const formatTime = (timeString) => {
      if (!timeString) return '-'
      return new Date(timeString).toLocaleString('zh-CN')
    }

    // Watchers
    watch(() => props.parkingLotId, () => {
      loadParkingSpaces()
    })

    // Lifecycle
    onMounted(() => {
      loadParkingSpaces()
    })

    return {
      // State
      parkingSpaces,
      loading,
      currentPage,
      pageSize,
      total,
      showDetailDialog,
      selectedSpace,
      filterForm,
      
      // Methods
      loadParkingSpaces,
      vacateSpace,
      reserveSpace,
      occupySpace,
      showSpaceDetail,
      resetFilter,
      handleSizeChange,
      handleCurrentChange,
      
      // Helper functions
      getSpaceStatusType,
      getSpaceStatusText,
      getSpaceTypeText,
      getSpaceCardClass,
      formatTime
    }
  }
}
</script>

<style scoped>
.parking-spaces-list {
  padding: 20px;
}

.filter-bar {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.spaces-grid {
  margin-bottom: 20px;
}

.space-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.space-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.space-available {
  border-left: 4px solid #67c23a;
}

.space-occupied {
  border-left: 4px solid #f56c6c;
}

.space-reserved {
  border-left: 4px solid #e6a23c;
}

.space-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.space-number {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.space-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #909399;
  font-weight: 500;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.space-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.space-detail {
  padding: 20px;
}

.vehicle-info p {
  margin: 5px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .parking-spaces-list {
    padding: 10px;
  }
  
  .filter-bar {
    padding: 10px;
  }
  
  .space-actions {
    justify-content: center;
  }
}
</style>