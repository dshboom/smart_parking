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

// 延长我的预约时间（需属于当前用户）
export function extendMyReservation(id, extendHours) {
  return request({
    url: `/reservations/${id}/extend`,
    method: 'put',
    data: { extend_hours: extendHours }
  })
}

// 重新预约（基于已完成/已取消的预约，同一车位）
export function rebookReservation(id, newStartTime, newEndTime) {
  return request({
    url: `/reservations/${id}/rebook`,
    method: 'post',
    data: { new_start_time: newStartTime, new_end_time: newEndTime }
  })
}

// 获取预约导航信息（当前用户的预约）
export function getReservationNavigation(id) {
  return request({
    url: `/reservations/${id}/navigate`,
    method: 'get'
  })
}