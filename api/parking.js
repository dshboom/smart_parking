import request from '@/utils/request'

// Parking Lot APIs
export function getParkingLots(params) {
  return request({
    url: '/api/parking/lots',
    method: 'get',
    params
  })
}

export function createParkingLot(data) {
  return request({
    url: '/api/parking/lots',
    method: 'post',
    data
  })
}

export function getParkingLot(id) {
  return request({
    url: `/api/parking/lots/${id}`,
    method: 'get'
  })
}

export function updateParkingLot(id, data) {
  return request({
    url: `/api/parking/lots/${id}`,
    method: 'put',
    data
  })
}

export function deleteParkingLot(id) {
  return request({
    url: `/api/parking/lots/${id}`,
    method: 'delete'
  })
}

// Parking Space APIs
export function getParkingSpaces(parkingLotId, params) {
  return request({
    url: `/api/parking/lots/${parkingLotId}/spaces`,
    method: 'get',
    params
  })
}

export function getParkingSpace(id) {
  return request({
    url: `/api/parking/spaces/${id}`,
    method: 'get'
  })
}

// 更新停车位信息（类型、维护、预约状态等）
export function updateParkingSpace(id, data) {
  return request({
    url: `/api/parking/spaces/${id}`,
    method: 'put',
    data
  })
}

// 占用停车位
export function occupyParkingSpace(spaceId, payloadOrVehicleId) {
  const config = {
    url: `/api/parking/spaces/${spaceId}/occupy`,
    method: 'post'
  }
  if (typeof payloadOrVehicleId === 'number') {
    config.params = { vehicle_id: payloadOrVehicleId }
  } else if (payloadOrVehicleId && typeof payloadOrVehicleId === 'object') {
    // 支持通过请求体传入 { license_plate } 或 { vehicle_id }
    config.data = payloadOrVehicleId
  }
  return request(config)
}

// 释放停车位
export function vacateParkingSpace(spaceId) {
  return request({
    url: `/api/parking/spaces/${spaceId}/vacate`,
    method: 'post'
  })
}

// Navigation APIs
export function calculateNavigationPath(parkingLotId, start, end) {
  return request({
    url: `/api/parking/lots/${parkingLotId}/navigate`,
    method: 'post',
    data: {
      start: { row: start.row, col: start.col },
      end: { row: end.row, col: end.col }
    }
  })
}

export function findNearestAvailableSpace(parkingLotId, currentPosition, spaceType) {
  return request({
    url: `/api/parking/lots/${parkingLotId}/nearest-space`,
    method: 'post',
    data: {
      current_position: { row: currentPosition.row, col: currentPosition.col },
      space_type: spaceType
    }
  })
}

// 预留停车位
export function reserveParkingSpace(spaceId) {
  return request({
    url: `/api/parking/spaces/${spaceId}/reserve`,
    method: 'post'
  })
}

// Statistics APIs
export function getParkingLotStats(parkingLotId) {
  return request({
    url: `/api/parking/lots/${parkingLotId}/stats`,
    method: 'get'
  })
}

export function getParkingLotLayout(parkingLotId) {
  return request({
    url: `/api/parking/lots/${parkingLotId}/layout`,
    method: 'get'
  })
}

export function updateParkingLotLayout(parkingLotId, layoutData) {
  return request({
    url: `/api/parking/lots/${parkingLotId}/layout`,
    method: 'put',
    data: layoutData
  })
}

export function getRealtimeStatus(parkingLotId) {
  return request({
    url: `/api/parking/lots/${parkingLotId}/realtime-status`,
    method: 'get'
  })
}

// Admin Dashboard APIs
export function getAdminParkingStats() {
  return request({
    url: '/api/parking/admin/stats/overview',
    method: 'get'
  })
}

export function getAdminParkingTrends(days = 7) {
  return request({
    url: '/api/parking/admin/stats/trends',
    method: 'get',
    params: { days }
  })
}

export function getAdminParkingRecords(params) {
  return request({
    url: '/api/parking/admin/records',
    method: 'get',
    params
  })
}

export function getAdminParkingSpaces(params) {
  return request({
    url: '/api/parking/admin/spaces',
    method: 'get',
    params
  })
}

// ===== 我的停车记录专用接口 =====

// 获取我的停车记录列表
export function getMyParkingRecords(params) {
  return request({
    url: '/api/parking/my/records',
    method: 'get',
    params
  })
}

// 获取我的停车记录详情
export function getMyParkingRecord(recordId) {
  return request({
    url: `/api/parking/my/records/${recordId}`,
    method: 'get'
  })
}

// 获取当前停车状态
export function getMyCurrentParking() {
  return request({
    url: '/api/parking/my/current',
    method: 'get'
  })
}

// 开始停车（用户手动记录进入）
export function startMyParking(data) {
  return request({
    url: '/api/parking/my/start',
    method: 'post',
    data
  })
}

// 结束停车（用户手动记录离开）
export function endMyParking(recordId) {
  return request({
    url: '/api/parking/my/end',
    method: 'post',
    params: { record_id: recordId }
  })
}

// 获取停车费用计算
export function calculateMyParkingFee(recordId) {
  return request({
    url: `/api/parking/my/fee/${recordId}`,
    method: 'get'
  })
}

// 获取停车统计信息
export function getMyParkingStats() {
  return request({
    url: '/api/parking/my/stats',
    method: 'get'
  })
}

// 获取停车趋势数据
export function getMyParkingTrends(days = 30) {
  return request({
    url: '/api/parking/my/trends',
    method: 'get',
    params: { days }
  })
}