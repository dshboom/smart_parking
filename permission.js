import router from './router'
import store from './store'
import { getToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import { checkRouteAccess } from '@/utils/permission'

const whiteList = ['/login', '/register'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // determine whether the user has logged in
  const hasToken = getToken()

  // 智能根路径跳转：管理员跳转到管理后台，普通用户跳转到移动端
  if (to.path === '/') {
    if (hasToken) {
      await store.dispatch('user/getInfo')
      const userRole = store.state.user.status
      if (userRole === 'admin') {
        next('/admin/users')
      } else {
        next('/mobile/entry')
      }
    } else {
      next('/mobile/entry')
    }
    return
  }

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
    } else {
      const hasGetUserInfo = store.state.user.name
      if (hasGetUserInfo) {
        // 统一检查路由访问权限
        if (!checkRouteAccess(to)) {
          ElMessage.error('您没有权限访问该页面')
          next('/')
          return
        }
        next()
      } else {
        try {
          // get user info
          await store.dispatch('user/getInfo')
          // 再次检查权限（获取用户信息后）
          if (!checkRouteAccess(to)) {
            ElMessage.error('您没有权限访问该页面')
            next('/')
            return
          }
          next()
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          ElMessage.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
        }
      }
    }
  } else {
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
    }
  }
})