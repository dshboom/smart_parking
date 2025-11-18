import { createApp } from 'vue'
import './utils/passiveWheel' // make global wheel listeners passive on window/document
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus, { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import 'element-plus/dist/index.css'
import './permission' // permission control
import { wsManager } from '@/utils/websocket'
import { permissionDirective, roleDirective } from '@/utils/permission'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册全局权限指令
app.directive('permission', permissionDirective)
app.directive('role', roleDirective)

// 使用新 WebSocket 管理器，保持全局属性兼容
app.config.globalProperties.$websocket = wsManager

app.use(store)
app.use(router)
app.use(ElementPlus)

// 全局注册 Element Plus 图标，确保动态组件与各视图可用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

// 不在全局建立 WebSocket 连接；仅在需要的页面（管理员视图）中按需连接
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$confirm = ElMessageBox.confirm
app.config.globalProperties.$notify = ElNotification
