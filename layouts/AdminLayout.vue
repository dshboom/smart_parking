<template>
  <div class="admin-layout">
    <el-container>
      <!-- 现代化侧边栏 -->
      <el-aside width="240px" class="modern-sidebar">
        <div class="sidebar-header">
          <div class="logo-container">
            <div class="logo-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="logo-text">
              <h3>智能停车</h3>
              <span>管理系统</span>
            </div>
          </div>
        </div>
        
        <div class="sidebar-menu-container">
          <el-menu
            :default-active="activeMenu"
            class="modern-sidebar-menu"
            router
            :collapse="isCollapse"
            unique-opened
          >
            <el-menu-item index="/admin/dashboard" class="modern-menu-item">
              <el-icon><Monitor /></el-icon>
              <template #title>
                <span class="menu-title">仪表盘</span>
                <span class="menu-subtitle">Dashboard</span>
              </template>
            </el-menu-item>
            
            <el-menu-item index="/admin/vehicles" class="modern-menu-item">
              <el-icon><Van /></el-icon>
              <template #title>
                <span class="menu-title">车辆管理</span>
                <span class="menu-subtitle">Vehicle</span>
              </template>
            </el-menu-item>
            
            <el-menu-item index="/admin/users" class="modern-menu-item">
              <el-icon><User /></el-icon>
              <template #title>
                <span class="menu-title">用户管理</span>
                <span class="menu-subtitle">Users</span>
              </template>
            </el-menu-item>
            
            <el-menu-item index="/admin/records" class="modern-menu-item">
              <el-icon><Document /></el-icon>
              <template #title>
                <span class="menu-title">进出记录</span>
                <span class="menu-subtitle">Records</span>
              </template>
            </el-menu-item>
            
            <el-menu-item index="/admin/parking" class="modern-menu-item">
              <el-icon><Setting /></el-icon>
              <template #title>
                <span class="menu-title">停车场管理</span>
                <span class="menu-subtitle">Parking</span>
              </template>
            </el-menu-item>
            
            <el-menu-item index="/admin/reservations" class="modern-menu-item">
              <el-icon><Timer /></el-icon>
              <template #title>
                <span class="menu-title">预约管理</span>
                <span class="menu-subtitle">Reservation</span>
              </template>
            </el-menu-item>
            
            <el-menu-item index="/admin/payments" class="modern-menu-item">
              <el-icon><Wallet /></el-icon>
              <template #title>
                <span class="menu-title">支付管理</span>
                <span class="menu-subtitle">Payment</span>
              </template>
            </el-menu-item>
            
            <el-menu-item index="/admin/settings" class="modern-menu-item">
              <el-icon><Setting /></el-icon>
              <template #title>
                <span class="menu-title">系统设置</span>
                <span class="menu-subtitle">Settings</span>
              </template>
            </el-menu-item>
          </el-menu>
        </div>
        
        <!-- 用户信息区域 -->
        <div class="sidebar-footer">
          <div class="user-info-card">
            <div class="user-avatar">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="user-details">
              <span class="username">{{ username }}</span>
              <span class="user-role">管理员</span>
            </div>
            <el-dropdown @command="handleCommand" trigger="click">
              <el-icon class="more-icon"><ArrowDown /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区域 -->
      <el-container class="main-container">
        <!-- 顶部导航栏 -->
        <el-header class="modern-header" height="80px">
          <div class="header-content">
            <div class="breadcrumb-section">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item>管理后台</el-breadcrumb-item>
                <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
              </el-breadcrumb>
            </div>
            
            <div class="header-actions">
              <el-button circle class="action-btn">
                <el-icon><Bell /></el-icon>
              </el-button>
              <el-button circle class="action-btn">
                <el-icon><Setting /></el-icon>
              </el-button>
            </div>
          </div>
        </el-header>
        
        <!-- 页面内容 -->
        <el-main class="modern-main">
          <div class="content-wrapper">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Van,
  User,
  Document,
  Expand,
  Fold,
  UserFilled,
  ArrowDown,
  OfficeBuilding,
  Setting,
  Timer,
  Bell,
  SwitchButton,
  Wallet
} from '@element-plus/icons-vue'

export default {
  name: 'AdminLayout',
  components: {
    Monitor,
    Van,
    User,
    Document,
    Expand,
    Fold,
    UserFilled,
    ArrowDown,
    OfficeBuilding,
    Bell,
    Setting,
    SwitchButton,
    Wallet
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const isCollapse = ref(false)
    const username = ref('管理员')

    const activeMenu = computed(() => route.path)

    const currentPageTitle = computed(() => {
      const titles = {
        '/admin/dashboard': '仪表盘',
        '/admin/vehicles': '车辆管理',
        '/admin/users': '用户管理',
        '/admin/records': '进出记录',
        '/admin/parking': '停车场管理',
        '/admin/reservations': '预约管理',
        '/admin/payments': '支付管理',
        '/admin/settings': '系统设置'
      }
      return titles[route.path] || '管理后台'
    })

    const toggleSidebar = () => {
      isCollapse.value = !isCollapse.value
    }

    const handleCommand = async (command) => {
      if (command === 'logout') {
        try {
          await store.dispatch('user/logout')
          router.push('/login')
          ElMessage.success('已退出登录')
        } catch (e) {
          ElMessage.error('退出失败')
        }
      } else if (command === 'profile') {
        router.push('/account/profile')
      }
    }

    onMounted(() => {
      // 从localStorage获取用户名
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const user = JSON.parse(userInfo)
        username.value = user.username || '管理员'
      }
    })

    return {
      isCollapse,
      username,
      activeMenu,
      currentPageTitle,
      toggleSidebar,
      handleCommand
    }
  }
}
</script>

<style scoped>
/* 现代化布局样式 */
.admin-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 现代化侧边栏 */
.modern-sidebar {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modern-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  z-index: -1;
}

/* 侧边栏头部 */
.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.logo-text h3 {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.logo-text span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 400;
}

/* 菜单容器 */
.sidebar-menu-container {
  flex: 1;
  padding: 20px 0;
}

/* 现代化菜单 */
.modern-sidebar-menu {
  background: transparent;
  border: none;
  padding: 0 16px;
}

.modern-menu-item {
  margin: 8px 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modern-menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.modern-menu-item:hover::before {
  left: 100%;
}

.modern-menu-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.modern-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.menu-title {
  color: white;
  font-weight: 600;
  font-size: 14px;
  display: block;
  margin-bottom: 2px;
}

.menu-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-menu-item.is-active .menu-title,
.modern-menu-item.is-active .menu-subtitle {
  color: white;
}

/* 侧边栏底部用户信息 */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.user-info-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.username {
  color: white;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
}

.user-role {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.more-icon {
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.more-icon:hover {
  color: white;
  transform: scale(1.1);
}

/* 主容器 */
.main-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  margin: 16px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 现代化头部 */
.modern-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0 32px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb-section :deep(.el-breadcrumb__item) {
  color: #666;
}

.breadcrumb-section :deep(.el-breadcrumb__inner) {
  color: #666;
  font-weight: 500;
}

.breadcrumb-section :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #667eea;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  color: #667eea;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

/* 主内容区域 */
.modern-main {
  padding: 32px;
  background: transparent;
}

.content-wrapper {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-sidebar {
    width: 200px !important;
  }
  
  .main-container {
    margin: 8px;
    border-radius: 16px;
  }
  
  .modern-main {
    padding: 16px;
  }
  
  .modern-header {
    padding: 0 16px;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-menu) {
  background: transparent;
}

:deep(.el-menu-item) {
  background: transparent;
  color: white;
}

:deep(.el-dropdown-menu) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

:deep(.el-dropdown-menu__item) {
  color: #333;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}
</style>