<template>
  <div class="grid-container" :style="gridStyle">
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
        <span v-else-if="cell.type === 'parking' && cell.spaceType === 'vip'" class="cell-text">⭐</span>
        <span v-else-if="cell.type === 'parking' && cell.isOccupied" class="cell-text">🚗</span>
        <span v-else-if="cell.type === 'parking'" class="cell-text">P</span>
      </div>
      <div v-if="isInPath(cell.row, cell.col)" class="path-indicator"></div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

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
      aspectRatio: `${props.GRID_COLS} / ${props.GRID_ROWS}`
    }))

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
      if (cell.spaceType === 'vip') classes.push('vip')
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
      flattenedGrid,
      gridStyle,
      getTooltipContent,
      getCellClasses,
      isInPath,
      handleCellClick,
      handleCellHover
    }
  }
}
</script>

<style scoped>
.grid-container {
  background-color: #f0f2f5;
  border: 1px solid #dcdfe6;
  padding: 5px;
}

.grid-cell {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid #e9e9e9;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.grid-cell:hover {
  background-color: #cce5ff;
}

.cell-content {
  z-index: 1;
}

.cell-text {
  font-size: 12px;
  font-weight: bold;
}

.road {
  background-color: #dcdcdc;
}

.wall {
  background-color: #595959;
}

.entrance {
  background-color: #67c23a;
  color: white;
}

.exit {
  background-color: #f56c6c;
  color: white;
}

.parking {
  background-color: #a0cfff;
}

.parking.occupied {
  background-color: #fab6b6;
}

.parking.vip {
  background-color: #ffc700;
}

.parking.reserved {
  background-color: #e6a23c;
}

.parking.maintenance {
  background-color: #909399;
}

.path-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background-color: rgba(255, 0, 0, 0.7);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.grid-cell.selected {
  border: 3px solid #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}
</style>