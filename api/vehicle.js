import request from '@/utils/request'
import { adaptVehicleData, adaptParkingRecord, adaptParkingLot, adaptPaginatedResponse } from './adapters'

// 统一列表查询参数映射：page/page_size -> skip/limit；日期转 ISO 字符串
function mapVehicleListParams(params = {}) {
  const mapped = {}
  const page = Number(params.page || 1)
  const pageSize = Number(params.page_size || params.pageSize || 10)
  // 映射到后端分页参数
  mapped.skip = Math.max(0, (page - 1) * pageSize)
  mapped.limit = Math.max(1, pageSize)

  if (params.license_plate) mapped.license_plate = params.license_plate
  // 允许 undefined，不传则不筛选；显式布尔值才传递
  if (typeof params.is_in_parking === 'boolean') mapped.is_in_parking = params.is_in_parking

  const normDate = v => (v instanceof Date ? v.toISOString() : v)
  if (params.start_date) mapped.start_date = normDate(params.start_date)
  if (params.end_date) mapped.end_date = normDate(params.end_date)

  return mapped
}

export function vehicleEntry(data) {
  return request({
    url: '/api/v1/parking-records/entry',
    method: 'post',
    data
  })
}

// 已移除：在场车辆列表（统一使用车辆列表/状态接口）

export function getVehicles(params) {
  const query = mapVehicleListParams(params || {})
  return request({
    url: '/api/v1/vehicles/me',
    method: 'get',
    params: query
  }).then(response => {
    // 适配车辆数据格式
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(adaptVehicleData)
    }
    return response
  })
}

export function getParkingStatus() {
  return request({
    url: '/api/v1/parking-lots',
    method: 'get'
  }).then(response => {
    // 适配停车场数据格式
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(adaptParkingLot)
    }
    return response
  })
}

export function vehicleExit(payload) {
  const data = typeof payload === 'string'
    ? { license_plate: payload }
    : payload && payload.license_plate
      ? { license_plate: payload.license_plate }
      : payload;
  return request({
    url: '/api/v1/parking-records/exit',
    method: 'post',
    data
  })
}

export function getVehicleByLicensePlate(licensePlate) {
  return request({
    url: `/api/v1/vehicles/by-license-plate/${licensePlate}`,
    method: 'get'
  })
}

// 获取车辆当前实时费用（基于入场时间至现在）
export function getVehicleCurrentFee(licensePlate) {
  return request({
    url: `/api/v1/parking-records/current-fee/${licensePlate}`,
    method: 'get'
  })
}

// 管理端：车辆统计概览
export function getVehicleStatsOverview() {
  return request({
    url: '/api/v1/admin/vehicle-stats',
    method: 'get'
  })
}

// 管理端：车辆进出趋势（可选）
export function getVehicleTrends(days = 30) {
  return request({
    url: '/api/v1/admin/parking-records/trends',
    method: 'get',
    params: { days }
  })
}

// 管理端：统一车辆记录列表（items+total），兼容现有筛选参数
export function getVehicleRecordsList(params = {}) {
  const query = {}
  // 分页：支持 skip/limit 或 page/page_size
  const page = Number(params.page || 0)
  const pageSize = Number(params.page_size || params.pageSize || params.limit || 10)
  const hasSkip = typeof params.skip === 'number'
  query.skip = hasSkip ? Math.max(0, params.skip) : Math.max(0, (page > 0 ? (page - 1) : 0) * pageSize)
  query.limit = Math.max(1, pageSize)

  // 车牌号
  if (params.license_plate) query.license_plate = params.license_plate

  // 状态映射：is_in_parking -> status(in_parking/completed)
  if (typeof params.is_in_parking === 'boolean') {
    query.status = params.is_in_parking ? 'in_parking' : 'completed'
  } else if (typeof params.status === 'string' && params.status) {
    // 允许直接传入 status
    query.status = params.status
  }

  const normDate = v => (v instanceof Date ? v.toISOString() : v)
  // 日期范围：支持 dateRange 或 start_date/end_date
  if (Array.isArray(params.dateRange) && params.dateRange.length === 2) {
    query.start_date = normDate(params.dateRange[0])
    query.end_date = normDate(params.dateRange[1])
  } else {
    if (params.start_date) query.start_date = normDate(params.start_date)
    if (params.end_date) query.end_date = normDate(params.end_date)
  }

  return request({
    url: '/api/v1/admin/parking-records',
    method: 'get',
    params: query
  })
}
