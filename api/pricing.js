import request from '@/utils/request'

// 获取定价配置（包含VIP计划与预约规则）
export function getPricingConfig() {
  return request({
    url: '/pricing/config',
    method: 'get'
  })
}

// 计算VIP方案价格（可用于前端展示或校验）
export function calcVipPrice(plan) {
  return request({
    url: '/pricing/calc/vip-price',
    method: 'get',
    params: { plan }
  })
}

// 计算停车费用（可用于展示VIP折扣说明）
export function calcParkingFee(durationHours, isVip = false) {
  return request({
    url: '/pricing/calc/parking-fee',
    method: 'get',
    params: { duration_hours: durationHours, is_vip: isVip }
  })
}