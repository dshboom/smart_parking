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
export function occupyParkingSpace(spaceId, vehicleId) {
  return request({
    url: `/api/parking/spaces/${spaceId}/occupy`,
    method: 'post',
    params: { vehicle_id: vehicleId }
  })
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