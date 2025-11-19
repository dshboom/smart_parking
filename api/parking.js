import request from '@/utils/request'

// Parking Lot APIs
export function getParkingLots(params) {
  const q = {}
  if (params && typeof params === 'object') {
    if (Number.isFinite(params.skip)) q.skip = Number(params.skip)
    if (Number.isFinite(params.limit)) q.limit = Number(params.limit)
    for (const k of Object.keys(params)) {
      if (!(k in q)) q[k] = params[k]
    }
  }
  return request({
    url: '/api/v1/parking-lots',
    method: 'get',
    params: q
  })
}

export function createParkingLot(data) {
  return request({
    url: '/api/v1/parking-lots',
    method: 'post',
    data
  })
}

export function getParkingLot(id) {
  return request({
    url: `/api/v1/parking-lots/${id}`,
    method: 'get'
  })
}

export function updateParkingLot(id, data) {
  return request({
    url: `/api/v1/parking-lots/${id}`,
    method: 'put',
    data
  })
}

export function deleteParkingLot(id) {
  return request({
    url: `/api/v1/parking-lots/${id}`,
    method: 'delete'
  })
}

// Parking Space APIs
export function getParkingSpaces(parkingLotId, params) {
  return request({
    url: `/api/v1/parking-lots/${parkingLotId}/spaces`,
    method: 'get',
    params
  })
}

export function getParkingSpace(id) {
  return request({
    url: `/api/v1/parking/spaces/${id}`,
    method: 'get'
  })
}

// 更新停车位信息（类型、维护、预约状态等）
export function updateParkingSpace(id, data) {
  return request({
    url: `/api/v1/parking/spaces/${id}`,
    method: 'put',
    data
  })
}

// 占用停车位
export function occupyParkingSpace(spaceId, payloadOrVehicleId) {
  const config = {
    url: `/api/v1/parking/spaces/${spaceId}/occupy`,
    method: 'post',
    suppressErrorToast: true
  }
  if (typeof payloadOrVehicleId === 'number') {
    config.data = { vehicle_id: payloadOrVehicleId }
  } else if (payloadOrVehicleId && typeof payloadOrVehicleId === 'object') {
    config.data = payloadOrVehicleId
  }
  return request(config)
}

// 释放停车位
export function vacateParkingSpace(spaceId) {
  return request({
    url: `/api/v1/parking/spaces/${spaceId}/vacate`,
    method: 'post',
    data: { exit_time: new Date().toISOString() }
  })
}

export function vacateParkingByRecord(recordId) {
  return request({
    url: `/api/v1/parking-records/${recordId}/vacate`,
    method: 'post'
  })
}

export function exitAndSettle(recordId) {
  return request({
    url: `/api/v1/parking-records/${recordId}/exit-and-settle`,
    method: 'post'
  })
}

// 用户预约列表
export function getMyReservations(params) {
  return request({
    url: '/api/v1/reservations/me',
    method: 'get',
    params
  })
}

// Navigation APIs
export function calculateNavigationPath(parkingLotId, start, end) {
  return request({
    url: `/api/v1/parking-lots/${parkingLotId}/navigate`,
    method: 'post',
    data: {
      start: { row: start.row, col: start.col },
      end: { row: end.row, col: end.col }
    }
  })
}

export function findNearestAvailableSpace(parkingLotId, currentPosition, spaceType) {
  return request({
    url: `/api/v1/parking-lots/${parkingLotId}/nearest-space`,
    method: 'post',
    data: {
      origin: { row: currentPosition.row, col: currentPosition.col },
      preferred_type: spaceType
    }
  })
}

// 预留停车位
export function reserveParkingSpace(spaceId, data) {
  return request({
    url: `/api/v1/parking/spaces/${spaceId}/reserve`,
    method: 'post',
    data
  })
}

// Statistics APIs
export function getParkingLotStats(parkingLotId) {
  return request({
    url: `/api/v1/parking-lots/${parkingLotId}/stats`,
    method: 'get'
  })
}

export function getParkingLotLayout(parkingLotId) {
  return request({
    url: `/api/v1/parking-lots/${parkingLotId}/layout`,
    method: 'get'
  })
}

export function updateParkingLotLayout(parkingLotId, layoutData) {
  return request({
    url: `/api/v1/parking-lots/${parkingLotId}/layout`,
    method: 'put',
    data: layoutData
  })
}

// 已移除：实时状态接口（后端端点下线）

// Admin Dashboard APIs
export function getAdminParkingStats() {
  return request({
    url: '/api/v1/admin/dashboard/stats',
    method: 'get'
  })
}

export function getAdminParkingTrends(days = 7) {
  return request({
    url: '/api/v1/admin/dashboard/stats',
    method: 'get',
    params: { days }
  })
}

export function getAdminParkingRecords(params) {
  return request({
    url: '/api/v1/admin/parking-records',
    method: 'get',
    params
  })
}

export function getAdminParkingSpaces(params) {
  return request({
    url: '/api/v1/parking-lots',
    method: 'get',
    params
  })
}

export function getAvailableSpaces(parkingLotId) {
  return request({
    url: `/api/v1/parking-lots/${parkingLotId}/spaces`,
    method: 'get',
    params: { status_value: 'available' }
  })
}
