<template>
  <div class="mobile-layout">
    <div class="mobile-container">
      <div class="mobile-header" v-if="showHeader">
        <div class="header-content">
          <h1 class="app-title">智能停车</h1>
        </div>
      </div>
      
      <div class="mobile-content">
        <router-view />
      </div>
      
      <MobileBottomNav />
    </div>
  </div>
</template>

<script>
import MobileBottomNav from '@/components/MobileBottomNav.vue'

export default {
  name: 'MobileLayout',
  components: {
    MobileBottomNav
  },
  computed: {
    showHeader() {
      return this.$route.meta?.showHeader !== false
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  
  @media screen and (max-width: 768px) {
    padding: 0;
  }
}

.mobile-container {
  width: 100%;
  max-width: 414px;
  height: calc(100vh - 40px);
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  
  @media screen and (max-width: 768px) {
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }
}

.mobile-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 20px;
  text-align: center;
  
  .header-content {
    .app-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 2px;
    }
  }
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 80px;
  
  @media screen and (max-width: 768px) {
    padding: 15px;
    padding-bottom: 70px;
  }
}

/* 自定义滚动条 */
.mobile-content::-webkit-scrollbar {
  width: 4px;
}

.mobile-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.mobile-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.mobile-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>