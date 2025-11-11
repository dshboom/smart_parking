import request from '@/utils/request'

// 获取预约列表
export function getReservations(params) {
  return request({
    url: '/reservations/admin/all',
    method: 'get',
    params
  })
}

// 创建预约
export function createReservation(data) {
  return request({
    url: '/reservations',
    method: 'post',
    data
  })
}

// 获取预约详情
export function getReservationDetail(id) {
  return request({
    url: `/reservations/${id}`,
    method: 'get'
  })
}

// 更新预约
export function updateReservation(id, data) {
  return request({
    url: `/reservations/${id}`,
    method: 'put',
    data
  })
}

// 取消预约
export function cancelReservation(id) {
  return request({
    url: `/reservations/${id}/cancel`,
    method: 'post'
  })
}

// 删除预约
export function deleteReservation(id) {
  return request({
    url: `/reservations/${id}`,
    method: 'delete'
  })
}

// 获取预约统计数据
export function getReservationStats() {
  return request({
    url: '/reservations/admin/stats/overview',
    method: 'get'
  })
}

// 获取预约趋势数据
export function getReservationTrends(days = 30) {
  return request({
    url: '/reservations/admin/stats/trends',
    method: 'get',
    params: { days }
  })
}

// 获取用户的预约列表
export function getUserReservations(userId, params) {
  return request({
    url: `/reservations/user/${userId}`,
    method: 'get',
    params
  })
}

// 检查预约冲突
export function checkReservationConflict(data) {
  return request({
    url: '/reservations/check-conflict',
    method: 'post',
    data
  })
}

// ===== 我的预约相关接口 =====

// 获取我的预约列表
export function getMyReservations(params) {
  return request({
    url: '/reservations/my',
    method: 'get',
    params
  })
}

// 创建我的预约
export function createMyReservation(data) {
  return request({
    url: '/reservations/my',
    method: 'post',
    data
  })
}

// 获取我的预约详情
export function getMyReservationDetail(id) {
  return request({
    url: `/reservations/my/${id}`,
    method: 'get'
  })
}

// 更新我的预约
export function updateMyReservation(id, data) {
  return request({
    url: `/reservations/my/${id}`,
    method: 'put',
    data
  })
}

// 取消我的预约
export function cancelMyReservation(id) {
  return request({
    url: `/reservations/my/${id}/cancel`,
    method: 'post'
  })
}

// 删除我的预约
export function deleteMyReservation(id) {
  return request({
    url: `/reservations/my/${id}`,
    method: 'delete'
  })
}