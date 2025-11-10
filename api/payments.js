import request from '@/utils/request'

// === 用户余额与交易相关接口（与后端routers/payments.py一致） ===

// 获取当前用户余额
export function getUserBalance() {
  return request({
    url: '/payments/balance',
    method: 'get'
  })
}

// 余额充值
export function rechargeBalance(data) {
  // data: { amount: number, payment_method: string }
  return request({
    url: '/payments/recharge',
    method: 'post',
    data
  })
}

// 余额提现
export function withdrawBalance(data) {
  // data: { amount: number, bank_account: string }
  return request({
    url: '/payments/withdraw',
    method: 'post',
    data
  })
}

// 获取当前用户交易记录
export function getUserTransactions(params) {
  // params: { skip?: number, limit?: number, transaction_type?: string }
  return request({
    url: '/payments/transactions',
    method: 'get',
    params
  })
}

// 支付方式管理（当前用户）
export function addPaymentMethod(data) {
  return request({
    url: '/payments/payment-methods',
    method: 'post',
    data
  })
}

export function getPaymentMethods() {
  return request({
    url: '/payments/payment-methods',
    method: 'get'
  })
}

export function updatePaymentMethod(id, data) {
  return request({
    url: `/payments/payment-methods/${id}`,
    method: 'put',
    data
  })
}

export function deletePaymentMethod(id) {
  return request({
    url: `/payments/payment-methods/${id}`,
    method: 'delete'
  })
}

// === 管理端支付统计（保留占位，如后续启用管理页） ===
export function getAdminPaymentOverview() {
  return request({
    url: '/payments/admin/stats/overview',
    method: 'get'
  })
}

export function getAdminPaymentTrends(days = 30) {
  return request({
    url: '/payments/admin/stats/trends',
    method: 'get',
    params: { days }
  })
}

// 管理端：获取所有交易（分页与筛选）
export function getAdminTransactions(params) {
  // params: { status?, method?, user_id?, start_date?, end_date?, skip?, limit? }
  return request({
    url: '/payments/admin/transactions',
    method: 'get',
    params
  })
}