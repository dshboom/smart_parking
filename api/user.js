import request from '@/utils/request'
import { adaptUserData } from './adapters'

export function login(data) {
  // Use URL-encoded body to match OAuth2PasswordRequestForm expectations
  const params = new URLSearchParams()
  params.append('username', data.phone) // backend treats username as phone
  params.append('password', data.password)

  return request({
    url: '/api/v1/login',
    method: 'post',
    data: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

export function getInfo(_token) {
  return request({
    url: '/api/v1/users/me',
    method: 'get'
  }).then(response => {
    // 适配用户数据格式
    if (response.data) {
      response.data = adaptUserData(response.data)
    }
    return response
  })
}

export function updateMe(data) {
  return request({
    url: '/api/v1/users/me',
    method: 'patch',
    data
  }).then(response => {
    // 适配用户数据格式
    if (response.data) {
      response.data = adaptUserData(response.data)
    }
    return response
  })
}

export function logout() {
  return request({
    url: '/api/v1/logout',
    method: 'post'
  })
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/api/v1/users/me/change-password',
    method: 'post',
    data
  })
}

// 当前用户统计
export function getMyStats() {
  return request({
    url: '/api/v1/users/me/stats',
    method: 'get',
    suppressErrorToast: true
  }).catch(() => ({
    totalParkings: 0,
    totalHours: 0,
    totalAmount: 0
  }))
}

// 当前用户停车历史（支持筛选与分页）
export function getMyParkingHistory(params = {}) {
  const {
    skip = 0,
    limit = 10,
    start_date = undefined,
    end_date = undefined,
    parking_lot_id = undefined,
    status = undefined, // active | completed
    min_fee = undefined,
    max_fee = undefined
  } = params || {}

  const query = {
    skip,
    limit
  }
  if (start_date) query.start_date = start_date
  if (end_date) query.end_date = end_date
  if (parking_lot_id) query.parking_lot_id = parking_lot_id
  if (status) query.status = status
  if (min_fee != null) query.min_fee = min_fee
  if (max_fee != null) query.max_fee = max_fee

  return request({
    url: '/api/v1/parking-records/me',
    method: 'get',
    params: query
  })
}

// 已移除VIP相关API：getMyVip、upgradeMyVip

export function fetchList(query) {
  return request({
    url: '/api/v1/admin/users',
    method: 'get',
    params: query
  })
}

export function register(data) {
  return request({
    url: '/api/v1/register',
    method: 'post',
    data: {
      username: data.username,
      phone_number: data.phone,
      email: data.email,
      nickname: data.nickname,
      password: data.password
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function updateUserStatus(id, status) {
  return request({
    url: `/api/v1/admin/users/${id}/status`,
    method: 'put',
    params: { status }
  })
}

export function updateUser(id, data) {
  const payload = {}
  if (data.username) payload.username = data.username
  if (data.email) payload.email = data.email
  if (data.nickname) payload.nickname = data.nickname
  if (data.role) payload.role = data.role
  if (data.status) payload.status = data.status === 'blocked' ? 'suspended' : data.status
  if (data.new_password) payload.new_password = data.new_password
  if (data.locked !== undefined) payload.locked = data.locked

  return request({
    url: `/api/v1/admin/users/${id}`,
    method: 'patch',
    data: payload
  })
}

export function getUserDetail(userId) {
  return request({
    url: `/api/v1/admin/users/${userId}`,
    method: 'get'
  })
}

// ===== 用户-车辆绑定相关 =====
export function getUserVehicles(userId) {
  return request({
    url: `/users/${userId}/vehicles`,
    method: 'get'
  })
}

export function bindUserVehicle(userId, data) {
  return request({
    url: `/users/${userId}/vehicles`,
    method: 'post',
    data
  })
}

export function unbindUserVehicle(userId, licensePlate) {
  return request({
    url: `/users/${userId}/vehicles/${licensePlate}`,
    method: 'delete'
  })
}

export function getUserByLicensePlate(licensePlate) {
  return request({
    url: `/users/by-license-plate/${licensePlate}`,
    method: 'get'
  })
}

// ===== 我的车辆（当前用户） =====
export function getMyVehicles(options = {}) {
  return request({
    url: '/api/v1/vehicles/me',
    method: 'get',
    ...options
  })
}

export function getVehicles(params) {
  return getMyVehicles(params)
}

export function addMyVehicle(data) {
  return request({
    url: '/api/v1/vehicles',
    method: 'post',
    data
  })
}

export function setDefaultVehicle(vehicleId) {
  return request({
    url: `/api/v1/vehicles/${vehicleId}/default`,
    method: 'put'
  })
}

export function removeMyVehicle(vehicleId) {
  return request({
    url: `/api/v1/vehicles/${vehicleId}`,
    method: 'delete'
  })
}

// 已移除管理端VIP相关API：getVip、createVip、updateVip、deleteVip

// ===== 黑名单管理相关 =====
export function getBlacklist(userId) {
  return request({
    url: `/users/${userId}/blacklist`,
    method: 'get'
  })
}

export function addBlacklist(userId, data) {
  return request({
    url: `/users/${userId}/blacklist`,
    method: 'post',
    data
  })
}

export function removeBlacklist(userId) {
  return request({
    url: `/users/${userId}/blacklist`,
    method: 'delete'
  })
}