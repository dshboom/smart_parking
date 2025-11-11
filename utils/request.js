import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import store from '@/store'
import router from '@/router'
import { getToken } from '@/utils/auth'
import { API_CONFIG } from '@/config/api.config'

// create an axios instance
const service = axios.create({
  baseURL: API_CONFIG.baseUrl, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000 // request timeout
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
      ElMessage({
        message: res.detail || res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error(res.detail || res.message || 'Error'))
    }
  },
  error => {
    console.log('err' + error) // for debug
    const status = error?.response?.status
    const requestUrl = error?.config?.url || ''
    const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message
    const suppressToast = Boolean(error?.config?.suppressErrorToast)

    // 登录过期（401）自动跳转到登录页
    if (status === 401) {
      // 登录接口的401表示账号或密码错误，不提示“已过期”，也不跳转
      const isLoginEndpoint = requestUrl.includes('/users/token') || requestUrl.endsWith('/token')
      if (isLoginEndpoint) {
        ElMessage.error(errorMessage || '手机号或密码错误')
        return Promise.reject(error)
      }
      // 防抖：避免并发请求触发多次跳转
      if (!window.__redirectingToLogin) {
        window.__redirectingToLogin = true
        // 清理本地登录状态
        store.dispatch('user/resetToken').finally(() => {
          // 友好提示
          ElMessage.error('登录已过期，请重新登录')
          // 记录当前路径用于登录后回跳
          const current = router.currentRoute?.value?.fullPath || '/'
          router.push(`/login?redirect=${encodeURIComponent(current)}`).finally(() => {
            window.__redirectingToLogin = false
          })
        })
      }
    } else {
      // 其他错误：支持按请求配置关闭错误弹窗
      if (!suppressToast) {
        ElMessage({
          message: errorMessage,
          type: 'error',
          duration: 5 * 1000
        })
      }
    }
    return Promise.reject(error)
  }
)

export default service