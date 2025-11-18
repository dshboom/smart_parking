import request from '@/utils/request'

// 余额相关
export function getUserBalance() {
  return request({ url: '/api/v1/wallet/balance', method: 'get' })
}
// 兼容移动端退出页现有命名
export function getMyBalance() { return getUserBalance() }

export function rechargeBalance(data) {
  return request({ url: '/api/v1/wallet/recharge', method: 'post', data })
}

export function withdrawBalance(data) {
  return request({ url: '/api/v1/wallet/withdraw', method: 'post', data })
}

export function getUserTransactions(params) {
  return request({ url: '/api/v1/wallet/transactions', method: 'get', params })
}

// 支付方式
export function getPaymentMethods() {
  return request({ url: '/api/v1/wallet/methods', method: 'get' })
}

// 结算停车费用
// payload: { record_id, use_balance, payment_method?, force_end? }
export function settleParkingFee(payload) {
  // payload: { record_id?, reservation_id?, amount, payment_type }
  const params = {}
  if (payload?.record_id) params.parking_record_id = payload.record_id
  if (payload?.reservation_id) params.reservation_id = payload.reservation_id
  if (payload?.amount) params.amount = payload.amount
  if (payload?.payment_type) params.payment_type = payload.payment_type
  return request({ url: '/api/v1/wallet/settle', method: 'post', params })
}

// ===== 管理员支付管理相关 =====
export function getAdminPaymentOverview() {
  return request({ url: '/payments/admin/stats/overview', method: 'get' })
}

export function getAdminTransactions(params = {}) {
  return request({ url: '/payments/admin/transactions', method: 'get', params })
}

export function refundTransaction(data) {
  return request({ url: '/payments/refund', method: 'post', data })
}

// ===== /api/v1 支付接口（与后端对齐） =====
export function createPayment(data) {
  return request({ url: '/api/v1/payments', method: 'post', data })
}

export function getMyPayments(params = {}) {
  return request({ url: '/api/v1/payments/me', method: 'get', params })
}

export function getAdminPayments(params = {}) {
  return request({ url: '/api/v1/admin/payments', method: 'get', params })
}
