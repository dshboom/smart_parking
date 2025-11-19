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
      @save-layout="saveLayout"
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
            :start-coord="startCoordComputed"
            :end-coord="endCoordComputed"
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
    const layoutDirty = ref(false)
    let saveTimer = null
    let saving = false
    let needResave = false
    const isRoad = (r, c) => grid.value[r]?.[c] === 'road'
    const adjacentRoadOf = (coord) => {
      const dirs = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 }
      ]
      for (const d of dirs) {
        const nr = coord.row + d.row
        const nc = coord.col + d.col
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS && isRoad(nr, nc)) {
          return { row: nr, col: nc }
        }
      }
      return null
    }
    const sanitizeRoadPath = (nodes) => Array.isArray(nodes) ? nodes.filter(n => isRoad(n.row, n.col)) : []
    const startCoord = ref(null)
    const endCoord = ref(null)

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
        
        if (Array.isArray(layoutResponse?.grid)) {
          grid.value = layoutResponse.grid
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
        const spaces = Array.isArray(spacesResponse) ? spacesResponse : (Array.isArray(spacesResponse?.items) ? spacesResponse.items : [])
        const adapted = spaces.map(space => ({
          ...space,
          space_number: (space && space.space_number != null)
            ? space.space_number
            : (space && space.id != null)
              ? `#${space.id}`
              : `(${space.row},${space.col})`,
          is_reserved: space.status === 'reserved',
          is_under_maintenance: space.status === 'maintenance'
        }))
        spaceIdToCoord.value = new Map(
          adapted.map(space => [space.id, { row: space.row, col: space.col }])
        )
        coordToSpace.value = new Map(
          adapted.map(space => [`${space.row},${space.col}`, space])
        )
        occupiedSpots.value = new Set(
          adapted
            .filter(space => String(space.status).toLowerCase() === 'occupied')
            .map(space => `${space.row},${space.col}`)
        )

        // initial highlight handled by computed highlightCoord

        // Update stats
        stats.total_spaces = statsResponse.total_spaces
        stats.occupied_spaces = statsResponse.occupied_spaces
        stats.available_spaces = statsResponse.available_spaces

      } catch (error) {
        ElMessage.error('加载停车场数据失败')
        console.error('Error loading parking lot data:', error)
      }
    }

    // Sync external path from props (used by user navigation pages)
    watch(() => props.showPath, (val) => {
      path.value = Array.isArray(val) ? val : []
    }, { immediate: true })

    const findNearestEmptySpot = async () => {
      if (!props.parkingLotId) return
      
      try {
        // Determine start position: use currentPosition prop, entrance from layout, or fallback to (0,0)
        const start = props.currentPosition
          ? { row: props.currentPosition.row, col: props.currentPosition.col }
          : (entrancePosition.value || { row: 0, col: 0 })

        // 统一按普通车位查找（移除VIP逻辑）
        const spaceType = 'standard'

        const result = await parkingApi.findNearestAvailableSpace(
          props.parkingLotId,
          start,
          spaceType
        )
        const target = result && result.space_id ? { row: result.row, col: result.col } : null
        if (target) {
          // 后端导航
          let nav = null
          try {
            nav = await parkingApi.calculateNavigationPath(props.parkingLotId, start, target)
          } catch (_) {}
          let navPath = sanitizeRoadPath(Array.isArray(nav?.path) ? nav.path : [])
          const goalRoad = adjacentRoadOf(target)
          if (!goalRoad || navPath.length === 0) {
            const local = astar(start, goalRoad || target)
            navPath = sanitizeRoadPath(local)
          }
          path.value = navPath
          startCoord.value = start
          endCoord.value = target
          // 选中目标车位
          const space = coordToSpace.value.get(`${target.row},${target.col}`)
          selectedSpot.value = space || null
          ElMessage.success(`找到最近停车位: #${result.space_id}`)
        } else {
          path.value = []
          startCoord.value = null
          endCoord.value = null
          selectedSpot.value = null
          ElMessage.warning('未找到可用车位')
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
      const goalRoad = adjacentRoadOf(exit)
      const pathResult = astar(fromSpot, goalRoad || exit)
      const sanitized = sanitizeRoadPath(pathResult)
      if (sanitized && sanitized.length > 0) {
        path.value = sanitized
        startCoord.value = fromSpot
        endCoord.value = exit
        ElMessage.success(`找到出口路径！距离: ${sanitized.length} 步`)
      } else {
        ElMessage.warning('未找到到出口的路径')
        startCoord.value = null
        endCoord.value = null
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
          if (selectedTool.value === 'entrance') {
            entrancePosition.value = { row, col }
          } else {
            exitPosition.value = { row, col }
          }
        }
        grid.value[row][col] = selectedTool.value
        // 若选择的是停车位，选中该位置用于右侧属性编辑
        if (selectedTool.value === 'parking') {
          const space = coordToSpace.value.get(key)
          selectedSpot.value = space || null
        }
        
        layoutDirty.value = true
        scheduleSave()
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
            findExitPath({ row, col })
          } else {
            const space = coordToSpace.value.get(key)
            if (space) {
              selectedSpot.value = space
              emit('space-selected', space)
            } else {
              ElMessage.warning('该位置无车位或布局未同步')
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

    const handleCellHover = ({ row: _row, col: _col }) => {
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
          rows: GRID_ROWS,
          cols: GRID_COLS,
          grid: grid.value,
          entrance_position: { row: 0, col: 0 },
          exit_position: { row: GRID_ROWS - 1, col: GRID_COLS - 1 }
        })
        ElMessage.success('布局重置成功')
      } catch (error) {
        ElMessage.error('布局重置失败')
      }
    }

    const saveLayout = async (silent = false) => {
      try {
        await parkingApi.updateParkingLotLayout(
          props.parkingLotId,
          {
            rows: grid.value.length,
            cols: grid.value[0]?.length || GRID_COLS,
            grid: grid.value,
            entrance_position: entrancePosition.value || { row: 0, col: 0 },
            exit_position: exitPosition.value || detectExitFromGrid() || { row: GRID_ROWS - 1, col: GRID_COLS - 1 }
          },
          { timeout: 30000, suppressErrorToast: silent }
        )
        layoutDirty.value = false
        if (!silent) {
          ElMessage.success('布局已保存')
        }
      } catch (error) {
        if (!silent) {
          ElMessage.error('布局保存失败')
        }
      }
    }

    const scheduleSave = () => {
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      saveTimer = setTimeout(async () => {
        saveTimer = null
        if (saving) {
          needResave = true
          return
        }
        saving = true
        try {
          await saveLayout(true)
        } finally {
          saving = false
          if (needResave) {
            needResave = false
            scheduleSave()
          }
        }
      }, 250)
    }


    const displayPath = computed(() => {
      const src = (props.showPath && props.showPath.length > 0)
        ? props.showPath.map(node => (
            'row' in node && 'col' in node
              ? { row: node.row, col: node.col }
              : { row: node.y ?? node.row, col: node.x ?? node.col }
          ))
        : path.value
      const roads = sanitizeRoadPath(src)
      const merged = []
      const pushUnique = (n) => {
        if (!n) return
        const exists = merged.some(x => x.row === n.row && x.col === n.col)
        if (!exists) merged.push(n)
      }
      pushUnique(startCoord.value)
      for (const n of roads) pushUnique(n)
      pushUnique(endCoord.value)
      return merged
    })
    const startCoordComputed = computed(() => (displayPath.value.length ? displayPath.value[0] : (startCoord.value || null)))
    const endCoordComputed = computed(() => (displayPath.value.length ? displayPath.value[displayPath.value.length - 1] : (endCoord.value || null)))

    const isInPath = (row, col) => {
      return displayPath.value.some(node => node.row === row && node.col === col)
    }

    const getCellClasses = (cell, _index) => {
      const classes = ['grid-cell', cell.type]
      
      if (isInPath(cell.row, cell.col)) {
        classes.push('in-path')
      }
      
      if (cell.type === 'parking' && cell.isOccupied) {
        classes.push('occupied')
      }
      // 已移除VIP特殊样式
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
        const typeLabel = '普通车位'
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
        const eventType = message.event || message.type
        const payload = message.payload || message
        if (eventType === 'space_occupied') {
          const coord = spaceIdToCoord.value.get(payload.space_id)
          if (coord) {
            occupiedSpots.value.add(`${coord.row},${coord.col}`)
            occupiedSpots.value = new Set(occupiedSpots.value)
            stats.occupied_spaces++
            stats.available_spaces--
          }
        } else if (eventType === 'space_vacated') {
          const coord = spaceIdToCoord.value.get(payload.space_id)
          if (coord) {
            occupiedSpots.value.delete(`${coord.row},${coord.col}`)
            occupiedSpots.value = new Set(occupiedSpots.value)
            stats.occupied_spaces--
            stats.available_spaces++
          }
        } else if (eventType === 'space_reserved') {
          const coord = spaceIdToCoord.value.get(payload.space_id)
          if (coord) {
            const key = `${coord.row},${coord.col}`
            const space = coordToSpace.value.get(key)
            if (space) {
              const updated = { ...space, is_reserved: true }
              coordToSpace.value.set(key, updated)
              coordToSpace.value = new Map(coordToSpace.value)
            }
          }
        } else if (eventType === 'space_unreserved') {
          const coord = spaceIdToCoord.value.get(payload.space_id)
          if (coord) {
            const key = `${coord.row},${coord.col}`
            const space = coordToSpace.value.get(key)
            if (space) {
              const updated = { ...space, is_reserved: false }
              coordToSpace.value.set(key, updated)
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
      offMessage = wsManager.on('message', handleWebSocketMessage)
      wsManager.connect()
      wsManager.on('connected', () => {
        try {
          wsManager.send({ type: 'subscribe_lot', payload: { lot_id: props.parkingLotId } })
        } catch (_) {}
      })
    })

    onBeforeUnmount(() => {
      if (typeof offMessage === 'function') {
        offMessage()
      }
      try {
        wsManager.send({ type: 'unsubscribe_lot', payload: { lot_id: props.parkingLotId } })
      } catch (_) {}
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
      layoutDirty,
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
      saveLayout,
      isInPath,
      getCellClasses,
      getTooltipContent,
      loadParkingLotData,
      startCoordComputed,
      endCoordComputed
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

:deep(.el-card) {
  width: 100%;
}

:deep(.el-card__body) {
  overflow: visible;
}

.grid-container {
  background: #e4e7ed;
  padding: 10px;
  border-radius: 4px;
  margin: 0 auto;
}

.grid-wrapper {
  min-height: 200px;
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