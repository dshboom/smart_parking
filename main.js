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

// 修复Element Plus对话框导致的滚动锁定问题
const observer = new MutationObserver(() => {
  if (document.body.classList.contains('el-popup-parent--hidden')) {
    // 当对话框打开时，保持滚动功能
    document.body.style.overflow = 'auto'
    document.body.style.position = 'static'
  }
})
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

// 添加全局CSS样式来覆盖Element Plus的滚动锁定
const style = document.createElement('style')
style.textContent = `
  body.el-popup-parent--hidden {
    overflow: auto !important;
    position: static !important;
  }
  
  .el-popup-parent--hidden {
    overflow: auto !important;
  }
`
document.head.appendChild(style)

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
