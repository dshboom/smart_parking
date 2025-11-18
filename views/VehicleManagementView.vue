<template>
  <div class="vehicle-management">
    <h2>车辆管理</h2>
    <el-card class="vehicle-card" shadow="hover" v-loading="loading.vehicles">
      <template #header>
        <div class="card-header">
          <span>我的车辆</span>
          <el-button type="primary" size="small" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>添加车辆
          </el-button>
        </div>
      </template>
      
      <el-table :data="vehicles" style="width: 100%">
        <el-table-column prop="license_plate" label="车牌号" min-width="120" />
        <el-table-column prop="model" label="车型" min-width="140" />
        <el-table-column prop="color" label="颜色" min-width="120" />
        <el-table-column prop="is_default" label="默认车辆" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_default ? 'success' : 'info'" size="small">
              {{ row.is_default ? '默认' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="添加时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.is_default" 
              type="primary" 
              link 
              size="small"
              @click="setDefaultVehicle(row.id)">
              设为默认
            </el-button>
            <el-button type="danger" link size="small" @click="removeVehicle(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加车辆对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加车辆"
      width="400px"
      @close="resetAddForm">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="80px">
        <el-form-item label="车牌号" prop="license_plate">
          <el-input 
            v-model="addForm.license_plate" 
            placeholder="请输入车牌号"
            maxlength="20" />
        </el-form-item>
        <el-form-item label="车型" prop="model">
          <el-input 
            v-model="addForm.model" 
            placeholder="请输入车型" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-input 
            v-model="addForm.color" 
            placeholder="请输入颜色" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addVehicle" :loading="loading.add">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getVehicles, addMyVehicle, removeMyVehicle, setDefaultVehicle } from '@/api/user'

export default {
  name: 'VehicleManagementView',
  components: {
    Plus
  },
  data() {
    return {
      vehicles: [],
      loading: {
        vehicles: false,
        add: false
      },
      showAddDialog: false,
      addForm: {
        license_plate: '',
        model: '',
        color: ''
      },
      addRules: {
        license_plate: [
          { required: true, message: '请输入车牌号', trigger: 'blur' },
          { pattern: /^[\u4e00-\u9fa5]{1}[A-Z]{1}[A-Z0-9]{4,5}[A-Z0-9\u4e00-\u9fa5]{1}$/, 
            message: '车牌号格式不正确', trigger: 'blur' }
        ],
        model: [
          { required: true, message: '请输入车型', trigger: 'blur' }
        ],
        color: [
          { required: true, message: '请输入颜色', trigger: 'blur' }
        ]
      }
    }
  },
  mounted() {
    this.loadVehicles()
  },
  methods: {
    // 加载车辆列表
    async loadVehicles() {
      this.loading.vehicles = true
      try {
        const response = await getVehicles()
        const base = response.data || []
        const meta = JSON.parse(localStorage.getItem('vehicleMeta') || '{}')
        this.vehicles = base.map(v => ({
          ...v,
          model: (meta[v.license_plate] && meta[v.license_plate].model) || '',
          color: (meta[v.license_plate] && meta[v.license_plate].color) || ''
        }))
      } catch (error) {
        ElMessage.error('加载车辆列表失败: ' + (error.message || '未知错误'))
      } finally {
        this.loading.vehicles = false
      }
    },

    // 添加车辆
    async addVehicle() {
      this.$refs.addFormRef.validate(async (valid) => {
        if (!valid) return
        
        this.loading.add = true
        try {
          await addMyVehicle({ license_plate: this.addForm.license_plate })
          const meta = JSON.parse(localStorage.getItem('vehicleMeta') || '{}')
          meta[this.addForm.license_plate] = { model: this.addForm.model, color: this.addForm.color }
          localStorage.setItem('vehicleMeta', JSON.stringify(meta))
          ElMessage.success('车辆添加成功')
          this.showAddDialog = false
          this.loadVehicles() // 重新加载列表
        } catch (error) {
          ElMessage.error('添加车辆失败: ' + (error.message || '未知错误'))
        } finally {
          this.loading.add = false
        }
      })
    },

    // 删除车辆
    async removeVehicle(vehicleId) {
      try {
        await ElMessageBox.confirm(
          '确定要删除这辆车吗？删除后将无法恢复。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await removeMyVehicle(vehicleId)
        const current = this.vehicles.find(v => v.id === vehicleId)
        if (current) {
          const meta = JSON.parse(localStorage.getItem('vehicleMeta') || '{}')
          delete meta[current.license_plate]
          localStorage.setItem('vehicleMeta', JSON.stringify(meta))
        }
        ElMessage.success('车辆删除成功')
        this.loadVehicles() // 重新加载列表
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除车辆失败: ' + (error.message || '未知错误'))
        }
      }
    },

    // 设为默认车辆
    async setDefaultVehicle(vehicleId) {
      try {
        await setDefaultVehicle(vehicleId)
        ElMessage.success('已设为默认车辆')
        this.loadVehicles() // 重新加载列表
      } catch (error) {
        ElMessage.error('设置默认车辆失败: ' + (error.message || '未知错误'))
      }
    },

    // 重置添加表单
    resetAddForm() {
      this.addForm.license_plate = ''
      this.addForm.model = ''
      this.addForm.color = ''
      this.$refs.addFormRef?.clearValidate()
    },

    // 获取状态样式
    getStatusType(status) {
      const statusMap = {
        'active': 'success',
        'inactive': 'warning',
        'blocked': 'danger'
      }
      return statusMap[status] || 'info'
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'active': '正常',
        'inactive': '停用',
        'blocked': '封禁'
      }
      return statusMap[status] || '未知'
    },

    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.vehicle-management {
  padding: 20px;
}

.vehicle-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-table {
  margin-top: 10px;
}
</style>