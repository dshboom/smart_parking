import React, { useState, useEffect } from 'react';
import { Car, Navigation, ParkingSquare, ArrowRight, Edit } from 'lucide-react';

const ParkingLotDigitalTwin = () => {
  const GRID_ROWS = 10;
  const GRID_COLS = 14;
  
  const initGrid = () => {
    const grid = Array(GRID_ROWS).fill(null).map(() => 
      Array(GRID_COLS).fill('road')
    );
    
    grid[0][0] = 'entrance';
    grid[GRID_ROWS - 1][GRID_COLS - 1] = 'exit';
    
    for (let i = 2; i < 8; i++) {
      grid[i][0] = 'wall';
      grid[i][1] = 'parking';
      grid[i][2] = 'parking';
      grid[i][3] = 'wall';
    }
    
    for (let i = 2; i < 8; i++) {
      grid[i][GRID_COLS - 4] = 'wall';
      grid[i][GRID_COLS - 3] = 'parking';
      grid[i][GRID_COLS - 2] = 'parking';
      grid[i][GRID_COLS - 1] = 'wall';
    }
    
    return grid;
  };

  const [grid, setGrid] = useState(initGrid());
  const [occupiedSpots, setOccupiedSpots] = useState(new Set());
  const [path, setPath] = useState([]);
  const [mode, setMode] = useState('entrance');
  const [editMode, setEditMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState('parking');
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    const occupied = new Set();
    for (let i = 0; i < GRID_ROWS; i++) {
      for (let j = 0; j < GRID_COLS; j++) {
        if (grid[i][j] === 'parking' && Math.random() > 0.6) {
          occupied.add(`${i},${j}`);
        }
      }
    }
    setOccupiedSpots(occupied);
  }, []);

  // A*算法的启发式函数（曼哈顿距离）
  const heuristic = (a, b) => {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  };

  // 获取相邻节点
  const getNeighbors = (node, targetIsOccupied = false) => {
    const neighbors = [];
    const directions = [
      { row: -1, col: 0 }, 
      { row: 1, col: 0 },
      { row: 0, col: -1 }, 
      { row: 0, col: 1 }
    ];

    for (const dir of directions) {
      const newRow = node.row + dir.row;
      const newCol = node.col + dir.col;

      if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < GRID_COLS) {
        const cellType = grid[newRow][newCol];
        const isOccupied = occupiedSpots.has(`${newRow},${newCol}`);
        
        // 墙壁不能通过
        if (cellType === 'wall') {
          continue;
        }
        
        // 如果是被占用的停车位，只有当它是目标点时才能通过
        if (isOccupied && !targetIsOccupied) {
          continue;
        }
        
        neighbors.push({ row: newRow, col: newCol });
      }
    }
    return neighbors;
  };

  // A*寻路算法
  const astar = (start, goal) => {
    console.log('开始寻路:', start, '到', goal);
    
    // 检查起点和终点是否有效
    if (start.row < 0 || start.row >= GRID_ROWS || start.col < 0 || start.col >= GRID_COLS) {
      console.error('起点无效');
      return [];
    }
    if (goal.row < 0 || goal.row >= GRID_ROWS || goal.col < 0 || goal.col >= GRID_COLS) {
      console.error('终点无效');
      return [];
    }
    
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const key = (node) => `${node.row},${node.col}`;
    const goalKey = key(goal);
    
    // 检查目标是否是被占用的停车位
    const targetIsOccupied = occupiedSpots.has(goalKey);

    gScore.set(key(start), 0);
    fScore.set(key(start), heuristic(start, goal));

    while (openSet.length > 0) {
      // 找到fScore最小的节点
      openSet.sort((a, b) => {
        const fa = fScore.get(key(a)) || Infinity;
        const fb = fScore.get(key(b)) || Infinity;
        return fa - fb;
      });
      
      const current = openSet.shift();
      const currentKey = key(current);

      // 到达目标
      if (current.row === goal.row && current.col === goal.col) {
        const pathArr = [];
        let temp = current;
        while (cameFrom.has(key(temp))) {
          pathArr.unshift(temp);
          temp = cameFrom.get(key(temp));
        }
        pathArr.unshift(start);
        console.log('找到路径，长度:', pathArr.length);
        return pathArr;
      }

      closedSet.add(currentKey);

      const neighbors = getNeighbors(current, targetIsOccupied);
      
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor);
        
        if (closedSet.has(neighborKey)) {
          continue;
        }

        const tentativeGScore = (gScore.get(currentKey) || Infinity) + 1;

        if (!openSet.some(n => key(n) === neighborKey)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
          continue;
        }

        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, goal));
      }
    }

    console.log('未找到路径');
    return [];
  };

  // 寻找最近的空停车位
  const findNearestEmptySpot = () => {
    console.log('开始寻找最近的空停车位');
    const emptySpots = [];
    
    for (let i = 0; i < GRID_ROWS; i++) {
      for (let j = 0; j < GRID_COLS; j++) {
        if (grid[i][j] === 'parking' && !occupiedSpots.has(`${i},${j}`)) {
          emptySpots.push({ row: i, col: j });
        }
      }
    }

    console.log('找到空停车位数量:', emptySpots.length);

    if (emptySpots.length === 0) {
      alert('没有空闲停车位！');
      return;
    }

    const entrancePos = { row: 0, col: 0 };
    let nearestSpot = null;
    let shortestPath = null;

    for (const spot of emptySpots) {
      const testPath = astar(entrancePos, spot);
      if (testPath.length > 0 && (!shortestPath || testPath.length < shortestPath.length)) {
        shortestPath = testPath;
        nearestSpot = spot;
      }
    }

    if (shortestPath && shortestPath.length > 0) {
      console.log('设置路径，长度:', shortestPath.length);
      setPath(shortestPath);
      setSelectedSpot(nearestSpot);
    } else {
      alert('无法找到路径！可能入口被阻挡了。');
    }
  };

  // 从停车位到出口的路径
  const findExitPath = (row, col) => {
    console.log('寻找从停车位到出口的路径:', row, col);
    const exitPos = { row: GRID_ROWS - 1, col: GRID_COLS - 1 };
    const exitPath = astar({ row, col }, exitPos);
    
    if (exitPath.length > 0) {
      console.log('找到出口路径，长度:', exitPath.length);
      setPath(exitPath);
      setSelectedSpot({ row, col });
    } else {
      alert('无法找到出口路径！可能出口被阻挡了。');
    }
  };

  const handleCellClick = (row, col) => {
    if (editMode) {
      if (selectedTool === 'entrance') {
        const newGrid = grid.map(r => r.map(c => c === 'entrance' ? 'road' : c));
        newGrid[row][col] = 'entrance';
        setGrid(newGrid);
      } else if (selectedTool === 'exit') {
        const newGrid = grid.map(r => r.map(c => c === 'exit' ? 'road' : c));
        newGrid[row][col] = 'exit';
        setGrid(newGrid);
      } else {
        const newGrid = [...grid];
        newGrid[row] = [...newGrid[row]];
        newGrid[row][col] = selectedTool;
        setGrid(newGrid);
        
        if (selectedTool !== 'parking') {
          const newOccupied = new Set(occupiedSpots);
          newOccupied.delete(`${row},${col}`);
          setOccupiedSpots(newOccupied);
        }
      }
    } else {
      const cellType = grid[row][col];
      
      if (cellType === 'parking') {
        const spotKey = `${row},${col}`;
        
        if (mode === 'exit' && occupiedSpots.has(spotKey)) {
          // 从停车位找到出口
          findExitPath(row, col);
        } else {
          // 切换停车位占用状态
          const newOccupied = new Set(occupiedSpots);
          if (newOccupied.has(spotKey)) {
            newOccupied.delete(spotKey);
          } else {
            newOccupied.add(spotKey);
          }
          setOccupiedSpots(newOccupied);
          setPath([]);
          setSelectedSpot(null);
        }
      }
    }
  };

  const isInPath = (row, col) => {
    return path.some(p => p.row === row && p.col === col);
  };

  const getCellContent = (row, col) => {
    const cellType = grid[row][col];
    const inPath = isInPath(row, col);
    const isOccupied = occupiedSpots.has(`${row},${col}`);
    const isSelected = selectedSpot && selectedSpot.row === row && selectedSpot.col === col;

    let bgColor = 'bg-gray-200';
    let borderColor = '';
    let content = null;

    if (cellType === 'entrance') {
      bgColor = inPath ? 'bg-yellow-400' : 'bg-green-500';
      content = <span className="text-white font-bold text-xs">入口</span>;
    } else if (cellType === 'exit') {
      bgColor = inPath ? 'bg-yellow-400' : 'bg-red-500';
      content = <span className="text-white font-bold text-xs">出口</span>;
    } else if (cellType === 'wall') {
      bgColor = 'bg-gray-800';
    } else if (cellType === 'parking') {
      if (isOccupied) {
        bgColor = inPath ? 'bg-yellow-400' : 'bg-blue-600';
        content = <Car className="w-5 h-5 text-white" />;
      } else {
        if (inPath) {
          bgColor = 'bg-yellow-400';
          content = <ParkingSquare className="w-5 h-5 text-yellow-700" />;
        } else {
          bgColor = 'bg-blue-100';
          borderColor = 'border-2 border-blue-400';
          content = <ParkingSquare className="w-5 h-5 text-blue-500" />;
        }
      }
    } else if (cellType === 'road') {
      bgColor = inPath ? 'bg-yellow-400' : 'bg-gray-300';
    }

    const ringClass = isSelected ? 'ring-4 ring-purple-500' : '';
    const opacityClass = editMode ? 'opacity-80' : '';
    const classes = `w-full h-full ${bgColor} ${borderColor} ${ringClass} ${opacityClass} flex items-center justify-center cursor-pointer transition-all hover:scale-105`;

    return (
      <div onClick={() => handleCellClick(row, col)} className={classes}>
        {content}
      </div>
    );
  };

  const resetLayout = () => {
    setGrid(initGrid());
    setOccupiedSpots(new Set());
    setPath([]);
    setSelectedSpot(null);
  };

  const tools = [
    { type: 'parking', label: '停车位', color: 'bg-blue-100 border-blue-400' },
    { type: 'wall', label: '墙壁', color: 'bg-gray-800 text-white' },
    { type: 'road', label: '道路', color: 'bg-gray-300' },
    { type: 'entrance', label: '入口', color: 'bg-green-500 text-white' },
    { type: 'exit', label: '出口', color: 'bg-red-500 text-white' }
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Navigation className="w-8 h-8 md:w-10 md:h-10" />
          地下停车场数字孪生系统
        </h1>
        <p className="text-gray-300 mb-6">A*寻路算法演示 + 自定义布局编辑器</p>

        <div className="bg-white rounded-lg shadow-2xl p-4 md:p-6 mb-6">
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => {
                setEditMode(!editMode);
                setPath([]);
                setSelectedSpot(null);
              }}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${editMode ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <Edit className="w-5 h-5" />
              {editMode ? '编辑模式' : '进入编辑'}
            </button>

            {!editMode && (
              <>
                <button
                  onClick={() => {
                    setMode('entrance');
                    setPath([]);
                    setSelectedSpot(null);
                    findNearestEmptySpot();
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
                >
                  <Navigation className="w-5 h-5" />
                  入口→最近空位
                </button>
                
                <button
                  onClick={() => {
                    setMode('exit');
                    setPath([]);
                    setSelectedSpot(null);
                    alert('请点击一个已占用的停车位（蓝色有车图标）');
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                  停车位→出口
                </button>
              </>
            )}

            <button
              onClick={resetLayout}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              重置布局
            </button>
          </div>

          {editMode && (
            <div className="mb-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">选择绘制工具：</p>
              <div className="flex gap-2 flex-wrap">
                {tools.map(tool => (
                  <button
                    key={tool.type}
                    onClick={() => setSelectedTool(tool.type)}
                    className={`px-3 py-2 rounded border-2 transition-all ${tool.color} ${selectedTool === tool.type ? 'ring-4 ring-orange-400 scale-105' : ''}`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-1 bg-gray-400 p-2 rounded-lg" style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`
          }}>
            {Array.from({ length: GRID_ROWS }).map((_, row) =>
              Array.from({ length: GRID_COLS }).map((_, col) => (
                <div key={`${row}-${col}`} className="aspect-square">
                  {getCellContent(row, col)}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded"></div>
              <span>入口</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded"></div>
              <span>出口</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 border-2 border-blue-400 rounded flex items-center justify-center">
                <ParkingSquare className="w-5 h-5 text-blue-500" />
              </div>
              <span>空闲车位</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span>占用车位</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded"></div>
              <span>路径</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-800 rounded"></div>
              <span>墙壁</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <span>道路</span>
            </div>
          </div>

          {path.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-400 rounded-lg">
              <p className="font-semibold text-green-900 text-lg">
                ✓ 路径已找到！长度: {path.length - 1} 步
              </p>
              <p className="text-sm text-green-700 mt-1">
                黄色高亮显示了从起点到终点的最优路径
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-700 rounded-lg p-4 text-white text-sm">
          <h3 className="font-bold mb-2">使用说明：</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>入口→最近空位：</strong>自动计算从入口（左上角绿色）到最近空闲停车位的最短路径</li>
            <li><strong>停车位→出口：</strong>点击按钮后，再点击任意已占用的停车位（蓝色有车），显示到出口的路径</li>
            <li><strong>编辑模式：</strong>可以自定义停车场布局，绘制停车位、墙壁、道路等</li>
            <li>在运行模式下点击停车位可切换其占用/空闲状态</li>
            <li>黄色高亮表示A*算法计算出的最优路径</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParkingLotDigitalTwin;