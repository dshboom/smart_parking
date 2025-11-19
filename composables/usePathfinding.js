// import removed: no Vue refs needed in this composable

export function usePathfinding(grid, occupiedSpots, GRID_ROWS, GRID_COLS) {
  const heuristic = (a, b) => {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
  }

  const getNeighbors = (node, goal) => {
    const neighbors = []
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ]

    for (const dir of directions) {
      const newRow = node.row + dir.row
      const newCol = node.col + dir.col

      if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < GRID_COLS) {
        const cellType = grid.value[newRow][newCol]
        const isGoal = goal && newRow === goal.row && newCol === goal.col
        // 仅允许在道路/入口/出口上行走；允许最终一步进入目标车位
        const walkable = (cellType === 'road' || cellType === 'entrance' || cellType === 'exit') || (isGoal && cellType === 'parking')
        if (walkable) {
          neighbors.push({ row: newRow, col: newCol })
        }
      }
    }
    return neighbors
  }

  const astar = (start, goal) => {
    const openSet = [start]
    const closedSet = new Set()
    const cameFrom = new Map()
    const gScore = new Map()
    const fScore = new Map()

    const getKey = (node) => `${node.row},${node.col}`

    gScore.set(getKey(start), 0)
    fScore.set(getKey(start), heuristic(start, goal))

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet[0]
      let currentIndex = 0
      for (let i = 1; i < openSet.length; i++) {
        if (fScore.get(getKey(openSet[i])) < fScore.get(getKey(current))) {
          current = openSet[i]
          currentIndex = i
        }
      }

      if (current.row === goal.row && current.col === goal.col) {
        // Reconstruct path
        const path = []
        let temp = current
        while (temp) {
          path.unshift(temp)
          temp = cameFrom.get(getKey(temp))
        }
        return path
      }

      openSet.splice(currentIndex, 1)
      closedSet.add(getKey(current))

      const neighbors = getNeighbors(current, goal)
      for (const neighbor of neighbors) {
        const neighborKey = getKey(neighbor)
        if (closedSet.has(neighborKey)) continue

        const tentativeGScore = gScore.get(getKey(current)) + 1

        if (!openSet.some(node => getKey(node) === neighborKey)) {
          openSet.push(neighbor)
        } else if (tentativeGScore >= gScore.get(neighborKey)) {
          continue
        }

        cameFrom.set(neighborKey, current)
        gScore.set(neighborKey, tentativeGScore)
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, goal))
      }
    }

    return null // No path found
  }

  return {
    astar
  }
}