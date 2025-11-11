/**
 * 权限管理工具函数
 * 基于RBAC (Role-Based Access Control) 权限控制
 */

import store from '@/store'
import { getToken } from '@/utils/auth'

/**
 * 检查用户是否有指定角色
 * @param {string|string[]} roles - 角色或角色数组
 * @param {boolean} requireAll - 是否需要所有角色都匹配（默认：false，只需要匹配一个）
 * @returns {boolean}
 */
export function hasRole(roles, requireAll = false) {
  if (!roles) return true
  if (!store.getters.roles || store.getters.roles.length === 0) return false
  
  const roleArray = Array.isArray(roles) ? roles : [roles]
  const userRoles = store.getters.roles
  
  if (requireAll) {
    return roleArray.every(role => userRoles.includes(role))
  } else {
    return roleArray.some(role => userRoles.includes(role))
  }
}

/**
 * 检查用户是否有指定权限
 * @param {string|string[]} permissions - 权限或权限数组
 * @param {boolean} requireAll - 是否需要所有权限都匹配（默认：false，只需要匹配一个）
 * @returns {boolean}
 */
export function hasPermission(permissions, requireAll = false) {
  if (!permissions) return true
  if (!store.getters.permissions || store.getters.permissions.length === 0) return false
  
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  const userPermissions = store.getters.permissions
  
  if (requireAll) {
    return permissionArray.every(permission => userPermissions.includes(permission))
  } else {
    return permissionArray.some(permission => userPermissions.includes(permission))
  }
}

/**
 * 检查用户是否为管理员
 * @returns {boolean}
 */
export function isAdmin() {
  return hasRole('admin')
}

/**
 * 检查用户是否为普通用户
 * @returns {boolean}
 */
export function isUser() {
  return hasRole('user')
}

/**
 * 权限指令 v-permission
 * 用法: v-permission="'user:add'" 或 v-permission="['user:add', 'user:edit']"
 */
export const permissionDirective = {
  mounted(el, binding) {
    const { value } = binding
    
    if (value && !hasPermission(value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}

/**
 * 角色指令 v-role
 * 用法: v-role="'admin'" 或 v-role="['admin', 'manager']"
 */
export const roleDirective = {
  mounted(el, binding) {
    const { value } = binding
    
    if (value && !hasRole(value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}

/**
 * 路由权限检查
 * @param {Object} route - 路由对象
 * @returns {boolean}
 */
export function checkRouteAccess(route) {
  // 支持嵌套路由：逐条检查 matched 中的所有记录
  const records = Array.isArray(route.matched) && route.matched.length > 0
    ? route.matched
    : [route]

  const token = getToken()

  for (const rec of records) {
    const meta = rec.meta || {}
    // 统一的 access 配置，兼容旧的 roles/permissions/requiresAuth 写法
    const access = meta.access || {}

    const roles = access.roles ?? meta.roles
    const permissions = access.permissions ?? meta.permissions
    const requireAllRoles = access.requireAllRoles === true
    const requireAllPermissions = access.requireAllPermissions === true
    const requiresAuth = (access.requiresAuth ?? meta.requiresAuth) === true

    // 若需要登录或声明了角色/权限而当前未登录，则拒绝访问
    if ((requiresAuth || roles || permissions) && !token) {
      return false
    }

    // 角色校验（支持全部/任意）
    if (roles && !hasRole(roles, requireAllRoles)) {
      return false
    }

    // 权限校验（支持全部/任意）
    if (permissions && !hasPermission(permissions, requireAllPermissions)) {
      return false
    }
  }

  return true
}

// 兼容旧接口名称，内部统一走新的访问检查
export function checkRoutePermission(route) {
  return checkRouteAccess(route)
}