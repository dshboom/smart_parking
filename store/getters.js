/**
 * Vuex Getters
 * 全局状态获取函数
 */

const getters = {
  // 用户相关
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  roles: state => {
    // 从用户状态中获取角色信息
    const status = state.user.status
    if (status === 'admin') return ['admin']
    if (status === 'user') return ['user']
    return []
  },
  permissions: state => {
    // 基于角色生成权限列表
    const roles = getters.roles(state)
    const permissions = []
    
    // 管理员拥有所有权限
    if (roles.includes('admin')) {
      permissions.push(
        // 管理端基础视图权限
        'dashboard:view',
        'user:list', 'user:add', 'user:edit', 'user:delete', 'user:status',
        'vehicle:list', 'vehicle:add', 'vehicle:edit', 'vehicle:delete',
        'parking:list', 'parking:add', 'parking:edit', 'parking:delete',
        'reservation:list', 'reservation:add', 'reservation:edit', 'reservation:delete',
        'payment:list', 'payment:add', 'payment:edit', 'payment:delete',
        'record:list', 'record:add', 'record:edit', 'record:delete',
        'system:config', 'system:user', 'system:role', 'system:permission',
        // 系统设置页面权限
        'system:settings',
        // 账户中心权限（管理员也允许访问）
        'user:profile'
      )
    }
    
    // 普通用户拥有基础权限
    if (roles.includes('user')) {
      permissions.push(
        'user:profile', 'user:vehicle', 'user:reservation',
        'vehicle:view', 'parking:view', 'payment:view', 'record:view'
      )
    }
    
    return permissions
  },
  
  // 检查是否为管理员
  isAdmin: state => getters.roles(state).includes('admin'),
  
  // 检查是否登录
  isLoggedIn: state => !!state.user.token && state.user.token !== '',
  
  // 用户状态
  userStatus: state => state.user.status,
  
  // 车辆相关
  vehicleList: state => state.vehicle.list,
  vehicleTotal: state => state.vehicle.total,
  vehicleLoading: state => state.vehicle.loading,
  
  // 停车场相关
  parkingSpaces: state => state.parking.spaces,
  parkingStats: state => state.parking.stats,
  parkingLoading: state => state.parking.loading
}

export default getters