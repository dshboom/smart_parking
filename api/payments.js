import request from '@/utils/request'

// 获取当前用户余额
export function getMyBalance() {
  return request({
    url: '/payments/balance/me',
    method: 'get'
  })
}

// 结算停车费用
// payload: { record_id, use_balance, payment_method?, force_end? }
export function settleParkingFee(payload) {
  return request({
    url: '/payments/parking/settle',
    method: 'post',
    data: payload
  })
}