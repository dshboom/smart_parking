<template>
  <div class="parking-management">
    <div class="header-section">
      <h1 class="page-title modern-header">停车场管理</h1>
      <p class="page-subtitle">管理所有停车场信息</p>
    </div>
    
    <div class="parking-lots-container modern-card">
      <div class="table-header">
        <h3 class="table-title">停车场列表</h3>
        <div class="table-actions">
            <el-button type="success" @click="exportData" class="modern-btn">
              <el-icon><DownloadIcon /></el-icon>
              导出数据
            </el-button>
            <el-button type="primary" @click="showCreateDialog = true" class="modern-btn" v-permission="'parking:add'">
              <el-icon><PlusIcon /></el-icon>
              新建停车场
            </el-button>
        </div>
      </div>

      <div class="parking-lots-list" v-loading="loading">
        <el-table :data="parkingLots" style="width: 100%" class="modern-table">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" min-width="150" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column label="尺寸" width="120">
            <template #default="{ row }">
              <span class="size-text">{{ row.rows }} × {{ row.cols }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" class="modern-tag">
                {{ row.is_active ? '活跃' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="统计" width="150">
            <template #default="{ row }">
              <div class="stats-info">
                <span class="stats-total">总: {{ row.stats?.total_spaces || 0 }}</span>
                <span class="stats-occupied">占: {{ row.stats?.occupied_spaces || 0 }}</span>
                <span class="stats-available">空: {{ row.stats?.available_spaces || 0 }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="可视化" width="100">
            <template #default="{ row }">
              <el-button 
                type="info" 
                size="small" 
                @click="quickViewVisualization(row)" 
                class="modern-btn-info-small"
                v-permission="'parking:view'"
              >
                <el-icon><ViewIcon /></el-icon>
                预览
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewParkingLot(row)" class="modern-btn-small">
                查看
              </el-button>
              <el-button type="warning" size="small" @click="editParkingLot(row)" class="modern-btn-warning-small" v-permission="'parking:edit'">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="deleteParkingLot(row)" class="modern-btn-danger-small" v-permission="'parking:delete'">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container modern-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingLot ? '编辑停车场' : '新建停车场'"
      width="600px"
      class="modern-dialog"
    >
      <el-form :model="lotForm" :rules="lotRules" ref="lotFormRef" label-width="100px" class="modern-form">
        <el-form-item label="名称" prop="name">
          <el-input v-model="lotForm.name" placeholder="请输入停车场名称" class="modern-input" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="lotForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入停车场描述"
            class="modern-textarea"
          />
        </el-form-item>
        <el-form-item label="行数" prop="rows">
          <el-input-number v-model="lotForm.rows" :min="5" :max="20" class="modern-input-number" />
        </el-form-item>
        <el-form-item label="列数" prop="cols">
          <el-input-number v-model="lotForm.cols" :min="5" :max="30" class="modern-input-number" />
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="lotForm.is_active" class="modern-switch" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false" class="modern-btn-secondary">取消</el-button>
          <el-button type="primary" @click="saveParkingLot" class="modern-btn">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Parking Lot Detail Dialog -->
    <el-dialog
      v-model="showDetailDialog"
      title="停车场详情"
      width="90%"
      top="5vh"
      class="modern-dialog"
    >
      <div v-if="selectedLot" class="parking-lot-detail">
        <el-tabs v-model="activeTab" class="modern-tabs">
          <el-tab-pane label="可视化" name="visualization">
            <ParkingLotVisualization 
              :parking-lot-id="selectedLot.id" 
              :read-only="false"
              @space-selected="handleSpaceSelected"
            />
          </el-tab-pane>
          <el-tab-pane label="停车位列表" name="spaces">
            <ParkingSpacesList :parking-lot-id="selectedLot.id" />
          </el-tab-pane>
          <el-tab-pane label="统计信息" name="statistics">
            <ParkingLotStatistics :parking-lot-id="selectedLot.id" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus as PlusIcon, View as ViewIcon } from '@element-plus/icons-vue'
import * as parkingApi from '@/api/parking'
import { wsManager, subscribeToParkingUpdates } from '@/utils/websocket'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'
import ParkingSpacesList from '@/components/ParkingSpacesList.vue'
import ParkingLotStatistics from '@/components/ParkingLotStatistics.vue'

export default {
  name: 'ParkingManagement',
  components: {
    PlusIcon,
    ViewIcon,
    ParkingLotVisualization,
    ParkingSpacesList,
    ParkingLotStatistics
  },
  setup() {
    // State
    const parkingLots = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const showCreateDialog = ref(false)
    const showDetailDialog = ref(false)
    const selectedLot = ref(null)
    const editingLot = ref(null)
    const activeTab = ref('visualization')
    const selectedSpace = ref(null)
    // 保存 WebSocket 订阅的卸载函数，防止内存泄漏
    let offParkingUpdates = null

    // Form
    const lotFormRef = ref(null)
    const lotForm = reactive({
      name: '',
      description: '',
      rows: 10,
      cols: 14,
      is_active: true
    })

    const lotRules = {
      name: [
        { required: true, message: '请输入停车场名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入停车场描述', trigger: 'blur' }
      ],
      rows: [
        { required: true, message: '请输入行数', trigger: 'blur' }
      ],
      cols: [
        { required: true, message: '请输入列数', trigger: 'blur' }
      ]
    }

    // Methods
    const handleSpaceSelected = (space) => {
      selectedSpace.value = space
      ElMessage.success(`已选择车位: ${space.space_number}`)
    }
    const loadParkingLots = async () => {
      loading.value = true
      try {
        const response = await parkingApi.getParkingLots({
          skip: (currentPage.value - 1) * pageSize.value,
          limit: pageSize.value
        })
        const lotsWithInfo = await Promise.all(
          response.map(async (lot) => {
            let stats = null
            let layout = null
            try { stats = await parkingApi.getParkingLotStats(lot.id) } catch (_) {}
            try { layout = await parkingApi.getParkingLotLayout(lot.id) } catch (_) {}
            const rows = layout?.rows || 0
            const cols = layout?.cols || 0
            return { ...lot, stats, rows, cols }
          })
        )
        parkingLots.value = lotsWithInfo
        total.value = response.length
      } catch (error) {
        ElMessage.error('加载停车场列表失败')
        console.error('Error loading parking lots:', error)
      } finally {
        loading.value = false
      }
    }

    const saveParkingLot = async () => {
      try {
        await lotFormRef.value.validate()
        const status = lotForm.is_active ? 'OPEN' : 'CLOSED'
        const capacity = Number(lotForm.rows) * Number(lotForm.cols)
        if (editingLot.value) {
          await parkingApi.updateParkingLot(editingLot.value.id, { address: lotForm.description, total_capacity: capacity, status })
          const grid = Array.from({ length: lotForm.rows }, () => Array.from({ length: lotForm.cols }, () => 'parking'))
          await parkingApi.updateParkingLotLayout(editingLot.value.id, { rows: lotForm.rows, cols: lotForm.cols, grid, entrance_position: { row: 0, col: 0 }, exit_position: { row: Math.max(0, lotForm.rows - 1), col: Math.max(0, lotForm.cols - 1) } })
          ElMessage.success('停车场更新成功')
        } else {
          const created = await parkingApi.createParkingLot({ name: lotForm.name, address: lotForm.description || '', total_capacity: capacity, available_spots: capacity, status })
          const lotId = created?.id || created?.data?.id || created?.lot_id || null
          if (lotId) {
            const grid = Array.from({ length: lotForm.rows }, () => Array.from({ length: lotForm.cols }, () => 'parking'))
            await parkingApi.updateParkingLotLayout(lotId, { rows: lotForm.rows, cols: lotForm.cols, grid, entrance_position: { row: 0, col: 0 }, exit_position: { row: Math.max(0, lotForm.rows - 1), col: Math.max(0, lotForm.cols - 1) } })
          }
          ElMessage.success('停车场创建成功')
        }
        showCreateDialog.value = false
        loadParkingLots()
        resetForm()
      } catch (error) {
        if (error !== false) { // 验证失败时不显示错误
          ElMessage.error(editingLot.value ? '停车场更新失败' : '停车场创建失败')
        }
      }
    }

    const deleteParkingLot = async (lot) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除停车场 "${lot.name}" 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await parkingApi.deleteParkingLot(lot.id)
        ElMessage.success('停车场删除成功')
        loadParkingLots()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('停车场删除失败')
        }
      }
    }

    const viewParkingLot = (lot) => {
      selectedLot.value = lot
      showDetailDialog.value = true
    }

    const editParkingLot = (lot) => {
      editingLot.value = lot
      lotForm.name = lot.name
      lotForm.description = lot.description
      lotForm.rows = lot.rows
      lotForm.cols = lot.cols
      lotForm.is_active = lot.is_active
      showCreateDialog.value = true
    }

    const quickViewVisualization = (lot) => {
      selectedLot.value = lot
      activeTab.value = 'visualization'
      showDetailDialog.value = true
    }

    // 导出数据
    const exportData = async () => {
      try {
        // 获取所有停车场数据用于导出（不受分页限制）
        const response = await parkingApi.getParkingLots({
          skip: 0,
          limit: 10000
        })
        
        // 使用新的导出工具类
        const { exportToExcel } = await import('@/utils/export')
        
        const exportData = response.map(lot => ({
          '停车场ID': lot.id,
          '名称': lot.name,
          '描述': lot.description,
          '尺寸': `${lot.rows} × ${lot.cols}`,
          '状态': lot.is_active ? '活跃' : '停用',
          '总车位数': lot.stats?.total_spaces || 0,
          '已占用': lot.stats?.occupied_spaces || 0,
          '可用车位': lot.stats?.available_spaces || 0,
          '创建时间': lot.created_at || '-',
          '更新时间': lot.updated_at || '-'
        }))
        
        await exportToExcel(exportData, '停车场管理', '停车场数据导出')
        ElMessage.success('数据导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('数据导出失败')
      }
    }

    const resetForm = () => {
      lotForm.name = ''
      lotForm.description = ''
      lotForm.rows = 10
      lotForm.cols = 14
      lotForm.is_active = true
      editingLot.value = null
    }

    // WebSocket实时数据更新处理
    const handleParkingUpdate = (data) => {
      console.log('停车场状态更新:', data)
      // 刷新停车场列表
      loadParkingLots()
    }

    // 初始化WebSocket连接
    const initWebSocketConnection = () => {
      // 订阅停车场状态更新
      offParkingUpdates = subscribeToParkingUpdates((data) => {
        handleParkingUpdate(data)
      })
      
      // 暴露wsManager到全局对象供调试使用
      if (typeof window !== 'undefined') {
        window.wsManager = wsManager
      }
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      loadParkingLots()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      loadParkingLots()
    }

    // Watchers
    watch(showCreateDialog, (val) => {
      if (!val) {
        resetForm()
      }
    })

    // Lifecycle
    onMounted(() => {
      loadParkingLots()
      initWebSocketConnection()
    })

    // 清理工作
    onUnmounted(() => {
      // 取消WebSocket订阅
      try {
        if (typeof offParkingUpdates === 'function') {
          offParkingUpdates()
        }
      } catch (err) {
        console.error('取消停车更新订阅失败:', err)
      }
    })

    return {
      // State
      parkingLots,
      loading,
      currentPage,
      pageSize,
      total,
      showCreateDialog,
      showDetailDialog,
      selectedLot,
      editingLot,
      activeTab,
      selectedSpace,
      
      // Form
      lotFormRef,
      lotForm,
      lotRules,
      
      // Methods
      loadParkingLots,
      saveParkingLot,
      viewParkingLot,
      editParkingLot,
      deleteParkingLot,
      handleSpaceSelected,
      quickViewVisualization,
      exportData,
      resetForm,
      handleSizeChange,
      handleCurrentChange,
      handleParkingUpdate,
      initWebSocketConnection
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/modern-theme.css';

.parking-management {
  padding: 32px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  animation: fadeIn 0.5s ease-out;
  position: relative;
  overflow: hidden;
}

.parking-management::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(64, 158, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(82, 196, 26, 0.1) 0%, transparent 50%);
  z-index: -1;
}

.header-section {
  margin-bottom: 32px;
  text-align: center;
  position: relative;
}

.header-section::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  animation: slideInDown 0.6s ease-out;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin-bottom: 0;
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.parking-lots-container {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.8s ease-out 0.3s both;
  position: relative;
  overflow: hidden;
}

:deep(.el-card__body) {
  overflow: visible;
}

.parking-lots-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(82, 196, 26, 0.03) 100%);
  z-index: -1;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.table-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #409eff 50%, transparent 100%);
}

.table-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  position: relative;
}

.table-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #409eff 0%, #52c41a 100%);
  border-radius: 2px;
}

.parking-lots-list {
  margin-bottom: var(--spacing-lg);
}

.stats-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stats-total {
  color: var(--text-secondary);
}

.stats-occupied {
  color: var(--danger-color);
  font-weight: 600;
}

.stats-available {
  color: var(--success-color);
  font-weight: 600;
}

.size-text {
  font-weight: 600;
  color: var(--primary-color);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.pagination-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(82, 196, 26, 0.03) 100%);
  z-index: -1;
}

.parking-lot-detail {
  min-height: 400px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Modern theme overrides */
:deep(.modern-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.modern-table .el-table__header-wrapper) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

:deep(.modern-table .el-table__header th) {
  background: transparent;
  color: #2c3e50;
  font-weight: 600;
  border: none;
  padding: 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.modern-table .el-table__body td) {
  color: #2c3e50;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 12px;
}

:deep(.modern-table .el-table__row:hover) {
  background-color: rgba(64, 158, 255, 0.05);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transition: all 0.3s ease;
}

:deep(.modern-tag) {
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid currentColor;
  padding: 4px 12px;
}

:deep(.modern-tag.el-tag--success) {
  background: rgba(82, 196, 26, 0.1);
  border-color: #52c41a;
  color: #52c41a;
}

:deep(.modern-tag.el-tag--warning) {
  background: rgba(250, 173, 20, 0.1);
  border-color: #faad14;
  color: #faad14;
}

:deep(.modern-tag.el-tag--danger) {
  background: rgba(245, 34, 45, 0.1);
  border-color: #f5222d;
  color: #f5222d;
}

:deep(.modern-tag:hover) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.modern-switch) {
  --el-switch-on-color: var(--success-color);
  --el-switch-off-color: var(--info-color);
}

:deep(.modern-tabs) {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

:deep(.modern-tabs .el-tabs__nav) {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

:deep(.modern-tabs .el-tabs__item) {
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.modern-tabs .el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}

:deep(.modern-tabs .el-tabs__active-bar) {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
}

/* Responsive design */
@media (max-width: 768px) {
  .parking-management {
    padding: var(--spacing-md);
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .table-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .stats-info {
    flex-direction: row;
    justify-content: space-between;
  }
  
  :deep(.modern-table) {
    font-size: 12px;
  }
  
  :deep(.modern-btn-small) {
  padding: 6px 10px;
  font-size: 11px;
  margin: 2px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #409eff 0%, #52c41a 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

:deep(.modern-btn-small:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

:deep(.modern-btn-warning-small),
:deep(.modern-btn-danger-small) {
  padding: 6px 10px;
  font-size: 11px;
  margin: 2px;
}
  
  .parking-lots-container {
    padding: var(--spacing-md);
  }
  
  /* 表格横向滚动优化 */
  .parking-lots-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  :deep(.el-table) {
    min-width: 700px;
  }
  
  /* 搜索和操作区域优化 */
  .table-header {
    padding: var(--spacing-md);
  }
  
  .search-input {
    width: 100%;
    margin-bottom: var(--spacing-sm);
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  
  /* 统计卡片优化 */
  .stats-grid {
    gap: var(--spacing-sm);
  }
  
  .stat-card :deep(.el-card__body) {
    padding: var(--spacing-sm);
  }
  
  /* 分页组件优化 */
  .pagination-container :deep(.el-pagination) {
    font-size: 14px;
  }
  
  .pagination-container :deep(.el-pagination button) {
    padding: 0 12px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #2c3e50;
    transition: all 0.3s ease;
  }
  
  .pagination-container :deep(.el-pagination button:hover) {
    background: rgba(64, 158, 255, 0.1);
    border-color: #409eff;
    color: #409eff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
  
  .pagination-container :deep(.el-pagination button:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .pagination-container :deep(.el-pager li) {
    height: 32px;
    line-height: 32px;
    min-width: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #2c3e50;
    transition: all 0.3s ease;
    font-weight: 500;
  }
  
  .pagination-container :deep(.el-pager li:hover) {
    background: rgba(64, 158, 255, 0.1);
    border-color: #409eff;
    color: #409eff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
  
  .pagination-container :deep(.el-pager li.active) {
    background: linear-gradient(135deg, #409eff 0%, #52c41a 100%);
    border: none;
    color: white;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .table-header {
    gap: var(--spacing-sm);
  }
  
  .stats-info {
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
  }
  
  :deep(.modern-table .el-table__cell) {
    padding: 8px 4px;
  }
  
  /* 超小屏幕额外优化 */
  .parking-management {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .search-input {
    margin-bottom: var(--spacing-xs);
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .action-buttons .el-button {
    width: 100%;
    justify-content: center;
    margin-bottom: var(--spacing-xs);
  }
  
  /* 对话框优化 */
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  :deep(.el-dialog__body) {
    padding: 15px;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .dialog-footer .el-button {
    width: 100%;
  }
  
  /* 表单优化 */
  :deep(.el-form-item) {
    margin-bottom: 15px;
  }
  
  :deep(.el-form-item__label) {
    padding-bottom: 4px;
  }
  
  /* 可视化组件优化 */
  .parking-lot-detail {
    min-height: 300px;
    padding: var(--spacing-sm);
  }
  
  /* 统计信息优化 */
  .stats-info {
    font-size: 10px;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .stats-total,
  .stats-occupied,
  .stats-available {
    font-size: 11px;
  }
  
  .size-text {
    font-size: 10px;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

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

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>}]}