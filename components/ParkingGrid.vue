<template>
  <div class="grid-container" :style="gridStyle" ref="containerRef">
    <div
      v-for="(cell, index) in flattenedGrid"
      :key="index"
      :class="getCellClasses(cell, index)"
      :title="getTooltipContent(cell)"
      @click="handleCellClick(cell.row, cell.col)"
      @mouseenter="handleCellHover(cell.row, cell.col)"
    >
      <div class="cell-content">
        <span v-if="cell.type === 'entrance'" class="cell-text">入口</span>
        <span v-else-if="cell.type === 'exit'" class="cell-text">出口</span>
        <span v-else-if="cell.type === 'parking' && cell.isUnderMaintenance" class="cell-text">🛠️</span>
        <span v-else-if="cell.type === 'parking' && cell.isReserved" class="cell-text">🔒</span>
        
        <span v-else-if="cell.type === 'parking' && cell.isOccupied" class="cell-text">🚗</span>
        <span v-else-if="cell.type === 'parking'" class="cell-text">P</span>
      </div>
      <div v-if="isInPath(cell.row, cell.col)" class="path-indicator"></div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'

export default {
  name: 'ParkingGrid',
  props: {
    grid: {
      type: Array,
      required: true
    },
    occupiedSpots: {
      type: Set,
      required: true
    },
    coordToSpace: {
      type: Map,
      required: true
    },
    path: {
      type: Array,
      default: () => []
    },
    GRID_ROWS: {
      type: Number,
      required: true
    },
    GRID_COLS: {
      type: Number,
      required: true
    },
    highlightCoord: {
      type: Object,
      default: null
    }
  },
  emits: ['cell-click', 'cell-hover'],
  setup(props, { emit }) {
    const containerRef = ref(null)
    const containerHeight = ref(0)
    const containerWidth = ref(0)
    const flattenedGrid = computed(() => {
      const result = []
      for (let row = 0; row < props.grid.length; row++) {
        for (let col = 0; col < props.grid[row].length; col++) {
          const key = `${row},${col}`
          const space = props.coordToSpace.get(key)
          result.push({
            row,
            col,
            type: props.grid[row][col],
            isOccupied: props.occupiedSpots.has(key),
            spaceType: space?.space_type || 'standard',
            isReserved: space?.is_reserved || false,
            isUnderMaintenance: space?.is_under_maintenance || false
          })
        }
      }
      return result
    })

    const gridStyle = computed(() => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${props.GRID_COLS}, 1fr)`,
      gridTemplateRows: `repeat(${props.GRID_ROWS}, 1fr)`,
      gap: '2px',
      width: '100%',
      maxWidth: '800px',
      height: containerHeight.value > 0 ? `${containerHeight.value}px` : 'auto'
    }))

    const cellWidth = computed(() => (containerWidth.value > 0 ? containerWidth.value / props.GRID_COLS : 0))
    const cellHeight = computed(() => (containerHeight.value > 0 ? containerHeight.value / props.GRID_ROWS : 0))
    // 路径点计算移除：使用每格指示器样式替代

    // path traveler animation removed; using per-cell dot indicators

    let ro = null
    const measure = () => {
      const el = containerRef.value
      if (!el) return
      const w = el.clientWidth
      if (w > 0) {
        containerWidth.value = w
        containerHeight.value = Math.round(w * (props.GRID_ROWS / props.GRID_COLS))
      }
    }

    onMounted(() => {
      measure()
      try {
        ro = new ResizeObserver(() => measure())
        if (containerRef.value) ro.observe(containerRef.value)
      } catch (_) {
        // Fallback
        setTimeout(measure, 300)
        setTimeout(measure, 800)
      }
    })

    onBeforeUnmount(() => {
      try { ro && ro.disconnect() } catch (_) {}
    })

    watch(() => props.grid, () => measure(), { deep: true })

    const getTooltipContent = (cell) => {
      const key = `${cell.row},${cell.col}`
      const space = props.coordToSpace.get(key)
      if (space) {
        return `车位: ${space.space_number} (${cell.row}, ${cell.col})`
      }
      return `(${cell.row}, ${cell.col})`
    }

    const getCellClasses = (cell) => {
      const classes = ['grid-cell', cell.type]
      if (cell.isOccupied) classes.push('occupied')
      
      if (cell.isReserved) classes.push('reserved')
      if (cell.isUnderMaintenance) classes.push('maintenance')
      if (props.highlightCoord && props.highlightCoord.row === cell.row && props.highlightCoord.col === cell.col) {
        classes.push('selected')
      }
      return classes
    }

    const isInPath = (row, col) => {
      return props.path.some(p => p.row === row && p.col === col)
    }

    const handleCellClick = (row, col) => {
      emit('cell-click', { row, col })
    }

    const handleCellHover = (row, col) => {
      emit('cell-hover', { row, col })
    }

    return {
      containerRef,
      containerWidth,
      flattenedGrid,
      gridStyle,
      getTooltipContent,
      getCellClasses,
      isInPath,
      handleCellClick,
      handleCellHover,
      containerHeight
    }
  }
}
</script>

<style scoped>
.grid-container {
  position: relative;
  background: linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
  border: 1px solid #e5eaf3;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.grid-cell {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid #e9eef5;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s, transform 0.1s;
}

.grid-cell:hover {
  box-shadow: inset 0 0 0 2px rgba(64, 158, 255, 0.35);
}

.cell-content {
  z-index: 1;
}

.cell-text {
  font-size: 12px;
  font-weight: bold;
}

.road {
  background-color: #e8edf3;
}

.wall {
  background-color: #3a3f44;
}

.entrance {
  background-color: #67c23a;
  color: #fff;
}

.exit {
  background-color: #f56c6c;
  color: #fff;
}

.parking {
  background: linear-gradient(135deg, #a0cfff 0%, #bfe6ff 100%);
}

.parking.occupied {
  background: linear-gradient(135deg, #fab6b6 0%, #ffc3c3 100%);
}


.parking.reserved {
  background: linear-gradient(135deg, #e6a23c 0%, #f3c46b 100%);
}

.parking.maintenance {
  background: linear-gradient(135deg, #909399 0%, #b0b3b8 100%);
}

.path-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.path-polyline {
  fill: none;
  stroke: url(#path-grad);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 10 10;
  animation: pathDash 2s linear infinite;
}

@keyframes pathDash {
  to { stroke-dashoffset: -20; }
}

.grid-cell.selected {
  border: 2px solid #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}

.path-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background-color: #ff4d4f;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px rgba(255, 77, 79, 0.6);
  pointer-events: none;
}
</style>
