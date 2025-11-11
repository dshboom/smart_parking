import request from '@/utils/request'

// 获取当前用户VIP状态
export function getMyVip() {
  return request({
    url: '/users/me/vip',
    method: 'get'
  })
}

// 管理端用户列表（ReservationManagement 依赖）
export function getUsers(params = {}) {
  return request({
    url: '/users/',
    method: 'get',
    params
  })
}