import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './permission' // permission control
import { wsManager } from '@/utils/websocket'
import { permissionDirective, roleDirective } from '@/utils/permission'

const app = createApp(App)

// 注册全局权限指令
app.directive('permission', permissionDirective)
app.directive('role', roleDirective)

// 使用新 WebSocket 管理器，保持全局属性兼容
app.config.globalProperties.$websocket = wsManager

app.use(store)
app.use(router)
app.use(ElementPlus)

app.mount('#app')

// 建立全局 WebSocket 连接，并暴露到 window 方便页面取消订阅
wsManager.connect()
window.wsManager = wsManager
