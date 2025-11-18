import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import store from '@/store'
import router from '@/router'
import { getToken } from '@/utils/auth'
import { API_CONFIG } from '@/config/api.config'
// 统一错误消息去重与文案映射
let __lastErrorToast = { msg: '', ts: 0 }
function mapStatusToMessage(status) {
  switch (status) {
    case 403: return '您没有权限执行该操作'
    case 404: return '资源不存在或已删除'
    case 422: return '请求参数不合法，请检查输入'
    case 429: return '请求过于频繁，请稍后再试'
    case 500: return '服务器开小差了，请稍后再试'
    case 503: return '服务暂不可用，请稍后再试'
    default: return '请求失败，请稍后再试'
  }
}
function showErrorToast(message) {
  const now = Date.now()
  if (__lastErrorToast.msg === message && now - __lastErrorToast.ts < 1500) {
    return
  }
  __lastErrorToast = { msg: message, ts: now }
  ElMessage({
    message,
    type: 'error',
    duration: 5 * 1000
  })
}

// create an axios instance
const service = axios.create({
  baseURL: API_CONFIG.baseUrl, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    const token = getToken()
    if (token) {
      // let each request carry token
      // Use Authorization header with Bearer token for JWT
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data

    // For FastAPI backend, return the response directly if it's successful
    if (response.status >= 200 && response.status < 300) {
      return res
    } else {
      showErrorToast(res.detail || res.message || 'Error')
      return Promise.reject(new Error(res.detail || res.message || 'Error'))
    }
  },
  error => {
    console.log('err' + error) // for debug
    const status = error?.response?.status
    const requestUrl = error?.config?.url || ''
    const backendDetail = error?.response?.data?.detail
    const backendMessage = typeof backendDetail === 'string' ? backendDetail : (error?.response?.data?.message)
    const baseMessage = backendMessage || error?.message
    const errorMessage = (typeof baseMessage === 'string' && baseMessage.trim().length > 0) ? baseMessage : mapStatusToMessage(status)
    const suppressToast = Boolean(error?.config?.suppressErrorToast)

    // 登录过期（401）自动跳转到登录页
    if (status === 401) {
      // 登录接口的401表示账号或密码错误，不提示“已过期”，也不跳转
      const isLoginEndpoint = requestUrl.includes('/api/v1/login') || requestUrl.includes('/users/token') || requestUrl.endsWith('/token')
      if (isLoginEndpoint) {
        showErrorToast((typeof backendMessage === 'string' && backendMessage.trim().length > 0) ? backendMessage : '手机号或密码错误')
        return Promise.reject(error)
      }
      // 防抖：避免并发请求触发多次跳转
      if (!window.__redirectingToLogin) {
        window.__redirectingToLogin = true
        // 清理本地登录状态
        store.dispatch('user/resetToken').finally(() => {
          // 友好提示
          showErrorToast('登录已过期，请重新登录')
          // 记录当前路径用于登录后回跳
          const current = router.currentRoute?.value?.fullPath || '/'
          router.push(`/login?redirect=${encodeURIComponent(current)}`).finally(() => {
            window.__redirectingToLogin = false
          })
        })
      }
    } else if (status === 429) {
      const cfg = error.config || {}
      const attempt = (cfg.__retryCount || 0) + 1
      if (attempt <= 2) {
        const retryAfterHeader = error?.response?.headers?.['retry-after']
        const baseDelay = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 1000
        const delayMs = baseDelay * Math.pow(2, attempt - 1)
        cfg.__retryCount = attempt
        return new Promise(resolve => setTimeout(resolve, delayMs)).then(() => service(cfg))
      }
      if (!suppressToast) {
        showErrorToast(mapStatusToMessage(429))
      }
    } else {
      // 其他错误：支持按请求配置关闭错误弹窗
      if (!suppressToast) {
        showErrorToast(errorMessage)
      }
    }
    return Promise.reject(error)
  }
)

export default service
