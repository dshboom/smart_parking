<template>
  <div class="parking-lot-visualization">
    <ControlPanel
      :read-only="readOnly"
      v-model:edit-mode="editMode"
      v-model:selected-tool="selectedTool"
      v-model:selected-spot="selectedSpot"
      :stats="stats"
      :path="path"
      @find-nearest-empty-spot="findNearestEmptySpot"
      @reset-layout="resetLayout"
      @save-selected-spot-attributes="saveSelectedSpotAttributes"
    />

    

    <div class="visualization-container">
      <div class="grid-wrapper">
        <el-card>
          <template #header>
            <span>停车场布局 - {{ parkingLot?.name || '未命名停车场' }}</span>
          </template>
          
          <ParkingGrid
            :grid="grid"
            :occupied-spots="occupiedSpots"
            :coord-to-space="coordToSpace"
            :path="path"
            :GRID_ROWS="GRID_ROWS"
            :GRID_COLS="GRID_COLS"
            :highlight-coord="highlightCoord"
            @cell-click="handleCellClick"
            @cell-hover="handleCellHover"
          />
        </el-card>
      </div>
    </div>

    <div class="legend-panel">
      <el-card>
        <template #header>
          <span>图例</span>
        </template>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color entrance"></div>
            <span>入口</span>
          </div>
          <div class="legend-item">
            <div class="legend-color exit"></div>
            <span>出口</span>
          </div>
          <div class="legend-item">
            <div class="legend-color parking"></div>
            <span>普通车位</span>
          </div>
          <div class="legend-item">
            <div class="legend-color parking occupied"></div>
            <span>已占用</span>
          </div>
          <div class="legend-item">
            <div class="legend-color parking vip"></div>
            <span>VIP车位</span>
          </div>
          <div class="legend-item">
            <div class="legend-color parking reserved"></div>
            <span>已预约</span>
          </div>
          <div class="legend-item">
            <div class="legend-color parking maintenance"></div>
            <span>维护停用</span>
          </div>
          <div class="legend-item">
            <div class="legend-color road"></div>
            <span>道路</span>
          </div>
          <div class="legend-item">
            <div class="legend-color wall"></div>
            <span>墙壁</span>
          </div>
          <div class="legend-item">
            <div class="legend-color path"></div>
            <span>导航路径</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as parkingApi from '@/api/parking'
import { wsManager } from '@/utils/websocket'
import { usePathfinding } from '@/composables/usePathfinding'
import ParkingGrid from './ParkingGrid.vue'
import ControlPanel from './ControlPanel.vue'

export default {
  name: 'ParkingLotVisualization',
  components: {
    ParkingGrid,
    ControlPanel,
  },
  props: {
    parkingLotId: {
      type: Number,
      required: true
    },
    selectMode: {
      type: Boolean,
      default: false
    },
    // 用户端只读模式：隐藏编辑控件并禁用修改
    readOnly: {
      type: Boolean,
      default: false
    },
    highlightSpace: {
      type: Number,
      default: null
    },
    showPath: {
      type: Array,
      default: () => []
    },
    currentPosition: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    // State
    const parkingLot = ref(null)
    const grid = ref([])
    const occupiedSpots = ref(new Set())
    const coordToSpace = ref(new Map())
    const path = ref([])
    const entrancePosition = ref(null)
    const exitPosition = ref(null)
    const editMode = ref(false)
    const selectedTool = ref('parking')
    const selectedSpot = ref(null)
    const spaceIdToCoord = ref(new Map())
    const stats = reactive({
      total_spaces: 0,
      occupied_spaces: 0,
      available_spaces: 0
    })

    // WebSocket 事件取消订阅引用
    let offMessage = null

    // Constants
    const GRID_ROWS = 10
    const GRID_COLS = 14

    const { astar } = usePathfinding(grid, occupiedSpots, GRID_ROWS, GRID_COLS)

    // Methods
    const initGrid = () => {
      const newGrid = []
      for (let row = 0; row < GRID_ROWS; row++) {
        const newRow = []
        for (let col = 0; col < GRID_COLS; col++) {
          if (row === 0 && col === 0) {
            newRow.push('entrance')
          } else if (row === GRID_ROWS - 1 && col === GRID_COLS - 1) {
            newRow.push('exit')
          } else if (row === 0 || row === GRID_ROWS - 1 || col === 0 || col === GRID_COLS - 1) {
            newRow.push('wall')
          } else if ((row % 2 === 1 && col % 3 === 1) && (row > 1 && row < GRID_ROWS - 2)) {
            newRow.push('parking')
          } else {
            newRow.push('road')
          }
        }
        newGrid.push(newRow)
      }
      grid.value = newGrid
    }

    const loadParkingLotData = async () => {
      try {
        const [lotResponse, layoutResponse, statsResponse] = await Promise.all([
          parkingApi.getParkingLot(props.parkingLotId),
          parkingApi.getParkingLotLayout(props.parkingLotId),
          parkingApi.getParkingLotStats(props.parkingLotId)
        ])

        parkingLot.value = lotResponse
        
        if (layoutResponse.layout_data && layoutResponse.layout_data.grid) {
          grid.value = layoutResponse.layout_data.grid
        }

        // Read entrance/exit from backend if provided
        if (layoutResponse.entrance_position &&
            typeof layoutResponse.entrance_position.row === 'number' &&
            typeof layoutResponse.entrance_position.col === 'number') {
          entrancePosition.value = {
            row: layoutResponse.entrance_position.row,
            col: layoutResponse.entrance_position.col
          }
        }
        if (layoutResponse.exit_position &&
            typeof layoutResponse.exit_position.row === 'number' &&
            typeof layoutResponse.exit_position.col === 'number') {
          exitPosition.value = {
            row: layoutResponse.exit_position.row,
            col: layoutResponse.exit_position.col
          }
        }

        // Load all spaces to build id->coord map and occupied set
        const spacesResponse = await parkingApi.getParkingSpaces(props.parkingLotId)
        spaceIdToCoord.value = new Map(
          (spacesResponse || []).map(space => [space.id, { row: space.row, col: space.col }])
        )
        coordToSpace.value = new Map(
          (spacesResponse || []).map(space => [`${space.row},${space.col}`, space])
        )
        occupiedSpots.value = new Set(
          (spacesResponse || [])
            .filter(space => space.is_occupied)
            .map(space => `${space.row},${space.col}`)
        )

        // Update stats
        stats.total_spaces = statsResponse.total_spaces
        stats.occupied_spaces = statsResponse.occupied_spaces
        stats.available_spaces = statsResponse.available_spaces

      } catch (error) {
        ElMessage.error('加载停车场数据失败')
        console.error('Error loading parking lot data:', error)
      }
    }

    const findNearestEmptySpot = async () => {
      if (!props.parkingLotId) return
      
      try {
        // Determine start position: use currentPosition prop, entrance from layout, or fallback to (0,0)
        const start = props.currentPosition
          ? { row: props.currentPosition.row, col: props.currentPosition.col }
          : (entrancePosition.value || { row: 0, col: 0 })

        // Determine space type by user status/VIP membership
        let spaceType = 'standard'
        try {
          // Lazy import store to avoid circular deps
          const store = (await import('@/store')).default
          const status = store?.state?.user?.status || ''
          if (status === 'user') {
            // Prefer using /users/me to avoid 404 when not VIP
            const info = await store.dispatch('user/getInfo').catch(() => null)
            if (info && typeof info.vip_level === 'number') {
              spaceType = 'vip'
            }
          }
        } catch (_) {
          // Ignore store errors; default to standard
        }

        const result = await parkingApi.findNearestAvailableSpace(
          props.parkingLotId,
          start,
          spaceType
        )
        
        if (result && result.space && result.navigation_path) {
          path.value = result.navigation_path.path
          selectedSpot.value = result.space
          ElMessage.success(`找到最近停车位: ${result.space.id}, 距离: ${result.navigation_path.distance}米`)
        } else {
          path.value = []
          selectedSpot.value = null
          ElMessage.warning('未找到可用停车位')
        }
      } catch (error) {
        console.error('Error finding nearest space:', error)
        ElMessage.error('查找最近停车位失败')
      }
    }

    // Fallback: scan grid to find the first 'exit' cell
    const detectExitFromGrid = () => {
      for (let r = 0; r < grid.value.length; r++) {
        for (let c = 0; c < (grid.value[r] || []).length; c++) {
          if (grid.value[r][c] === 'exit') {
            return { row: r, col: c }
          }
        }
      }
      return null
    }

    const findExitPath = (fromSpot) => {
      const fallback = { row: GRID_ROWS - 1, col: GRID_COLS - 1 }
      const exit = exitPosition.value || detectExitFromGrid() || fallback
      const pathResult = astar(fromSpot, exit)
      if (pathResult) {
        path.value = pathResult
        ElMessage.success(`找到出口路径！距离: ${pathResult.length - 1} 步`)
      } else {
        ElMessage.warning('未找到到出口的路径')
      }
    }

    const handleCellClick = async ({ row, col }) => {
      const key = `${row},${col}`
      const cellType = grid.value[row][col]

      if (editMode.value) {
        // 只读模式下禁止任何编辑
        if (props.readOnly) return
        // 编辑模式
        if (selectedTool.value === 'entrance' || selectedTool.value === 'exit') {
          // 确保只有一个入口或出口
          for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
              if (grid.value[r][c] === selectedTool.value) {
                grid.value[r][c] = 'road'
              }
            }
          }
        }
        grid.value[row][col] = selectedTool.value
        // 若选择的是停车位，选中该位置用于右侧属性编辑
        if (selectedTool.value === 'parking') {
          const space = coordToSpace.value.get(key)
          if (space) {
            selectedSpot.value = space
          } else {
            // 尝试按坐标查询车位
            try {
              const spacesResponse = await parkingApi.getParkingSpaces(props.parkingLotId, { row, col })
              if (spacesResponse && spacesResponse.length > 0) {
                selectedSpot.value = spacesResponse[0]
                coordToSpace.value.set(key, spacesResponse[0])
              }
            } catch (_) {}
          }
        }
        
        // 保存布局到后端
        try {
          await parkingApi.updateParkingLotLayout(props.parkingLotId, {
            grid: grid.value
          })
          ElMessage.success('布局更新成功')
        } catch (error) {
          ElMessage.error('布局更新失败')
        }
      } else {
        // 正常模式
        // 只读模式：在启用选择模式时允许点选空闲车位；同时保留对已占用车位的“到出口”导航
        if (props.readOnly) {
          if (cellType === 'parking') {
            if (occupiedSpots.value.has(key)) {
              // 已占用：显示到出口路径
              findExitPath({ row, col })
              return
            }
            // 只读 + 选择模式：允许点选空闲车位并向外发射事件
            if (props.selectMode) {
              const space = coordToSpace.value.get(key)
              if (space) {
                selectedSpot.value = space
                emit('space-selected', space)
              } else {
                ElMessage.warning('该位置无车位或布局未同步')
              }
              return
            }
          }
          return
        }
        if (cellType === 'parking') {
          if (occupiedSpots.value.has(key)) {
            // 如果停车位被占用，显示到出口的路径
            findExitPath({ row, col })
          } else {
            // 如果处于选择模式，则向外发射事件而不是直接占用
            if (props.selectMode) {
              // 使用坐标到车位的本地映射，避免错误过滤
              const space = coordToSpace.value.get(key)
              if (space) {
                selectedSpot.value = space
                emit('space-selected', space)
              } else {
                ElMessage.warning('该位置无车位或布局未同步')
              }
            } else {
              // 如果停车位空着，占用它（组件独立使用场景）
              try {
                const space = coordToSpace.value.get(key)
                if (!space) {
                  ElMessage.warning('该位置无车位或布局未同步')
                  return
                }
                await parkingApi.occupyParkingSpace(space.id, 1) // 假设vehicle_id为1
                occupiedSpots.value.add(key)
                ElMessage.success('停车位占用成功')
              } catch (error) {
                const msg = error?.response?.data?.detail || '占用停车位失败'
                ElMessage.error(msg)
              }
            }
          }
        }
      }
      // 统一在选择模式或普通模式下点击停车位时，若未占用则额外发射space-selected事件
      if (cellType === 'parking' && !occupiedSpots.value.has(key)) {
        const space = coordToSpace.value.get(key)
        if (space) {
          emit('space-selected', space)
        }
      }
    }

    const handleCellHover = ({ row, col }) => {
      // 可以添加悬停效果
    }

    const toggleEditMode = () => {
      editMode.value = !editMode.value
      if (!editMode.value) {
        selectedSpot.value = null
      }
    }

    const resetLayout = async () => {
      try {
        initGrid()
        await parkingApi.updateParkingLotLayout(props.parkingLotId, {
          grid: grid.value
        })
        ElMessage.success('布局重置成功')
      } catch (error) {
        ElMessage.error('布局重置失败')
      }
    }

    const saveSelectedSpotAttributes = async () => {
      if (!selectedSpot.value) return
      try {
        const payload = {
          space_type: selectedSpot.value.space_type || 'standard',
          is_under_maintenance: !!selectedSpot.value.is_under_maintenance
        }
        const updated = await parkingApi.updateParkingSpace(selectedSpot.value.id, payload)
        // 更新本地缓存
        coordToSpace.value.set(`${updated.row},${updated.col}`, updated)
        // 触发响应式更新
        coordToSpace.value = new Map(coordToSpace.value)
        selectedSpot.value = updated
        ElMessage.success('车位属性已保存')
      } catch (error) {
        ElMessage.error('保存车位属性失败')
      }
    }

    const displayPath = computed(() => {
      if (props.showPath && props.showPath.length > 0) {
        return props.showPath.map(node => (
          'row' in node && 'col' in node
            ? { row: node.row, col: node.col }
            : { row: node.y ?? node.row, col: node.x ?? node.col }
        ))
      }
      return path.value
    })

    const isInPath = (row, col) => {
      return displayPath.value.some(node => node.row === row && node.col === col)
    }

    const getCellClasses = (cell, index) => {
      const classes = ['grid-cell', cell.type]
      
      if (isInPath(cell.row, cell.col)) {
        classes.push('in-path')
      }
      
      if (cell.type === 'parking' && cell.isOccupied) {
        classes.push('occupied')
      }
      if (cell.type === 'parking' && cell.spaceType === 'vip') {
        classes.push('vip')
      }
      if (cell.type === 'parking' && cell.isReserved) {
        classes.push('reserved')
      }
      if (cell.type === 'parking' && cell.isUnderMaintenance) {
        classes.push('maintenance')
      }
      
      // Highlight selected spot from internal selection
      if (selectedSpot.value && 
          selectedSpot.value.row === cell.row && 
          selectedSpot.value.col === cell.col) {
        classes.push('selected')
      }

      // Highlight target space from external prop
      if (props.highlightSpace && spaceIdToCoord.value.size > 0) {
        const coord = spaceIdToCoord.value.get(props.highlightSpace)
        if (coord && coord.row === cell.row && coord.col === cell.col) {
          classes.push('selected')
        }
      }
      
      return classes
    }

    const highlightCoord = computed(() => {
      if (props.highlightSpace && spaceIdToCoord.value) {
        return spaceIdToCoord.value.get(props.highlightSpace) || null
      }
      return null
    })

    const getTooltipContent = (cell) => {
      if (cell.type === 'entrance') return '入口'
      if (cell.type === 'exit') return '出口'
      if (cell.type === 'wall') return '墙壁'
      if (cell.type === 'road') return '道路'
      if (cell.type === 'parking') {
        const typeLabel = cell.spaceType === 'vip' ? 'VIP车位' : '普通车位'
        const stateLabel = cell.isUnderMaintenance
          ? '维护停用'
          : cell.isReserved
            ? '已预约'
            : (cell.isOccupied ? '已占用' : '空闲')
        return `${typeLabel}｜${stateLabel}`
      }
      return ''
    }

    const handleWebSocketMessage = (message) => {
      try {
        if (!message || typeof message !== 'object') return

        if (message.event === 'space_occupied') {
          const coord = spaceIdToCoord.value.get(message.space_id)
          if (coord) {
            occupiedSpots.value.add(`${coord.row},${coord.col}`)
            // 触发响应式更新
            occupiedSpots.value = new Set(occupiedSpots.value)
            stats.occupied_spaces++
            stats.available_spaces--
          }
        } else if (message.event === 'space_vacated') {
          const coord = spaceIdToCoord.value.get(message.space_id)
          if (coord) {
            occupiedSpots.value.delete(`${coord.row},${coord.col}`)
            // 触发响应式更新
            occupiedSpots.value = new Set(occupiedSpots.value)
            stats.occupied_spaces--
            stats.available_spaces++
          }
        } else if (message.event === 'space_reserved') {
          const coord = spaceIdToCoord.value.get(message.space_id)
          if (coord) {
            const key = `${coord.row},${coord.col}`
            const space = coordToSpace.value.get(key)
            if (space) {
              const updated = { ...space, is_reserved: true }
              coordToSpace.value.set(key, updated)
              // 触发响应式更新
              coordToSpace.value = new Map(coordToSpace.value)
            }
          }
        } else if (message.event === 'space_unreserved') {
          const coord = spaceIdToCoord.value.get(message.space_id)
          if (coord) {
            const key = `${coord.row},${coord.col}`
            const space = coordToSpace.value.get(key)
            if (space) {
              const updated = { ...space, is_reserved: false }
              coordToSpace.value.set(key, updated)
              // 触发响应式更新
              coordToSpace.value = new Map(coordToSpace.value)
            }
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
      }
    }

    // Lifecycle
    onMounted(() => {
      loadParkingLotData()
      // 订阅全局 WebSocket 消息，并确保连接已建立
      offMessage = wsManager.on('message', handleWebSocketMessage)
      wsManager.connect()
    })

    onBeforeUnmount(() => {
      // 仅取消当前组件的消息处理，保持全局连接不被关闭
      if (typeof offMessage === 'function') {
        offMessage()
      }
    })

    return {
      // State
      parkingLot,
      grid,
      coordToSpace,
      occupiedSpots,
      path,
      editMode,
      selectedTool,
      selectedSpot,
      stats,
      highlightCoord,
      
      // Constants
      GRID_ROWS,
      GRID_COLS,
      
      // Computed
      
      // Methods
      handleCellClick,
      handleCellHover,
      toggleEditMode,
      findNearestEmptySpot,
      resetLayout,
      saveSelectedSpotAttributes,
      isInPath,
      getCellClasses,
      getTooltipContent,
      loadParkingLotData
    }
  }
}
</script>

<style scoped>
.parking-lot-visualization {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.controls-panel {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.edit-tools {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.edit-tools h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.edit-attributes {
  padding: 15px;
  background: #fffbe6;
  border-radius: 4px;
  border: 1px dashed #f0ad4e;
}

.edit-attributes h4 {
  margin: 0 0 10px 0;
  color: #c48c1b;
}

.info-panel {
  padding: 15px;
  background: #f0f9ff;
  border-radius: 4px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-value.occupied {
  color: #f56c6c;
}

.stat-value.available {
  color: #67c23a;
}

.visualization-container {
  margin-bottom: 20px;
}

.grid-container {
  background: #e4e7ed;
  padding: 10px;
  border-radius: 4px;
  margin: 0 auto;
}

.grid-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.grid-cell:hover {
  transform: scale(1.05);
  z-index: 1;
}

.cell-content {
  font-size: 12px;
  font-weight: bold;
}

.cell-text {
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
}

/* Cell type styles */
.grid-cell.entrance {
  background: linear-gradient(135deg, #67c23a, #529b2e);
}

.grid-cell.exit {
  background: linear-gradient(135deg, #f56c6c, #d32f2f);
}

.grid-cell.parking {
  background: linear-gradient(135deg, #409eff, #3a8ee6);
}

.grid-cell.parking.occupied {
  background: linear-gradient(135deg, #909399, #606266);
}

.grid-cell.parking.vip {
  background: linear-gradient(135deg, #b07eff, #8c4de8);
}

.grid-cell.parking.reserved {
  background: linear-gradient(135deg, #ffb74d, #fb8c00);
}

.grid-cell.parking.maintenance {
  background: linear-gradient(135deg, #bdbdbd, #9e9e9e);
}

.grid-cell.road {
  background: linear-gradient(135deg, #e6e8eb, #d3d6db);
}

.grid-cell.wall {
  background: linear-gradient(135deg, #303133, #1f1f1f);
}

.grid-cell.in-path {
  animation: pathPulse 1.5s ease-in-out infinite;
}

@keyframes pathPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
  }
}

.grid-cell.selected {
  border: 3px solid #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.path-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.legend-panel {
  margin-top: 20px;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  border: 1px solid #dcdfe6;
}

.legend-color.entrance {
  background: linear-gradient(135deg, #67c23a, #529b2e);
}

.legend-color.exit {
  background: linear-gradient(135deg, #f56c6c, #d32f2f);
}

.legend-color.parking {
  background: linear-gradient(135deg, #409eff, #3a8ee6);
}

.legend-color.parking.occupied {
  background: linear-gradient(135deg, #909399, #606266);
}

.legend-color.parking.vip {
  background: linear-gradient(135deg, #b07eff, #8c4de8);
}

.legend-color.parking.reserved {
  background: linear-gradient(135deg, #ffb74d, #fb8c00);
}

.legend-color.parking.maintenance {
  background: linear-gradient(135deg, #bdbdbd, #9e9e9e);
}

.legend-color.road {
  background: linear-gradient(135deg, #e6e8eb, #d3d6db);
}

.legend-color.wall {
  background: linear-gradient(135deg, #303133, #1f1f1f);
}

.legend-color.path {
  background: #ffd700;
}

.path-info {
  margin-top: 15px;
}

@media (max-width: 768px) {
  .parking-lot-visualization {
    padding: 10px;
  }
  
  .grid-container {
    padding: 5px;
  }
  
  .cell-content {
    font-size: 10px;
  }
  
  .legend-items {
    flex-direction: column;
    gap: 10px;
  }

  /* 移动端适配：避免 el-card__body 在窄边距下内容裁剪 */
  :deep(.el-card) {
    --el-card-padding: 10px;
  }
  /* 仅对布局可视化卡片添加内部滚动 */
  .visualization-container :deep(.el-card__body) {
    max-height: 65vh;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>