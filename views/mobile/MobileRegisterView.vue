<template>
  <div class="mobile-register-container">
    <div class="mobile-register-card">
      <div class="register-header">
        <div class="header-back" @click="goToLogin">
            <span>←</span>
          </div>
        <div class="register-icon">
          <span>👤</span>
        </div>
        <h1 class="register-title">欢迎加入</h1>
        <p class="register-subtitle">创建您的智能停车账户</p>
      </div>
      
      <div class="register-form-container">
        <el-form 
          ref="registerForm" 
          :model="registerForm" 
          :rules="registerRules" 
          class="register-form"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="username">
            <div class="input-group">
              <div class="input-icon">
                <span>👤</span>
              </div>
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名"
                size="large"
                class="modern-input"
                @keyup.enter="handleRegister"
              />
            </div>
          </el-form-item>

          <el-form-item prop="phone">
            <div class="input-group">
              <div class="input-icon">
                <span>📱</span>
              </div>
              <el-input
                v-model="registerForm.phone"
                placeholder="请输入手机号"
                size="large"
                class="modern-input"
                @keyup.enter="handleRegister"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-group">
              <div class="input-icon">
                <span>🔒</span>
              </div>
              <el-input
                v-model="registerForm.password"
                :type="passwordType"
                placeholder="请设置密码（6-20位）"
                size="large"
                class="modern-input"
                @keyup.enter="handleRegister"
              >
                <template #suffix>
                  <span class="show-pwd" @click="showPwd">
                    <span>{{ passwordType === 'password' ? '👁️' : '👁️‍🗨️' }}</span>
                  </span>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <div class="input-group">
              <div class="input-icon">
                <span>🔑</span>
              </div>
              <el-input
                v-model="registerForm.confirmPassword"
                :type="confirmPasswordType"
                placeholder="请再次输入密码"
                size="large"
                class="modern-input"
                @keyup.enter="handleRegister"
              >
                <template #suffix>
                  <span class="show-pwd" @click="showConfirmPwd">
                    <span>{{ confirmPasswordType === 'password' ? '👁️' : '👁️‍🗨️' }}</span>
                  </span>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="agree">
            <div class="agreement-section">
              <el-checkbox v-model="registerForm.agree" class="agree-checkbox">
                <span class="agree-text">
                  我已阅读并同意
                  <a href="#" class="agree-link" @click.prevent="showTerms">服务条款</a>
                  和
                  <a href="#" class="agree-link" @click.prevent="showPrivacy">隐私政策</a>
                </span>
              </el-checkbox>
            </div>
          </el-form-item>

          <el-button 
            :loading="loading" 
            type="primary" 
            class="register-button" 
            @click="handleRegister"
            size="large"
          >
            <span>✔️</span>
            立即注册
          </el-button>
        </el-form>
        
        <div class="divider">
          <span>或者</span>
        </div>
        
        <div class="quick-login">
          <p class="quick-login-text">已有账户？</p>
          <el-button 
            type="default" 
            class="login-button" 
            @click="goToLogin"
            size="large"
          >
            <span>→</span>
            立即登录
          </el-button>
        </div>
      </div>
      
      <div class="register-footer">
        <p>注册即表示您同意我们的服务</p>
        <div class="security-info">
          <span>🛡️</span>
          <span>您的信息将被安全加密</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'MobileRegisterView',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value || value.trim().length === 0) {
        callback(new Error('请输入用户名'))
      } else if (value.length < 2) {
        callback(new Error('用户名长度不能少于2个字符'))
      } else if (value.length > 20) {
        callback(new Error('用户名长度不能超过20个字符'))
      } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(value)) {
        callback(new Error('用户名只能包含中文、英文、数字和下划线'))
      } else {
        callback()
      }
    }
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
        callback(new Error('请设置密码'))
      } else if (value.length < 6) {
        callback(new Error('密码长度不能少于6个字符'))
      } else if (value.length > 20) {
        callback(new Error('密码长度不能超过20个字符'))
      } else {
        callback()
      }
    }
    const validateConfirmPassword = (rule, value, callback) => {
      if (!value || value.length === 0) {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    const validateAgree = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请同意服务条款和隐私政策'))
      } else {
        callback()
      }
    }
    return {
      registerForm: {
        username: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agree: false
      },
      registerRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        phone: [{ required: true, trigger: 'blur', validator: validatePhone }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        confirmPassword: [{ required: true, trigger: 'blur', validator: validateConfirmPassword }],
        agree: [{ required: true, trigger: 'change', validator: validateAgree }]
      },
      loading: false,
      passwordType: 'password',
      confirmPasswordType: 'password'
    }
  },
  methods: {
    showPwd() {
      this.passwordType = this.passwordType === 'password' ? '' : 'password'
    },
    
    showConfirmPwd() {
      this.confirmPasswordType = this.confirmPasswordType === 'password' ? '' : 'password'
    },
    
    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true
          const registerData = {
            username: this.registerForm.username,
            phone: this.registerForm.phone,
            password: this.registerForm.password
          }
          // 注册成功后自动登录并按角色跳转
          this.$store.dispatch('user/register', registerData)
            .then(async () => {
              this.$message.success('🎉 注册成功！正在登录...')
              await this.$store.dispatch('user/login', { phone: registerData.phone, password: registerData.password, remember: false })
              await this.$store.dispatch('user/getInfo')
              const role = this.$store.state.user.status
              if (role === 'admin') {
                this.$router.push('/admin/dashboard')
              } else {
                this.$router.push('/mobile/entry')
              }
            })
            .catch(error => {
              this.$message.error(error.message || '注册失败，请重试')
            })
            .finally(() => {
              this.loading = false
            })
        } else {
          this.$message.warning('请检查输入信息')
          return false
        }
      })
    },
    
    goToLogin() {
      this.$router.push('/login')
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
.mobile-register-container {
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

.mobile-register-card {
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

.register-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  padding: 40px 30px;
  text-align: center;
  color: white;
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
    animation: headerGlow 8s ease-in-out infinite;
  }
  
  .parking-icon {
    font-size: 24px;
    margin-bottom: 15px;
    animation: parkingFloat 3s ease-in-out infinite;
    position: relative;
    z-index: 2;
  }
  
  h2 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
    position: relative;
    z-index: 2;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  p {
    font-size: 14px;
    opacity: 0.9;
    position: relative;
    z-index: 2;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
  @media screen and (max-width: 375px) {
    padding: 30px 20px;
    
    .parking-icon {
      font-size: 20px;
      margin-bottom: 12px;
    }
    
    h2 {
      font-size: 24px;
      margin-bottom: 6px;
    }
    
    p {
      font-size: 13px;
    }
  }
  
  @media screen and (max-height: 700px) {
    padding: 30px 20px;
    
    .parking-icon {
      margin-bottom: 12px;
    }
    
    h2 {
      margin-bottom: 6px;
    }
  }
}

.register-form-container {
  padding: 30px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  
  @media screen and (max-width: 768px) {
    padding: 20px;
    flex: 1;
    padding-top: 30px;
  }
  
  @media screen and (max-width: 375px) {
    padding: 15px;
    padding-top: 25px;
  }
  
  @media screen and (max-height: 700px) {
    padding: 20px;
    padding-top: 25px;
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
  margin-bottom: 20px;
  
  &:focus-within {
    border-color: #67c23a;
    background: white;
    box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.1);
  }
  
  &:hover {
    border-color: #c0c4cc;
  }
  
  &:focus-within:hover {
    border-color: #67c23a;
  }
  
  .input-icon {
    color: #999;
    margin-right: 12px;
    font-size: 18px;
    transition: color 0.3s ease;
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
      outline: none !important;
      
      &.is-focus {
        border: none !important;
        box-shadow: none !important;
      }
      
      &.is-error {
        border: none !important;
        box-shadow: none !important;
      }
      
      &:focus {
        border: none !important;
        box-shadow: none !important;
      }
    }
    
    :deep(.el-input__inner) {
      padding: 12px 0;
      font-size: 15px;
      font-weight: 400;
      
      &::placeholder {
        color: #c0c4cc;
        font-weight: 400;
      }
      
      &:focus {
        transform: translateY(-1px);
      }
    }
  }
  
  @media screen and (max-width: 375px) {
    margin-bottom: 15px;
    padding: 0 12px;
    border-radius: 8px;
    
    .input-icon {
      margin-right: 10px;
      font-size: 16px;
    }
    
    .modern-input :deep(.el-input__inner) {
      padding: 10px 0;
      font-size: 14px;
    }
  }
  
  @media screen and (max-height: 700px) {
    margin-bottom: 15px;
  }
}

.agreement-section {
    margin-bottom: 25px;

    .agree-checkbox {
      :deep(.el-checkbox__label) {
        font-size: 13px;
        color: #606266;
        line-height: 1.5;
        font-weight: 400;
      }

      :deep(.el-checkbox__inner) {
        border-radius: 4px;
        border: 2px solid #dcdfe6;
        transition: all 0.3s ease;

        &:hover {
          border-color: #409eff;
        }
      }

      :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
        background-color: #409eff;
        border-color: #409eff;
      }
    }

    .agree-text {
      display: inline-block;
      font-size: 13px;
      color: #606266;
      line-height: 1.5;
    }

    .agree-link {
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

    &.error {
      .agree-text {
        color: #f56c6c;

        .agree-link {
          color: #f56c6c;
        }
      }

      :deep(.el-checkbox__inner) {
        border-color: #f56c6c;
      }

      :deep(.el-input__wrapper) {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
    }
  
  .agreement-error {
    font-size: 12px;
    color: #f56c6c;
    margin-top: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &::before {
      content: '⚠️';
      font-size: 12px;
    }
  }
  
  @media screen and (max-width: 375px) {
    margin-bottom: 20px;
    
    .agree-checkbox :deep(.el-checkbox__label) {
      font-size: 12px;
    }
    
    .agree-text {
      font-size: 12px;
    }
    
    .agreement-error {
      font-size: 11px;
      margin-top: 6px;
      
      &::before {
        font-size: 11px;
      }
    }
  }
  
  @media screen and (max-height: 700px) {
    margin-bottom: 20px;
  }
}

.register-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
    transform: translateY(-2px);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(64, 158, 255, 0.2);
  }
  
  &:disabled {
    background: #c0c4cc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &::before {
      display: none;
    }
  }
  
  .button-icon {
    font-size: 18px;
    margin-right: 8px;
    transition: transform 0.3s ease;
  }
  
  &:hover .button-icon {
    transform: scale(1.1);
  }
  
  @media screen and (max-width: 375px) {
    padding: 12px;
    font-size: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    
    .button-icon {
      font-size: 16px;
      margin-right: 6px;
    }
  }
  
  @media screen and (max-height: 700px) {
    padding: 12px;
    margin-bottom: 15px;
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

.quick-login {
  text-align: center;
  
  .quick-login-text {
    font-size: 14px;
    color: #666;
    margin-bottom: 15px;
  }
  
  .login-button {
    width: 100%;
    height: 45px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    background: white;
    border: 2px solid #409eff;
    color: #409eff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    
    &:hover {
      background: #409eff;
      color: white;
      box-shadow: 0 4px 15px rgba(64, 158, 255, 0.2);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(64, 158, 255, 0.15);
    }
    
    .button-icon {
      font-size: 16px;
      transition: transform 0.3s ease;
    }
    
    &:hover .button-icon {
      transform: scale(1.1);
    }
  }
  
  @media screen and (max-width: 375px) {
    .login-button {
      height: 40px;
      font-size: 13px;
      border-radius: 6px;
      gap: 5px;
      
      .button-icon {
        font-size: 14px;
      }
    }
  }
  
  @media screen and (max-height: 700px) {
    .login-button {
      height: 40px;
    }
  }
}

.register-footer {
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
  color: #999;
  font-size: 16px;
  
  &:hover {
    color: #409eff;
  }
}
</style>