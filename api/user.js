import request from '@/utils/request'

export function login(data) {
  // Use URL-encoded body to match OAuth2PasswordRequestForm expectations
  const params = new URLSearchParams()
  params.append('username', data.phone) // backend treats username as phone
  params.append('password', data.password)

  return request({
    url: '/users/token',
    method: 'post',
    data: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

export function getInfo(token) {
  return request({
    url: '/users/me',
    method: 'get'
  })
}

export function updateMe(data) {
  return request({
    url: '/users/me',
    method: 'put',
    data
  })
}

export function logout() {
  return request({
    url: '/users/logout',
    method: 'post'
  })
}

// 当前用户统计
export function getMyStats() {
  return request({
    url: '/users/me/stats',
    method: 'get'
  })
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
    url: '/users/me/parking-history',
    method: 'get',
    params: query
  })
}

// 已移除VIP相关API：getMyVip、upgradeMyVip

export function fetchList(query) {
  return request({
    url: '/users/',
    method: 'get',
    params: query
  })
}

export function register(data) {
  return request({
    url: '/users/',
    method: 'post',
    data: {
      username: data.username,
      phone: data.phone,
      password: data.password
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function updateUserStatus(id, status) {
  return request({
    url: `/users/${id}/status`,
    method: 'put',
    data: { status }
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
export function getMyVehicles() {
  return request({
    url: '/users/me/vehicles',
    method: 'get'
  })
}

export function addMyVehicle(data) {
  return request({
    url: '/users/me/vehicles',
    method: 'post',
    data
  })
}

export function removeMyVehicle(licensePlate) {
  return request({
    url: `/users/me/vehicles/${licensePlate}`,
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