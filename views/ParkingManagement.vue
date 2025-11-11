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
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button type="primary" @click="showCreateDialog = true" class="modern-btn" v-permission="'parking:create'">
            <el-icon><Plus /></el-icon>
            新建停车场
          </el-button>
        </div>
      </div>

      <div class="parking-lots-list">
        <el-table :data="parkingLots" style="width: 100%" v-loading="loading" class="modern-table">
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
                <el-icon><View /></el-icon>
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
import { Plus, View, Download } from '@element-plus/icons-vue'
import * as parkingApi from '@/api/parking'
import { wsManager, subscribeToParkingUpdates } from '@/utils/websocket'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'
import ParkingSpacesList from '@/components/ParkingSpacesList.vue'
import ParkingLotStatistics from '@/components/ParkingLotStatistics.vue'

export default {
  name: 'ParkingManagement',
  components: {
    Plus,
    View,
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
        
        // Load stats for each parking lot
        const lotsWithStats = await Promise.all(
          response.map(async (lot) => {
            try {
              const stats = await parkingApi.getParkingLotStats(lot.id)
              return { ...lot, stats }
            } catch (error) {
              console.error(`Failed to load stats for lot ${lot.id}:`, error)
              return { ...lot, stats: null }
            }
          })
        )
        
        parkingLots.value = lotsWithStats
        total.value = response.length // 假设后端返回的是分页数据
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
        
        if (editingLot.value) {
          await parkingApi.updateParkingLot(editingLot.value.id, lotForm)
          ElMessage.success('停车场更新成功')
        } else {
          await parkingApi.createParkingLot(lotForm)
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
  padding: var(--spacing-xl);
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  animation: fadeIn 0.5s ease-out;
}

.header-section {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: var(--spacing-sm);
  animation: slideInDown 0.6s ease-out;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 0;
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.parking-lots-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-light);
}

.table-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
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
  margin-top: var(--spacing-lg);
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
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

:deep(.modern-table .el-table__header-wrapper) {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
}

:deep(.modern-table .el-table__header th) {
  background: transparent;
  color: white;
  font-weight: 600;
  border: none;
}

:deep(.modern-table .el-table__row:hover) {
  background-color: rgba(var(--primary-color-rgb), 0.05);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

:deep(.modern-tag) {
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  animation: pulse 2s infinite;
}

:deep(.modern-tag.el-tag--success) {
  background: linear-gradient(135deg, var(--success-color) 0%, var(--success-light) 100%);
  border: none;
  color: white;
}

:deep(.modern-tag.el-tag--info) {
  background: linear-gradient(135deg, var(--info-color) 0%, var(--info-light) 100%);
  border: none;
  color: white;
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
  
  :deep(.modern-btn-small),
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