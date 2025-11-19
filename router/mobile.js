import MobileLayout from '@/views/mobile/MobileLayout.vue'
import MobileEntryView from '@/views/mobile/MobileEntryView.vue'
import MobileFindView from '@/views/mobile/MobileFindView.vue'
import MobileProfileView from '@/views/mobile/MobileProfileView.vue'
import MobileLoginView from '@/views/mobile/MobileLoginView.vue'
import MobileRegisterView from '@/views/mobile/MobileRegisterView.vue'
import MobileProfileEditView from '@/views/mobile/MobileProfileEditView.vue'
import MobilePaymentView from '@/views/mobile/MobilePaymentView.vue'
import MobileHistoryView from '@/views/mobile/MobileHistoryView.vue'
import MobileExitView from '@/views/mobile/MobileExitView.vue'
import MobileForgotPasswordView from '@/views/mobile/MobileForgotPasswordView.vue'

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
        path: 'exit',
        name: 'MobileExit',
        component: MobileExitView,
        meta: { title: '出场结算', requiresAuth: true }
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
    path: '/mobile/history',
    name: 'MobileHistory',
    component: MobileHistoryView,
    meta: { title: '停车记录', requiresAuth: true }
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
  },
  {
    path: '/forgot-password',
    name: 'MobileForgotPassword',
    component: MobileForgotPasswordView,
    meta: { title: '忘记密码' }
  }
]

export default mobileRoutes