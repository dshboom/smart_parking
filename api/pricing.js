import request from '@/utils/request'

// 获取定价配置（包含VIP计划与预约规则）
export function getPricingConfig() {
  return request({
    url: '/pricing/config',
    method: 'get'
  })
}

// 计算停车费用
export function calcParkingFee(durationHours) {
  return request({
    url: '/pricing/calc/parking-fee',
    method: 'get',
    params: { duration_hours: durationHours }
  })
}

// 高级计费：支持分时段、每日封顶等
// params: { entry_time?: ISOString, exit_time?: ISOString, duration_hours?: number }
export function calcParkingFeeAdvanced(params) {
  return request({
    url: '/pricing/calc/parking-fee-advanced',
    method: 'post',
    data: params
  })
}