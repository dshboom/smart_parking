import request from '@/utils/request'

// 忘记密码 - 发送验证码
export function forgotPassword(identifier) {
  return request({
    url: '/api/v1/auth/forgot-password',
    method: 'post',
    data: {
      username: identifier,
      phone: identifier,
      email: identifier
    }
  })
}

// 重置密码
export function resetPassword(data) {
  return request({
    url: '/api/v1/auth/reset-password',
    method: 'post',
    data: {
      token: data.token,
      code: data.code,
      new_password: data.new_password
    }
  })
}