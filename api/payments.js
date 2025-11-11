import request from '@/utils/request'

// 余额相关
export function getUserBalance() {
  return request({ url: '/payments/balance', method: 'get' })
}
// 兼容移动端退出页现有命名
export function getMyBalance() { return getUserBalance() }

export function rechargeBalance(data) {
  // data: { amount, payment_method }
  return request({ url: '/payments/recharge', method: 'post', data })
}

export function withdrawBalance(data) {
  // data: { amount, bank_account }
  return request({ url: '/payments/withdraw', method: 'post', data })
}

export function getUserTransactions(params) {
  // params: { skip?, limit?, transaction_type? }
  return request({ url: '/payments/transactions', method: 'get', params })
}

// 支付方式
export function getPaymentMethods() {
  return request({ url: '/payments/payment-methods', method: 'get' })
}

// 结算停车费用
// payload: { record_id, use_balance, payment_method?, force_end? }
export function settleParkingFee(payload) {
  return request({ url: '/payments/parking/settle', method: 'post', data: payload })
}

// ===== 管理员支付管理相关 =====
export function getAdminPaymentOverview() {
  return request({ url: '/payments/admin/stats/overview', method: 'get' })
}

export function getAdminTransactions(params = {}) {
  return request({ url: '/payments/admin/transactions', method: 'get', params })
}