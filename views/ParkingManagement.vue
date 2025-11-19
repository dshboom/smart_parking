<template>
  <div class="parking-management">
    <div class="table-header">
      <h3 class="table-title">停车场列表</h3>
      <div class="table-actions">
          <el-button type="primary" @click="showCreateDialog = true" class="add-parking-btn" v-permission="'parking:add'">
            <el-icon><Plus /></el-icon>
            新建停车场
          </el-button>
      </div>
    </div>

    <div class="table-wrapper" v-loading="loading">
        <el-table :data="parkingLots" style="width: 100%" class="modern-table">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" min-width="150" />
          <el-table-column prop="address" label="描述" min-width="200" />
          <el-table-column label="尺寸" width="120">
            <template #default="{ row }">
              <span class="size-text">{{ row.rows }} × {{ row.cols }}</span>
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
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewParkingLot(row)" class="action-btn view-btn">
                <el-icon><View /></el-icon>
              </el-button>
              <el-button type="warning" size="small" @click="editParkingLot(row)" class="action-btn edit-btn" v-permission="'parking:edit'">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="danger" size="small" @click="deleteParkingLot(row)" class="action-btn delete-btn" v-permission="'parking:delete'">
                <el-icon><Delete /></el-icon>
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
      width="90%"
      top="5vh"
      class="modern-dialog"
      :show-close="true"
      :close-on-click-modal="true"
    >
      <div v-if="selectedLot" class="parking-lot-detail">
        <ParkingLotVisualization 
          :parking-lot-id="selectedLot.id" 
          :read-only="false"
          @space-selected="handleSpaceSelected"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as parkingApi from '@/api/parking'
import { wsManager, subscribeToParkingUpdates } from '@/utils/websocket'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'

export default {
  name: 'ParkingManagement',
  components: {
    ParkingLotVisualization
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
      cols: 14
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
        const capacity = Number(lotForm.rows) * Number(lotForm.cols)
        if (editingLot.value) {
          await parkingApi.updateParkingLot(editingLot.value.id, { address: lotForm.description, total_capacity: capacity, status: 'OPEN' })
          const grid = Array.from({ length: lotForm.rows }, () => Array.from({ length: lotForm.cols }, () => 'parking'))
          await parkingApi.updateParkingLotLayout(editingLot.value.id, { rows: lotForm.rows, cols: lotForm.cols, grid, entrance_position: { row: 0, col: 0 }, exit_position: { row: Math.max(0, lotForm.rows - 1), col: Math.max(0, lotForm.cols - 1) } })
          ElMessage.success('停车场更新成功')
        } else {
          const created = await parkingApi.createParkingLot({ name: lotForm.name, address: lotForm.description || '', total_capacity: capacity, available_spots: capacity, status: 'OPEN' })
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
      lotForm.description = lot.address
      lotForm.rows = lot.rows
      lotForm.cols = lot.cols
      showCreateDialog.value = true
    }

    const quickViewVisualization = (lot) => {
      selectedLot.value = lot
      activeTab.value = 'visualization'
      showDetailDialog.value = true
    }


    const resetForm = () => {
      lotForm.name = ''
      lotForm.description = ''
      lotForm.rows = 10
      lotForm.cols = 14
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
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
  animation: fadeIn 0.5s ease-out;
  position: relative;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.parking-management::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff 0%, #52c41a 100%);
  z-index: 1;
}


:deep(.el-card__body) {
  overflow: visible;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.table-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.table-wrapper {
  padding: 24px;
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
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  position: relative;
}

.pagination-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff 0%, #52c41a 100%);
  z-index: 1;
}

.parking-lot-detail {
  min-height: 400px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 新建停车场按钮样式 - 匹配用户列表设计 */
.add-parking-btn {
  min-width: 130px;
  border-radius: 8px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: none;
  font-weight: 500;
  padding: 8px 16px;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #409eff, #5da8ff);
  color: white;
}

.add-parking-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

.add-parking-btn:active {
  transform: translateY(0) scale(1);
}

/* 操作按钮样式 - 匹配用户列表设计 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.action-btn {
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: none;
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.view-btn {
  background: linear-gradient(135deg, #409eff, #5da8ff);
  color: white;
}

.edit-btn {
  background: linear-gradient(135deg, #e6a23c, #f0c26a);
  color: white;
}

.delete-btn {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  color: white;
}

.preview-btn {
  background: linear-gradient(135deg, #909399, #a6a9ad);
  color: white;
}

/* Modern theme overrides */
:deep(.modern-table) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

:deep(.modern-table .el-table__header-wrapper) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px 16px 0 0;
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  padding: 16px 12px;
}

:deep(.modern-table .el-table__row:nth-child(even) td) {
  background: rgba(248, 250, 252, 0.4);
}

:deep(.modern-table .el-table__row:hover td) {
  background: rgba(64, 158, 255, 0.03);
  transition: all 0.2s ease;
}

:deep(.modern-tabs) {
  border-radius: 12px;
}

:deep(.modern-tabs .el-tabs__nav) {
  background: rgba(255, 255, 255, 0.95);
}

:deep(.modern-tabs .el-tabs__item) {
  color: #64748b;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.modern-tabs .el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

:deep(.modern-tabs .el-tabs__active-bar) {
  background: #409eff;
}

/* Responsive design */
@media (max-width: 768px) {
  .parking-management {
    padding: var(--spacing-md);
  }
  
  .table-title {
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
  transition: all 0.2s ease;
}

:deep(.modern-btn-warning-small),
:deep(.modern-btn-danger-small) {
  padding: 6px 10px;
  font-size: 11px;
  margin: 2px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s ease;
}
  
  /* 表格横向滚动优化 */
  .parking-management {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: var(--spacing-md);
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
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.08);
    color: #2c3e50;
    transition: all 0.2s ease;
  }
  
  .pagination-container :deep(.el-pagination button:hover) {
    background: rgba(64, 158, 255, 0.05);
    border-color: #409eff;
    color: #409eff;
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
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.08);
    color: #2c3e50;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  
  .pagination-container :deep(.el-pager li:hover) {
    background: rgba(64, 158, 255, 0.05);
    border-color: #409eff;
    color: #409eff;
  }
  
  .pagination-container :deep(.el-pager li.active) {
    background: #409eff;
    border: none;
    color: white;
  }
}

@media (max-width: 480px) {
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>}]}