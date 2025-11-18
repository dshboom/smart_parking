import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import mobileRoutes from './mobile'

export const constantRoutes = [
  {
    path: '/',
    redirect: '/mobile/entry'
  },
  {
    path: '/parking-navigation',
    name: 'parking-navigation',
    component: () => import('../views/ParkingNavigation.vue')
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../views/AboutView.vue')
  },
  // 管理后台路由
  {
    path: '/admin',
    component: AdminLayout,
    meta: { 
      requiresAuth: true,
      roles: ['admin'] // 只有管理员可以访问
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { 
          permissions: ['dashboard:view'],
          title: '仪表盘'
        }
      },
      // Removed empty route object
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/UserListView.vue'),
        meta: { 
          permissions: ['user:list'],
          title: '用户管理'
        }
      },
      {
        path: 'records',
        name: 'admin-records',
        component: () => import('../views/VehicleRecordsView.vue'),
        meta: { 
          permissions: ['record:list'],
          title: '停车记录'
        }
      },
      {
        path: 'vehicles',
        name: 'admin-vehicles',
        component: () => import('../views/VehicleManagementView.vue'),
        meta: {
          permissions: ['vehicle:list'],
          title: '车辆管理'
        }
      },
      {
        path: 'parking',
        name: 'admin-parking',
        component: () => import('../views/ParkingManagement.vue'),
        meta: { 
          permissions: ['parking:list'],
          title: '停车场管理'
        }
      },
      
      {
        path: 'payments',
        name: 'admin-payments',
        component: () => import('../views/PaymentManagement.vue'),
        meta: { 
          permissions: ['payment:list'],
          title: '支付管理'
        }
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../views/SystemSettings.vue'),
        meta: { 
          permissions: ['system:settings'],
          title: '系统设置'
        }
      },
    ]
  },
  // 账户设置
  {
    path: '/account/profile',
    name: 'account-profile',
    component: () => import('../views/AccountProfileView.vue'),
    meta: { 
      requiresAuth: true,
      permissions: ['user:profile']
    }
  },
  // 移动端路由
  ...mobileRoutes
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes
})

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes
  })
  router.matcher = newRouter.matcher // reset router
}

export default router
