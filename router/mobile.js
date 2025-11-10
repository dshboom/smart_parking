import { createRouter, createWebHistory } from 'vue-router'
import MobileLayout from '@/views/mobile/MobileLayout.vue'
import MobileEntryView from '@/views/mobile/MobileEntryView.vue'
import MobileFindView from '@/views/mobile/MobileFindView.vue'
import MobileProfileView from '@/views/mobile/MobileProfileView.vue'
import MobileMyVehiclesView from '@/views/mobile/MobileMyVehiclesView.vue'
import MobileLoginView from '@/views/mobile/MobileLoginView.vue'
import MobileRegisterView from '@/views/mobile/MobileRegisterView.vue'
import MobileProfileEditView from '@/views/mobile/MobileProfileEditView.vue'
import MobilePaymentView from '@/views/mobile/MobilePaymentView.vue'
import MobileReservationsView from '@/views/mobile/MobileReservationsView.vue'
import MobileHistoryView from '@/views/mobile/MobileHistoryView.vue'
import MobileHelpView from '@/views/mobile/MobileHelpView.vue'
import MobileVipView from '@/views/mobile/MobileVipView.vue'

const mobileRoutes = [
  {
    path: '/mobile',
    name: 'MobileLayout',
    component: MobileLayout,
    redirect: '/mobile/entry',
    children: [
      {
        path: 'entry',
        name: 'MobileEntry',
        component: MobileEntryView,
        meta: { title: '车辆入场', requiresAuth: true }
      },
      {
        path: 'find',
        name: 'MobileFind',
        component: MobileFindView,
        meta: { title: '寻找车位', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'MobileProfile',
        component: MobileProfileView,
        meta: { title: '用户中心', requiresAuth: true }
      },
      {
        path: 'vehicles',
        name: 'MobileMyVehicles',
        component: MobileMyVehiclesView,
        meta: { title: '我的车辆', requiresAuth: true }
      }
    ]
  },
  {
    path: '/mobile/profile-edit',
    name: 'MobileProfileEdit',
    component: MobileProfileEditView,
    meta: { title: '编辑资料', requiresAuth: true }
  },
  {
    path: '/mobile/payment',
    name: 'MobilePayment',
    component: MobilePaymentView,
    meta: { title: '支付设置', requiresAuth: true }
  },
  {
    path: '/mobile/vip',
    name: 'MobileVip',
    component: MobileVipView,
    meta: { title: 'VIP会员', requiresAuth: true }
  },
  {
    path: '/mobile/reservations',
    name: 'MobileReservations',
    component: MobileReservationsView,
    meta: { title: '我的预约', requiresAuth: true }
  },
  {
    path: '/mobile/history',
    name: 'MobileHistory',
    component: MobileHistoryView,
    meta: { title: '停车记录', requiresAuth: true }
  },
  {
    path: '/mobile/help',
    name: 'MobileHelp',
    component: MobileHelpView,
    meta: { title: '帮助中心', requiresAuth: true }
  },
  {
    path: '/login',
    name: 'MobileLogin',
    component: MobileLoginView,
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'MobileRegister',
    component: MobileRegisterView,
    meta: { title: '注册' }
  }
]

export default mobileRoutes