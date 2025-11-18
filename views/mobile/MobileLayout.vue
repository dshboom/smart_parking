<template>
  <div class="mobile-layout">
    <!-- 移动端主布局 -->
    <div class="mobile-container">
      <!-- 页面头部 -->
      <header class="mobile-header" v-if="showHeader">
        <div class="header-content">
          <slot name="header">
            <div class="default-header">
              <h1 class="page-title">{{ $route.meta.title || '智能停车' }}</h1>
            </div>
          </slot>
        </div>
      </header>

      <!-- 页面主体内容 -->
      <main class="mobile-main">
        <div class="main-content">
          <router-view />
        </div>
      </main>

      <!-- 底部导航栏 -->
      <nav class="mobile-bottom-nav">
        <MobileBottomNav />
      </nav>
    </div>
  </div>
</template>

<script>
import MobileBottomNav from '../../components/MobileBottomNav.vue'

export default {
  name: 'MobileLayout',
  components: {
    MobileBottomNav
  },
  computed: {
    showHeader() {
      // 根据路由配置决定是否显示头部
      return this.$route.meta.showHeader !== false
    }
  },
  
  created() {
    // 确保移动端样式生效
    document.body.classList.add('mobile-view')
  },
  
  unmounted() {
    // 清理移动端样式
    document.body.classList.remove('mobile-view')
  }
}
</script>

<style lang="scss" scoped>
.mobile-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  .mobile-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f7fa;
    
    @media screen and (max-width: 768px) {
      // 真正的移动端设备
      max-width: 100%;
    }
    
    @media screen and (min-width: 769px) {
      // PC端显示移动端样式（模拟手机）
      max-width: 375px;
      margin: 0 auto;
      border-radius: 20px;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
  }
}

.mobile-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 15px 20px;
  text-align: center;
  position: relative;
  z-index: 100;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    
    .default-header {
      .page-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        letter-spacing: 0.5px;
      }
    }
  }
  
  @media screen and (max-width: 768px) {
    padding: 12px 15px;
    
    .default-header .page-title {
      font-size: 16px;
    }
  }
}

.mobile-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  
  .main-content {
    min-height: 100%;
    padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)); // 为底部导航留出空间
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
}

.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  
  @media screen and (min-width: 769px) {
    // PC端显示移动端样式时，底部导航跟随容器
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: 375px;
    border-radius: 0 0 20px 20px;
    overflow: hidden;
  }
}

// 移动端全局样式
:global(.mobile-view) {
  @media screen and (min-width: 769px) {
    body {
      background: #f0f2f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    
    #app {
      width: 100%;
      max-width: 375px;
      margin: 0 auto;
    }
  }
}
</style>