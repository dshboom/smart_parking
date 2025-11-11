<template>
  <div class="mobile-profile-edit">
    <div class="edit-header">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h2>编辑资料</h2>
    </div>

    <div class="edit-content">
      <div class="avatar-section">
        <div class="avatar-container">
          <el-avatar :size="100" :src="userInfo.avatar || defaultAvatar" />
          <div class="avatar-edit" @click="changeAvatar">
            <el-icon><Camera /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 头像选择对话框 -->
    <el-dialog
      v-model="avatarDialogVisible"
      title="选择头像"
      width="90%"
      top="20vh"
      class="avatar-dialog"
    >
      <div class="avatar-grid">
        <div 
          v-for="(avatar, index) in avatarOptions" 
          :key="index"
          class="avatar-option"
          :class="{ active: tempAvatar === avatar }"
          @click="selectAvatar(avatar)"
        >
          <el-avatar :size="60" :src="avatar" />
        </div>
      </div>
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAvatar">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { 
  ArrowLeft, Camera
} from '@element-plus/icons-vue'

export default {
  name: 'MobileProfileEditView',
  components: {
    ArrowLeft, Camera
  },
  data() {
    return {
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      userInfo: {},
      profileForm: {
        avatar: ''
      },
      avatarDialogVisible: false,
      tempAvatar: '',
      avatarOptions: [
        'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        'https://cube.elemecdn.com/1/34/19aa98b1fcb2781d43c8b32a3f7e9epng.png',
        'https://cube.elemecdn.com/9/bb/e27858e973f5d7d3904835f46abbdpng.png',
        'https://cube.elemecdn.com/d/66/45f397a7d3c7a70217d0f6081b508png.png',
        'https://cube.elemecdn.com/6/1c/9a8cfb1a8c6e38d9a5e5e8b1e1a9png.png'
      ]
    }
  },
  mounted() {
    this.loadUserInfo()
  },
  methods: {
    async loadUserInfo() {
      try {
        const userInfo = await this.$store.dispatch('user/getInfo')
        this.userInfo = userInfo
        this.profileForm.avatar = userInfo.avatar || this.defaultAvatar
      } catch (error) {
        console.error('加载用户信息失败:', error)
        this.$message.error('加载用户信息失败')
      }
    },

    goBack() {
      this.$router.back()
    },

    changeAvatar() {
      this.tempAvatar = this.profileForm.avatar
      this.avatarDialogVisible = true
    },

    selectAvatar(avatar) {
      this.tempAvatar = avatar
    },

    async confirmAvatar() {
      this.profileForm.avatar = this.tempAvatar
      this.avatarDialogVisible = false
      try {
        await this.$store.dispatch('user/updateProfile', { avatar: this.profileForm.avatar })
        this.userInfo.avatar = this.profileForm.avatar
        this.$message.success('头像更新成功')
      } catch (error) {
        console.error('头像更新失败:', error)
        this.$message.error('头像更新失败')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-profile-edit {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.edit-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-back {
    margin-right: 15px;
    cursor: pointer;
    color: #666;
    font-size: 20px;
    
    &:hover {
      color: #409eff;
    }
  }

  h2 {
    flex: 1;
    text-align: center;
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }
}

.edit-content {
  padding: 20px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
  
  .avatar-container {
    position: relative;
    display: inline-block;
    
    .avatar-edit {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 30px;
      height: 30px;
      background: #409eff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
      
      &:hover {
        background: #66b1ff;
      }
    }
  }
}

.profile-form {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  :deep(.el-form-item) {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    color: #666;
    font-weight: 500;
    margin-bottom: 8px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-radio-group) {
    display: flex;
    justify-content: space-around;
  }

  :deep(.el-radio) {
    margin-right: 0;
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;

  .save-btn {
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    border: none;
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #66b1ff 0%, #85ce61 100%);
      transform: translateY(-2px);
    }
  }

  .reset-btn {
    background: white;
    border: 2px solid #dcdfe6;
    color: #666;
    font-weight: 500;
    
    &:hover {
      border-color: #409eff;
      color: #409eff;
      background: #f5f7fa;
    }
  }
}

.avatar-dialog {
  :deep(.el-dialog) {
    border-radius: 15px;
  }

  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 20px;

    .avatar-option {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        background: #f5f7fa;
        transform: scale(1.05);
      }

      &.active {
        border-color: #409eff;
        background: #ecf5ff;
        box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .edit-content {
    padding: 15px;
  }

  .avatar-section {
    margin-bottom: 20px;
  }

  .profile-form {
    padding: 15px;
  }

  .form-actions {
    gap: 12px;
  }
}

@media screen and (max-width: 375px) {
  .edit-header {
    padding: 12px 15px;
    
    h2 {
      font-size: 16px;
    }
  }

  .edit-content {
    padding: 12px;
  }

  .avatar-dialog .avatar-grid {
    gap: 15px;
    padding: 15px;
  }
}
</style>