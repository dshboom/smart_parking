import request from '@/utils/request'

// 管理端用户列表（ReservationManagement 依赖）
export function getUsers(params = {}) {
  return request({
    url: '/api/v1/admin/users',
    method: 'get',
    params
  })
}