<template>
  <div class="parking-navigation">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>智能停车导航</span>
          <el-button type="primary" @click="findNearestSpace" :loading="loading">
            <el-icon><Location /></el-icon>
            查找最近车位
          </el-button>
        </div>
      </template>

      <!-- Step 1: Select Parking Lot -->
      <div class="step-section" v-if="currentStep === 1">
        <h3>步骤 1: 选择停车场</h3>
        <div class="parking-lots-grid">
          <el-card
            v-for="lot in parkingLots"
            :key="lot.id"
            class="parking-lot-card"
            :class="{ selected: selectedLot?.id === lot.id }"
            @click="selectParkingLot(lot)"
          >
            <template #header>
              <div class="lot-header">
                <span class="lot-name">{{ lot.name }}</span>
                <el-tag :type="lot.is_active ? 'success' : 'info'" size="small">
                  {{ lot.is_active ? '开放' : '关闭' }}
                </el-tag>
              </div>
            </template>
            <div class="lot-info">
              <p class="lot-description">{{ lot.description }}</p>
              <div class="lot-stats">
                <span class="stat-item">
                  <strong>总车位:</strong> {{ lot.stats?.total_spaces || 0 }}
                </span>
                <span class="stat-item available">
                  <strong>空闲:</strong> {{ lot.stats?.available_spaces || 0 }}
                </span>
                <span class="stat-item occupied">
                  <strong>占用:</strong> {{ lot.stats?.occupied_spaces || 0 }}
                </span>
              </div>
              <div class="occupancy-rate">
                <span>占用率: {{ lot.stats?.occupancy_rate?.toFixed(1) || 0 }}%</span>
                <el-progress
                  :percentage="lot.stats?.occupancy_rate || 0"
                  :status="getOccupancyStatus(lot.stats?.occupancy_rate)"
                  :stroke-width="6"
                />
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- Step 2: Enter Vehicle Info -->
      <div class="step-section" v-if="currentStep === 2">
        <h3>步骤 2: 输入车辆信息</h3>
        <el-form :model="vehicleForm" :rules="vehicleRules" ref="vehicleFormRef" label-width="120px">
          <el-form-item label="车牌号码" prop="license_plate">
            <LicensePlateInput
              ref="licensePlateRef"
              :value="vehicleForm.license_plate"
              @input="val => vehicleForm.license_plate = val"
              @enter="findNearestSpace"
              placeholder="请输入车牌号"
            />
          </el-form-item>
          <el-form-item label="车辆类型" prop="vehicle_type">
            <el-select v-model="vehicleForm.vehicle_type" placeholder="请选择车辆类型">
              <el-option label="小型车" value="small" />
              <el-option label="中型车" value="medium" />
              <el-option label="大型车" value="large" />
            </el-select>
          </el-form-item>
          <el-form-item label="特殊需求">
            <el-checkbox-group v-model="vehicleForm.special_requirements">
              <el-checkbox label="disabled">残疾人车位</el-checkbox>
              <el-checkbox label="charging">充电车位</el-checkbox>
              <el-checkbox label="covered">室内车位</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="findNearestSpace">
              查找最近车位
            </el-button>
            <el-button @click="currentStep = 1">
              返回选择停车场
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Step 3: Navigation Result -->
      <div class="step-section" v-if="currentStep === 3">
        <h3>步骤 3: 导航结果</h3>
        <div v-if="navigationResult" class="navigation-result">
          <el-alert
            v-if="navigationResult.success"
            title="找到停车位！"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="navigation-info">
                <p><strong>目标停车位:</strong> {{ navigationResult.space.space_number }}</p>
                <p><strong>位置:</strong> 第 {{ navigationResult.space.row }} 行，第 {{ navigationResult.space.col }} 列</p>
                <p><strong>距离:</strong> {{ navigationResult.distance }} 米</p>
                <p><strong>预计步行时间:</strong> {{ navigationResult.estimated_time }} 分钟</p>
              </div>
            </template>
          </el-alert>

          <el-alert
            v-else
            title="未找到合适的停车位"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>{{ navigationResult.message || '抱歉，当前没有符合您需求的空闲停车位。' }}</p>
            </template>
          </el-alert>

          <!-- Navigation Path Visualization -->
          <div v-if="navigationResult.path && navigationResult.path.length > 0" class="path-visualization">
            <h4>导航路径</h4>
            <div class="path-steps">
              <div
                v-for="(step, index) in navigationResult.path"
                :key="index"
                class="path-step"
                :class="{ current: index === currentStepIndex }"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-info">
                  <div class="step-action">{{ getStepAction(step, index) }}</div>
                  <div class="step-position">位置: ({{ step.row }}, {{ step.col }})</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <el-button type="success" @click="confirmParking" v-if="navigationResult.success">
              确认停车
            </el-button>
            <el-button type="primary" @click="startNavigation" v-if="navigationResult.success">
              开始导航
            </el-button>
            <el-button @click="resetNavigation">
              重新查找
            </el-button>
          </div>
        </div>
      </div>

      <!-- Parking Lot Visualization -->
      <div class="visualization-section" v-if="selectedLot && currentStep >= 1">
        <h4>停车场布局</h4>
        <div class="lot-visualization">
          <ParkingLotVisualization
            :parking-lot-id="selectedLot.id"
            :select-mode="true"
            :highlight-space="navigationResult?.space?.id"
            :show-path="navigationResult?.path"
            @space-selected="onSpaceSelected"
          />
        </div>
      </div>
    </el-card>

    <!-- Navigation Dialog -->
    <el-dialog
      v-model="showNavigationDialog"
      title="实时导航"
      width="80%"
      top="10vh"
    >
      <div class="navigation-dialog">
        <div class="navigation-status">
          <el-progress
            :percentage="navigationProgress"
            :status="navigationProgress === 100 ? 'success' : 'primary'"
            :stroke-width="8"
          />
          <p class="navigation-text">{{ navigationText }}</p>
        </div>
        
        <div class="mini-map">
          <ParkingLotVisualization
            :parking-lot-id="selectedLot.id"
            :highlight-space="navigationResult?.space?.id"
            :current-position="currentPosition"
            :show-path="remainingPath"
          />
        </div>

        <div class="navigation-controls">
          <el-button @click="pauseNavigation" v-if="!isPaused">
            暂停导航
          </el-button>
          <el-button @click="resumeNavigation" v-else>
            继续导航
          </el-button>
          <el-button @click="stopNavigation">
            停止导航
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, Top, Bottom, Left, Right } from '@element-plus/icons-vue'
import { getParkingLots, getParkingLotStats, getParkingLotLayout, findNearestAvailableSpace, calculateNavigationPath, occupyParkingSpace } from '@/api/parking'
import ParkingLotVisualization from '@/components/ParkingLotVisualization.vue'
import LicensePlateInput from '@/components/LicensePlateInput.vue'

export default {
  name: 'ParkingNavigation',
  components: {
    Location,
    ParkingLotVisualization,
    LicensePlateInput
  },
  setup() {
    // State
    const parkingLots = ref([])
    const selectedLot = ref(null)
    const currentStep = ref(1)
    const loading = ref(false)
    const navigationResult = ref(null)
    const showNavigationDialog = ref(false)
    const currentStepIndex = ref(0)
    const navigationProgress = ref(0)
    const navigationText = ref('')
    const isPaused = ref(false)
    const currentPosition = ref(null)
    const remainingPath = ref([])
    const enteredVehicleId = ref(null)
    const entrancePosition = ref({ row: 0, col: 0 })

    // Forms
    const vehicleFormRef = ref(null)
    const licensePlateRef = ref(null)
    const vehicleForm = reactive({
      license_plate: '',
      vehicle_type: 'small',
      special_requirements: []
    })

    const vehicleRules = {
      license_plate: [
        { required: true, message: '请输入车牌号码', trigger: 'blur' },
        { pattern: /^[\u4e00-\u9fa5]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9\u4e00-\u9fa5]{1}$/, message: '请输入有效的车牌号码格式', trigger: 'blur' }
      ],
      vehicle_type: [
        { required: true, message: '请选择车辆类型', trigger: 'change' }
      ]
    }

    // Methods
    const loadParkingLots = async () => {
      try {
        const response = await getParkingLots({ is_active: true })
        
        // Load stats for each parking lot
        const lotsWithStats = await Promise.all(
          response.map(async (lot) => {
            try {
              const stats = await getParkingLotStats(lot.id)
              return { ...lot, stats }
            } catch (error) {
              console.error(`Failed to load stats for lot ${lot.id}:`, error)
              return { ...lot, stats: null }
            }
          })
        )
        
        parkingLots.value = lotsWithStats
      } catch (error) {
        ElMessage.error('加载停车场列表失败')
        console.error('Error loading parking lots:', error)
      }
    }

    const selectParkingLot = (lot) => {
      selectedLot.value = lot
      currentStep.value = 2
      loadEntrancePosition()
    }

    const findNearestSpace = async () => {
      if (!selectedLot.value) {
        ElMessage.warning('请先选择停车场')
        return
      }

      if (currentStep.value === 2) {
        try {
          await vehicleFormRef.value.validate()
        } catch (error) {
          return
        }
        // 额外使用专用车牌输入组件进行校验与抖动提示
        if (licensePlateRef.value && !licensePlateRef.value.validate()) {
          return
        }
      }

      loading.value = true
      try {
        // 先执行入场，拿到车辆ID（若已在场则读取车辆信息）
        const nearest = await findNearestAvailableSpace(
          selectedLot.value.id,
          entrancePosition.value || { row: 0, col: 0 },
          'standard'
        )
        if (nearest && nearest.space_id) {
          const nav = await calculateNavigationPath(
            selectedLot.value.id,
            entrancePosition.value || { row: 0, col: 0 },
            { row: nearest.row, col: nearest.col }
          )
          navigationResult.value = {
            success: true,
            space: { id: nearest.space_id, space_number: `#${nearest.space_id}`, row: nearest.row, col: nearest.col },
            path: nav?.path || [],
            distance: nearest.distance,
            estimated_time: (Array.isArray(nav?.path) ? nav.path.length : 0)
          }
        } else {
          navigationResult.value = { success: false, message: '未找到可用车位' }
        }
        currentStep.value = 3
        ElMessage.success('找到最近的停车位！')
      } catch (error) {
        ElMessage.error('查找停车位失败')
        console.error('Error finding nearest space:', error)
      } finally {
        loading.value = false
      }
    }

    const loadEntrancePosition = async () => {
      if (!selectedLot.value) return
      try {
        const layout = await getParkingLotLayout(selectedLot.value.id)
        if (layout && layout.entrance_position) {
          entrancePosition.value = layout.entrance_position
        }
      } catch (error) {
        console.warn('加载入口位置失败，使用默认入口 (0,0)')
      }
    }

    const onSpaceSelected = async ({ spaceId, row, col, spaceNumber }) => {
      if (!selectedLot.value) return
      loading.value = true
      try {
        const nav = await parkingApi.calculateNavigationPath(
          selectedLot.value.id,
          entrancePosition.value || { row: 0, col: 0 },
          { row, col }
        )

        navigationResult.value = {
          success: true,
          space: { id: spaceId, space_number: spaceNumber, row, col },
          path: nav?.path || [],
          distance: nav?.distance,
          estimated_time: nav?.estimated_time
        }
        currentStep.value = 3
      } catch (error) {
        ElMessage.error('路径计算失败')
        console.error('Error calculating path:', error)
      } finally {
        loading.value = false
      }
    }

    const getOccupancyStatus = (rate) => {
      if (rate < 50) return 'success'
      if (rate < 80) return 'warning'
      return 'exception'
    }

    const getStepAction = (step, index) => {
      if (index === 0) return '从入口出发'
      if (index === navigationResult.value.path.length - 1) return '到达目的地'
      
      const prevStep = navigationResult.value.path[index - 1]
      if (step.col > prevStep.col) return '向右走'
      if (step.col < prevStep.col) return '向左走'
      if (step.row > prevStep.row) return '向下走'
      if (step.row < prevStep.row) return '向上走'
      
      return '直行'
    }

    const confirmParking = async () => {
      if (!navigationResult.value?.space) {
        ElMessage.error('没有可用的停车位信息')
        return
      }

      try {
        if (!enteredVehicleId.value) {
          ElMessage.warning('尚未获取车辆ID，请重新查找车位')
          return
        }
        await occupyParkingSpace(
          navigationResult.value.space.id,
          { license_plate: vehicleForm.license_plate }
        )
        ElMessage.success('停车确认成功！')
        resetNavigation()
      } catch (error) {
        ElMessage.error('停车确认失败')
        console.error('Error confirming parking:', error)
      }
    }

    const startNavigation = () => {
      if (!navigationResult.value?.path || navigationResult.value.path.length === 0) {
        ElMessage.error('没有可用的导航路径')
        return
      }

      currentStepIndex.value = 0
      navigationProgress.value = 0
      currentPosition.value = navigationResult.value.path[0]
      remainingPath.value = [...navigationResult.value.path]
      
      showNavigationDialog.value = true
      updateNavigationStatus()
      
      // Simulate navigation progress
      const interval = setInterval(() => {
        if (!isPaused.value && navigationProgress.value < 100) {
          navigationProgress.value += 5
          
          // Update current step
          const totalSteps = navigationResult.value.path.length
          const currentStep = Math.floor((navigationProgress.value / 100) * totalSteps)
          currentStepIndex.value = Math.min(currentStep, totalSteps - 1)
          
          // Update position
          if (currentStep < totalSteps) {
            currentPosition.value = navigationResult.value.path[currentStep]
            remainingPath.value = navigationResult.value.path.slice(currentStep)
          }
          
          updateNavigationStatus()
          
          if (navigationProgress.value >= 100) {
            clearInterval(interval)
            navigationText.value = '导航完成！您已到达目的地。'
            ElMessage.success('导航完成！')
          }
        }
      }, 1000)
    }

    const updateNavigationStatus = () => {
      if (currentStepIndex.value < navigationResult.value.path.length - 1) {
        const nextStep = navigationResult.value.path[currentStepIndex.value + 1]
        const action = getStepAction(nextStep, currentStepIndex.value + 1)
        navigationText.value = `请${action}，距离目的地还有 ${navigationResult.value.path.length - currentStepIndex.value - 1} 步`
      } else {
        navigationText.value = '您已到达目的地！'
      }
    }

    const pauseNavigation = () => {
      isPaused.value = true
      ElMessage.info('导航已暂停')
    }

    const resumeNavigation = () => {
      isPaused.value = false
      ElMessage.success('导航已恢复')
    }

    const stopNavigation = () => {
      showNavigationDialog.value = false
      isPaused.value = false
      navigationProgress.value = 0
      currentStepIndex.value = 0
      ElMessage.info('导航已停止')
    }

    const resetNavigation = () => {
      currentStep.value = 1
      selectedLot.value = null
      navigationResult.value = null
      vehicleForm.license_plate = ''
      vehicleForm.vehicle_type = 'small'
      vehicleForm.special_requirements = []
      enteredVehicleId.value = null
    }

    // Watchers
    watch(currentStep, (newStep) => {
      if (newStep === 2 && !vehicleForm.license_plate) {
        // Auto-generate a license plate for demo
        vehicleForm.license_plate = '京A' + Math.random().toString(36).substr(2, 5).toUpperCase()
      }
    })

    // Lifecycle
    onMounted(() => {
      loadParkingLots()
    })

    return {
      // State
      parkingLots,
      selectedLot,
      currentStep,
      loading,
      navigationResult,
      showNavigationDialog,
      currentStepIndex,
      navigationProgress,
      navigationText,
      isPaused,
      currentPosition,
      remainingPath,
      entrancePosition,
      onSpaceSelected,
      enteredVehicleId,
      
      // Forms
      vehicleFormRef,
      licensePlateRef,
      vehicleForm,
      vehicleRules,
      
      // Methods
      loadParkingLots,
      selectParkingLot,
      findNearestSpace,
      getOccupancyStatus,
      getStepAction,
      confirmParking,
      startNavigation,
      pauseNavigation,
      resumeNavigation,
      stopNavigation,
      resetNavigation
    }
  }
}
</script>

<style scoped>
.parking-navigation {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.step-section h3 {
  margin-bottom: 20px;
  color: #303133;
}

.parking-lots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.parking-lot-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.parking-lot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.parking-lot-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.lot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lot-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.lot-description {
  color: #606266;
  margin: 10px 0;
  font-size: 14px;
}

.lot-stats {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
  font-size: 14px;
}

.stat-item {
  text-align: center;
}

.stat-item.available {
  color: #67c23a;
}

.stat-item.occupied {
  color: #f56c6c;
}

.occupancy-rate {
  margin-top: 15px;
}

.navigation-result {
  margin: 20px 0;
}

.navigation-info {
  margin-top: 10px;
}

.navigation-info p {
  margin: 5px 0;
  font-size: 14px;
}

.path-visualization {
  margin: 20px 0;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.path-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.path-step {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border-left: 4px solid #dcdfe6;
}

.path-step.current {
  border-left-color: #409eff;
  background-color: #ecf5ff;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #909399;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
}

.path-step.current .step-number {
  background-color: #409eff;
}

.step-info {
  flex: 1;
}

.step-action {
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.step-position {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.visualization-section {
  margin-top: 30px;
}

.visualization-section h4 {
  margin-bottom: 15px;
  color: #303133;
}

.lot-visualization {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.navigation-dialog {
  padding: 20px;
}

.navigation-status {
  margin-bottom: 20px;
}

.navigation-text {
  margin-top: 10px;
  font-size: 16px;
  color: #303133;
  text-align: center;
}

.mini-map {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.navigation-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .parking-navigation {
    padding: 10px;
  }
  
  .parking-lots-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .navigation-controls {
    flex-direction: column;
  }
}
</style>
