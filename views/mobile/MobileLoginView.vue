<template>
  <div class="mobile-login-container">
    <div class="mobile-login-card">
      <div class="login-header">
        <div class="parking-icon">
          <div class="parking-text-icon">🅿️</div>
        </div>
        <h1 class="app-title">智能停车</h1>
        <p class="app-subtitle">让停车变得更简单</p>
      </div>
      
      <div class="login-form-container">
        <el-form 
          ref="loginForm" 
          :model="loginForm" 
          :rules="loginRules" 
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="phone">
            <div class="input-group">
              <div class="input-icon">
                <span class="input-label">📱</span>
              </div>
              <el-input
                v-model="loginForm.phone"
                placeholder="请输入手机号"
                size="large"
                class="modern-input"
                @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-group">
              <div class="input-icon">
                <span class="input-label">🔒</span>
              </div>
              <el-input
                v-model="loginForm.password"
                :type="passwordType"
                placeholder="请输入密码"
                size="large"
                class="modern-input"
                @keyup.enter="handleLogin"
              >
                <template #suffix>
                  <span class="show-pwd" @click="showPwd">
                    <span class="password-toggle">{{ passwordType === 'password' ? '👁️' : '👁️‍🗨️' }}</span>
                  </span>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe" class="remember-checkbox">
              记住我
            </el-checkbox>
            <a href="#" class="forget-link" @click.prevent="handleForgetPassword">
              忘记密码？
            </a>
          </div>

          <el-button 
            :loading="loading" 
            type="primary" 
            class="login-button" 
            @click="handleLogin"
            size="large"
          >
            <span class="button-icon">→</span>
            立即登录
          </el-button>
        </el-form>
        
        <div class="divider">
          <span>或者</span>
        </div>
        
        <div class="quick-actions">
          <el-button 
            type="default" 
            class="register-button" 
            @click="goToRegister"
            size="large"
          >
            <span class="button-icon">➕</span>
            快速注册
          </el-button>
          

        </div>
      </div>
      
      <div class="login-footer">
        <p>登录即表示您同意</p>
        <div class="links">
          <a href="#" @click.prevent="showTerms">服务条款</a>
          <span>和</span>
          <a href="#" @click.prevent="showPrivacy">隐私政策</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MobileLoginView',
  
  created() {
    // 确保移动端样式生效
    document.body.classList.add('mobile-view')
  },
  
  unmounted() {
    // 清理移动端样式
    document.body.classList.remove('mobile-view')
  },
  data() {
    const validatePhone = (rule, value, callback) => {
      if (!value || value.trim().length === 0) {
        callback(new Error('请输入手机号'))
      } else if (!/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的手机号'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value || value.length === 0) {
        callback(new Error('请输入密码'))
      } else if (value.length < 6) {
        callback(new Error('密码长度不能少于6个字符'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        phone: '',
        password: ''
      },
      loginRules: {
        phone: [{ required: true, trigger: 'blur', validator: validatePhone }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      loading: false,
      passwordType: 'password',
      rememberMe: false
    }
  },
  methods: {
    showPwd() {
      this.passwordType = this.passwordType === 'password' ? '' : 'password'
    },
    
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm).then(async () => {
            this.$message.success('🎉 登录成功！')
            try {
              await this.$store.dispatch('user/getInfo')
              // 获取用户信息后再检查角色
              const role = this.$store.state.user.status
              if (role === 'admin') {
                this.$router.push('/admin/dashboard')
              } else {
                this.$router.push('/mobile/entry')
              }
            } catch (e) {
              // 如果获取用户信息失败，默认跳转到用户端
              this.$router.push('/mobile/entry')
            }
          }).catch(error => {
            this.$message.error(error.message || '登录失败，请重试')
          }).finally(() => {
            this.loading = false
          })
        } else {
          this.$message.warning('请检查输入信息')
          return false
        }
      })
    },
    
    goToRegister() {
      this.$router.push('/register')
    },
    
    handleForgetPassword() {
      this.$message.info('🔒 密码找回功能开发中...')
    },
    
    showTerms() {
      this.$message.info('📋 服务条款功能开发中...')
    },
    
    showPrivacy() {
      this.$message.info('🔐 隐私政策功能开发中...')
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  @media screen and (max-width: 768px) {
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  @media screen and (max-width: 375px) {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4b9e 100%);
  }
}

.mobile-login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  @media screen and (max-width: 768px) {
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
  }
  
  @media screen and (max-width: 375px) {
    background: rgba(255, 255, 255, 0.98);
  }
}

.login-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  .parking-icon {
    margin-bottom: 15px;
    position: relative;
    z-index: 1;
    text-align: center;
  }
  
  .parking-text-icon {
    font-size: 60px;
    display: inline-block;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .app-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
    letter-spacing: 2px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .app-subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
    position: relative;
    z-index: 1;
    font-weight: 300;
  }
  
  @media screen and (max-width: 768px) {
    padding: 30px 20px;
    
    .app-title {
      font-size: 24px;
    }
  }
  
  @media screen and (max-width: 375px) {
    padding: 25px 20px;
    
    .parking-text-icon {
      font-size: 50px;
    }
    
    .app-title {
      font-size: 22px;
      margin-bottom: 6px;
    }
    
    .app-subtitle {
      font-size: 13px;
    }
  }
}

.login-form-container {
  padding: 30px 20px;
  flex: 1;
  
  @media screen and (max-width: 768px) {
    padding: 20px;
    flex: 1;
  }
  
  @media screen and (max-width: 375px) {
    padding: 15px;
  }
  
  @media screen and (max-height: 700px) {
    padding: 15px 20px;
  }
}

.input-group {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0 15px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  
  &:focus-within {
    border-color: #409eff;
    background: white;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
    transform: translateY(-1px);
  }
  
  .input-icon {
    color: #999;
    margin-right: 12px;
    font-size: 18px;
    transition: color 0.3s ease;
  }
  
  .input-label {
    font-size: 18px;
    display: inline-block;
    transition: color 0.3s ease;
  }
  
  .input-label:hover {
    color: #409EFF;
  }
  
  .modern-input {
    flex: 1;
    border: none;
    background: transparent;
    
    :deep(.el-input__wrapper) {
      border: none !important;
      background: transparent;
      box-shadow: none !important;
      padding: 0;
      height: 50px;
      outline: none !important;
      
      &.is-focus {
        border: none !important;
        box-shadow: none !important;
      }
      
      &.is-error {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
      
      &:focus {
        border: none !important;
        box-shadow: none !important;
      }
    }
    
    :deep(.el-input__inner) {
      font-size: 16px;
      color: #333;
      
      &::placeholder {
        color: #999;
        font-size: 14px;
      }
    }
  }
  
  @media screen and (max-width: 375px) {
    padding: 0 12px;
    border-radius: 10px;
    
    .input-icon {
      font-size: 16px;
      margin-right: 10px;
    }
    
    .modern-input :deep(.el-input__wrapper) {
      height: 45px;
    }
    
    .modern-input :deep(.el-input__inner) {
      font-size: 15px;
    }
  }
  
  @media screen and (max-height: 700px) {
    margin-bottom: 6px;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .remember-checkbox {
    :deep(.el-checkbox__label) {
      font-size: 13px;
      color: #666;
      font-weight: 400;
    }
    
    :deep(.el-checkbox__inner) {
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    
    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      background-color: #409eff;
      border-color: #409eff;
    }
  }
  
  .forget-link {
    font-size: 13px;
    color: #409eff;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      text-decoration: underline;
      color: #66b1ff;
    }
    
    &:active {
      color: #3a8ee6;
    }
  }
  
  @media screen and (max-width: 375px) {
    margin-bottom: 18px;
    
    .remember-checkbox :deep(.el-checkbox__label),
    .forget-link {
      font-size: 12px;
    }
  }
  
  @media screen and (max-height: 700px) {
    margin-bottom: 15px;
  }
}

.login-button {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 25px;
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    border: none;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(64, 158, 255, 0.3);
    }
    
    .button-icon {
      font-size: 16px;
      transition: transform 0.3s ease;
    }
    
    &:hover .button-icon {
      transform: translateX(3px);
    }
    
    @media screen and (max-width: 375px) {
      height: 48px;
      font-size: 15px;
      border-radius: 24px;
    }
  }

.divider {
  text-align: center;
  margin: 25px 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
  }
  
  span {
    background: white;
    padding: 0 15px;
    color: #999;
    font-size: 12px;
    position: relative;
    font-weight: 500;
    letter-spacing: 1px;
  }
  
  @media screen and (max-width: 375px) {
    margin: 20px 0;
    
    span {
      font-size: 11px;
      padding: 0 12px;
    }
  }
  
  @media screen and (max-height: 700px) {
    margin: 20px 0;
  }
}

.quick-actions {
  display: flex;
  gap: 10px;
  
  .register-button {
    flex: 1;
    height: 45px;
    font-size: 14px;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s ease;
    font-weight: 500;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  .register-button {
    background: white;
    border: 2px solid #409eff;
    color: #409eff;
    
    &:hover {
      background: #f0f7ff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    }
  }
  

  
  .button-icon {
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  
  .login-button:hover .button-icon,
  .register-button:hover .button-icon {
    transform: translateX(3px);
  }
  
  @media screen and (max-width: 375px) {
    gap: 8px;
    
    .register-button {
      height: 42px;
      font-size: 13px;
      border-radius: 20px;
    }
    
    .button-icon {
      font-size: 14px;
    }
  }
  
  @media screen and (max-height: 700px) {
    gap: 8px;
    
    .register-button {
      height: 40px;
      font-size: 13px;
    }
  }
}

.login-footer {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  
  p {
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
    font-weight: 400;
  }
  
  .links {
    font-size: 12px;
    
    a {
      color: #409eff;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        text-decoration: underline;
        color: #66b1ff;
      }
      
      &:active {
        color: #3a8ee6;
      }
    }
    
    span {
      color: #999;
      margin: 0 5px;
      font-weight: 400;
    }
  }
  
  @media screen and (max-width: 768px) {
    margin-top: auto;
  }
  
  @media screen and (max-width: 375px) {
    padding: 15px;
    
    p {
      font-size: 11px;
    }
    
    .links {
      font-size: 11px;
    }
  }
  
  @media screen and (max-height: 700px) {
    padding: 15px;
  }
}

.show-pwd {
  cursor: pointer;
  user-select: none;
  color: #909399;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 50%;
  
  &:hover {
    color: #409EFF;
    background: rgba(64, 158, 255, 0.1);
  }
  
  &:active {
    background: rgba(64, 158, 255, 0.2);
  }
}

.password-toggle {
  font-size: 16px;
  transition: color 0.3s ease;
  display: inline-block;
  
  &:hover {
    color: #409EFF;
    transform: scale(1.1);
  }
}
</style>