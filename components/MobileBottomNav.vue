<template>
  <div class="mobile-bottom-nav">
    <div class="nav-item" :class="{ active: activeTab === 'entry' }" @click="navigateTo('/mobile/entry')">
      <el-icon><Position /></el-icon>
      <span>入场</span>
    </div>
    <div class="nav-item" :class="{ active: activeTab === 'find' }" @click="navigateTo('/mobile/find')">
      <el-icon><Search /></el-icon>
      <span>寻找</span>
    </div>
    <div class="nav-item" :class="{ active: activeTab === 'profile' }" @click="navigateTo('/mobile/profile')">
      <el-icon><User /></el-icon>
      <span>我的</span>
    </div>
  </div>
</template>

<script>
import { Position, Search, User } from '@element-plus/icons-vue'

export default {
  name: 'MobileBottomNav',
  components: {
    Position,
    Search,
    User
  },
  computed: {
    activeTab() {
      const path = this.$route.path
      if (path.includes('/mobile/entry')) return 'entry'
      if (path.includes('/mobile/find')) return 'find'
      if (path.includes('/mobile/profile')) return 'profile'
      return 'entry'
    }
  },
  methods: {
    navigateTo(path) {
      this.$router.push(path)
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    flex: 1;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #999;
    font-size: 12px;

    &:hover {
      background-color: #f5f5f5;
    }

    .el-icon {
      font-size: 20px;
      margin-bottom: 4px;
      transition: all 0.3s ease;
    }

    span {
      font-size: 11px;
      font-weight: 500;
    }

    &.active {
      color: #409eff;
      
      .el-icon {
        color: #409eff;
        transform: scale(1.1);
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .mobile-bottom-nav {
    height: 50px;
    
    .nav-item {
      .el-icon {
        font-size: 18px;
        margin-bottom: 2px;
      }
      
      span {
        font-size: 10px;
      }
    }
  }
}
</style>