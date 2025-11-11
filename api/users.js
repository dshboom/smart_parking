import request from '@/utils/request'

// 获取当前用户VIP状态
export function getMyVip() {
  return request({
    url: '/users/me/vip',
    method: 'get'
  })
}