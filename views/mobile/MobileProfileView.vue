<template>
  <div class="mobile-profile">
    <div class="profile-header">
      <div class="user-avatar">
        <el-avatar :size="80" :src="userInfo.avatar || defaultAvatar">
          <el-icon><User /></el-icon>
        </el-avatar>
      </div>
      <div class="user-info">
        <h3>{{ userInfo.username || '用户' }}</h3>
        <p>{{ userInfo.phone || '未绑定手机号' }}</p>
        <el-tag type="success" size="small" v-if="userInfo.vip_level">
          {{ getVipLevelText(userInfo.vip_level) }}
        </el-tag>
      </div>
    </div>
    
    <div class="user-stats">
      <div class="stat-item">
        <div class="stat-number">{{ userStats.totalParkings }}</div>
        <div class="stat-label">停车次数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ userStats.totalHours }}</div>
        <div class="stat-label">停车时长(h)</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">¥{{ userStats.totalAmount }}</div>
        <div class="stat-label">消费金额</div>
      </div>
    </div>
    
    <div class="menu-list">
      <div class="menu-section">
        <h4>我的服务</h4>
        <div class="menu-items">
          <div class="menu-item" @click="goToMyVehicles">
            <div class="menu-icon">
              <el-icon><Position /></el-icon>
            </div>
            <div class="menu-content">
              <span>我的车辆</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="menu-item" @click="goToReservations">
            <div class="menu-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="menu-content">
              <span>我的预约</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="menu-item" @click="goToHistory">
            <div class="menu-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="menu-content">
              <span>停车记录</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
      
      <div class="menu-section">
        <h4>账户设置</h4>
        <div class="menu-items">
          <div class="menu-item" @click="goToProfileEdit">
            <div class="menu-icon">
              <el-icon><Edit /></el-icon>
            </div>
            <div class="menu-content">
              <span>个人信息</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="menu-item" @click="goToPayment">
            <div class="menu-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="menu-content">
              <span>支付设置</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="menu-item" @click="goToHelp">
            <div class="menu-icon">
              <el-icon><QuestionFilled /></el-icon>
            </div>
            <div class="menu-content">
              <span>帮助中心</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
      
      <div class="menu-section">
        <div class="menu-items">
          <div class="menu-item logout-item" @click="handleLogout">
            <div class="menu-icon">
              <el-icon><SwitchButton /></el-icon>
            </div>
            <div class="menu-content">
              <span>退出登录</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  User, ArrowRight, Position, Calendar, Document,
  Edit, Wallet, QuestionFilled, SwitchButton 
} from '@element-plus/icons-vue'

export default {
  name: 'MobileProfileView',
  components: {
    User, ArrowRight, Position, Calendar, Document,
    Edit, Wallet, QuestionFilled, SwitchButton
  },
  data() {
    return {
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      userInfo: {
        username: '',
        phone: '',
        avatar: '',
        vip_level: 0
      },
      userStats: {
        totalParkings: 0,
        totalHours: 0,
        totalAmount: 0
      }
    }
  },
  mounted() {
    this.loadUserInfo()
    this.loadUserStats()
  },
  methods: {
    async loadUserInfo() {
      try {
        const userInfo = await this.$store.dispatch('user/getInfo')
        this.userInfo = { ...this.userInfo, ...userInfo }
        // VIP信息已整合进 /users/me 的响应（vip_level），无会员时为 null/0
      } catch (error) {
        console.error('加载用户信息失败:', error)
        // 未登录或Token失效，跳转登录页
        if (error?.response?.status === 401) {
          this.$message.error('登录已过期，请重新登录')
          this.$router.push('/login')
        }
      }
    },
    
    async loadUserStats() {
      try {
        const stats = await this.$store.dispatch('user/getStats')
        this.userStats = { ...this.userStats, ...stats }
      } catch (error) {
        console.error('加载用户统计失败:', error)
      }
    },
    
    getVipLevelText(level) {
      const levels = {
        1: '普通会员',
        2: '银卡会员',
        3: '金卡会员',
        4: '钻石会员'
      }
      return levels[level] || '普通用户'
    },
    
    goToMyVehicles() {
      this.$router.push('/mobile/vehicles')
    },
    
    goToReservations() {
      this.$router.push('/mobile/reservations')
    },
    
    goToHistory() {
      this.$router.push('/mobile/history')
    },
    
    goToProfileEdit() {
      this.$router.push('/mobile/profile/edit')
    },
    
    goToPayment() {
      this.$router.push('/mobile/payment')
    },
    
    goToHelp() {
      this.$router.push('/mobile/help')
    },
    
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('user/logout').then(() => {
          this.$message.success('退出登录成功')
          this.$router.push('/login')
        }).catch(error => {
          this.$message.error(error.message || '退出登录失败')
        })
      }).catch(() => {
        // 用户取消
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-profile {
  padding: 20px 0;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
  
  .user-avatar {
    margin-bottom: 15px;
    
    .el-avatar {
      border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
  
  .user-info {
    h3 {
      color: #333;
      font-size: 18px;
      margin-bottom: 5px;
      font-weight: 600;
    }
    
    p {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
}

.user-stats {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  
  .stat-item {
    text-align: center;
    
    .stat-number {
      font-size: 20px;
      font-weight: 700;
      color: #409eff;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
    }
  }
}

.menu-list {
  .menu-section {
    margin-bottom: 20px;
    
    h4 {
      color: #333;
      font-size: 14px;
      margin-bottom: 10px;
      padding-left: 10px;
      font-weight: 600;
    }
    
      .menu-items {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
      
      .menu-item {
        display: flex;
        align-items: center;
        padding: 15px;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
        }
        
        &:active {
          background-color: #e9ecef;
        }
        
        .menu-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 15px;
          
          .el-icon {
            font-size: 20px;
          }
        }
        
        .menu-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          span {
            color: #333;
            font-size: 14px;
            font-weight: 500;
          }
          
          .el-icon {
            color: #ccc;
            font-size: 16px;
          }
        }
        
        &.logout-item {
          .menu-icon {
            background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
          }
          
          .menu-content span {
            color: #f56c6c;
          }
        }
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .mobile-profile {
    padding: 15px 0;
  }
  
  .profile-header {
    margin-bottom: 25px;
    
    .user-info {
      h3 {
        font-size: 16px;
      }
      
      p {
        font-size: 13px;
      }
    }
  }
  
  .user-stats {
    padding: 15px;
    margin-bottom: 25px;
    
    .stat-item {
      .stat-number {
        font-size: 18px;
      }
      
      .stat-label {
        font-size: 11px;
      }
    }
  }
  
  .menu-list {
    .menu-section {
      margin-bottom: 15px;
      
      h4 {
        font-size: 13px;
        margin-bottom: 8px;
      }
      
      .menu-items {
        .menu-item {
          padding: 12px;
          
          .menu-icon {
            width: 35px;
            height: 35px;
            margin-right: 12px;
            
            .el-icon {
              font-size: 18px;
            }
          }
          
          .menu-content {
            span {
              font-size: 13px;
            }
          }
        }
      }
    }
  }
}
</style>