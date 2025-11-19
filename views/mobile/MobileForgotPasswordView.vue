<template>
  <div class="mobile-forgot-password-container">
    <div class="mobile-forgot-password-card">
      <div class="header">
        <div class="parking-icon">
          <div class="parking-text-icon">🅿️</div>
        </div>
        <h1 class="app-title">找回密码</h1>
        <p class="app-subtitle">重置您的登录密码</p>
      </div>
      
      <div class="form-container">
        <!-- Step 1: Enter phone/email -->
        <el-form 
          v-if="step === 1"
          ref="step1Form" 
          :model="step1Form" 
          :rules="step1Rules" 
          class="forgot-password-form"
          @submit.prevent="handleStep1"
        >
          <el-form-item prop="identifier">
            <div class="input-group">
              <div class="input-icon">
                <span class="input-label">👤</span>
              </div>
              <el-input
                v-model="step1Form.identifier"
                placeholder="请输入手机号或邮箱"
                size="large"
                class="modern-input"
                @keyup.enter="handleStep1"
              />
            </div>
          </el-form-item>

          <el-button 
            :loading="step1Loading" 
            type="primary" 
            class="submit-button" 
            @click="handleStep1"
            size="large"
          >
            <span class="button-icon">📤</span>
            发送验证码
          </el-button>
        </el-form>

        <!-- Step 2: Enter verification code and new password -->
        <el-form 
          v-if="step === 2"
          ref="step2Form" 
          :model="step2Form" 
          :rules="step2Rules" 
          class="forgot-password-form"
          @submit.prevent="handleStep2"
        >
          <div class="step-info">
            <p class="info-text">验证码已发送至: {{ maskedIdentifier }}</p>
            <el-button 
              type="text" 
              class="change-identifier-btn"
              @click="goToStep1"
            >
              更换账号
            </el-button>
          </div>

          <el-form-item prop="verificationCode">
            <div class="input-group">
              <div class="input-icon">
                <span class="input-label">🔢</span>
              </div>
              <el-input
                v-model="step2Form.verificationCode"
                placeholder="请输入验证码"
                size="large"
                class="modern-input"
                maxlength="6"
                @keyup.enter="handleStep2"
              />
            </div>
          </el-form-item>

          <el-form-item prop="newPassword">
            <div class="input-group">
              <div class="input-icon">
                <span class="input-label">🔒</span>
              </div>
              <el-input
                v-model="step2Form.newPassword"
                :type="passwordType"
                placeholder="请输入新密码"
                size="large"
                class="modern-input"
                @keyup.enter="handleStep2"
              >
                <template #suffix>
                  <span class="show-pwd" @click="showPwd">
                    <span class="password-toggle">{{ passwordType === 'password' ? '👁️' : '👁️‍🗨️' }}</span>
                  </span>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <div class="input-group">
              <div class="input-icon">
                <span class="input-label">🔐</span>
              </div>
              <el-input
                v-model="step2Form.confirmPassword"
                :type="confirmPasswordType"
                placeholder="请确认新密码"
                size="large"
                class="modern-input"
                @keyup.enter="handleStep2"
              >
                <template #suffix>
                  <span class="show-pwd" @click="showConfirmPwd">
                    <span class="password-toggle">{{ confirmPasswordType === 'password' ? '👁️' : '👁️‍🗨️' }}</span>
                  </span>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-button 
            :loading="step2Loading" 
            type="primary" 
            class="submit-button" 
            @click="handleStep2"
            size="large"
          >
            <span class="button-icon">✅</span>
            重置密码
          </el-button>

          <div class="resend-section">
            <el-button 
              v-if="countdown > 0"
              type="text" 
              class="countdown-btn"
              disabled
            >
              {{ countdown }}秒后可重新发送
            </el-button>
            <el-button 
              v-else
              type="text" 
              class="resend-btn"
              @click="resendCode"
            >
              重新发送验证码
            </el-button>
          </div>
        </el-form>
      </div>
      
      <div class="footer">
        <el-button 
          type="text" 
          class="back-to-login"
          @click="goToLogin"
        >
          ← 返回登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { forgotPassword, resetPassword } from '@/api/auth'

export default {
  name: 'MobileForgotPasswordView',
  
  created() {
    document.body.classList.add('mobile-view')
  },
  
  unmounted() {
    document.body.classList.remove('mobile-view')
  },
  
  data() {
    const validateIdentifier = (rule, value, callback) => {
      if (!value || value.trim().length === 0) {
        callback(new Error('请输入手机号或邮箱'))
      } else if (/^1[3-9]\d{9}$/.test(value)) {
        // 手机号格式正确
        callback()
      } else if (/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) {
        // 邮箱格式正确
        callback()
      } else {
        callback(new Error('请输入正确的手机号或邮箱'))
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
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (!value || value.length === 0) {
        callback(new Error('请确认密码'))
      } else if (value !== this.step2Form.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    return {
      step: 1,
      resetToken: '',
      countdown: 0,
      countdownTimer: null,
      step1Loading: false,
      step2Loading: false,
      passwordType: 'password',
      confirmPasswordType: 'password',
      step1Form: {
        identifier: ''
      },
      step2Form: {
        verificationCode: '',
        newPassword: '',
        confirmPassword: ''
      },
      step1Rules: {
        identifier: [{ required: true, trigger: 'blur', validator: validateIdentifier }]
      },
      step2Rules: {
        verificationCode: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { len: 6, message: '验证码长度为6位', trigger: 'blur' }
        ],
        newPassword: [{ required: true, trigger: 'blur', validator: validatePassword }],
        confirmPassword: [{ required: true, trigger: 'blur', validator: validateConfirmPassword }]
      }
    }
  },
  
  computed: {
    maskedIdentifier() {
      const identifier = this.step1Form.identifier
      if (/^1[3-9]\d{9}$/.test(identifier)) {
        // 手机号：显示前三位和后四位，中间用*号
        return identifier.substring(0, 3) + '****' + identifier.substring(7)
      } else if (/^[\w.-]+@[\w.-]+\.\w+$/.test(identifier)) {
        // 邮箱：显示前三位和@后面的部分，中间用*号
        const atIndex = identifier.indexOf('@')
        if (atIndex > 3) {
          return identifier.substring(0, 3) + '****' + identifier.substring(atIndex)
        } else {
          return identifier.substring(0, 1) + '****' + identifier.substring(atIndex)
        }
      }
      return identifier
    }
  },
  
  methods: {
    showPwd() {
      this.passwordType = this.passwordType === 'password' ? '' : 'password'
    },
    
    showConfirmPwd() {
      this.confirmPasswordType = this.confirmPasswordType === 'password' ? '' : 'password'
    },
    
    async handleStep1() {
      this.$refs.step1Form.validate(async valid => {
        if (valid) {
          this.step1Loading = true
          try {
            const response = await forgotPassword(this.step1Form.identifier)
            this.resetToken = response.password_reset_token
            this.$message.success('验证码已发送')
            this.step = 2
            this.startCountdown()
          } catch (error) {
            this.$message.error(error.message || '发送失败，请重试')
          } finally {
            this.step1Loading = false
          }
        } else {
          this.$message.warning('请检查输入信息')
          return false
        }
      })
    },
    
    async handleStep2() {
      this.$refs.step2Form.validate(async valid => {
        if (valid) {
          this.step2Loading = true
          try {
            await resetPassword({
              token: this.resetToken,
              code: this.step2Form.verificationCode,
              new_password: this.step2Form.newPassword
            })
            this.$message.success('🎉 密码重置成功！')
            setTimeout(() => {
              this.$router.push('/login')
            }, 1500)
          } catch (error) {
            this.$message.error(error.message || '重置失败，请重试')
          } finally {
            this.step2Loading = false
          }
        } else {
          this.$message.warning('请检查输入信息')
          return false
        }
      })
    },
    
    goToStep1() {
      this.step = 1
      this.step2Form.verificationCode = ''
      this.step2Form.newPassword = ''
      this.step2Form.confirmPassword = ''
      this.clearCountdown()
    },
    
    goToLogin() {
      this.$router.push('/login')
    },
    
    startCountdown() {
      this.countdown = 60
      this.countdownTimer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.clearCountdown()
        }
      }, 1000)
    },
    
    clearCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
      this.countdown = 0
    },
    
    async resendCode() {
      if (this.countdown > 0) return
      
      try {
        const response = await forgotPassword(this.step1Form.identifier)
        this.resetToken = response.password_reset_token
        this.$message.success('验证码已重新发送')
        this.startCountdown()
      } catch (error) {
        this.$message.error(error.message || '发送失败，请重试')
      }
    }
  },
  
  beforeUnmount() {
    this.clearCountdown()
  }
}
</script>

<style lang="scss" scoped>
.mobile-forgot-password-container {
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

.mobile-forgot-password-card {
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

.header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
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

.form-container {
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

.step-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  
  .info-text {
    margin: 0;
    font-size: 13px;
    color: #666;
    font-weight: 400;
  }
  
  .change-identifier-btn {
    padding: 0;
    font-size: 13px;
    color: #409eff;
    font-weight: 500;
    
    &:hover {
      color: #66b1ff;
    }
  }
  
  @media screen and (max-width: 375px) {
    padding: 10px 12px;
    
    .info-text {
      font-size: 12px;
    }
    
    .change-identifier-btn {
      font-size: 12px;
    }
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
    border-color: #ff6b6b;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
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
    color: #ff6b6b;
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

.submit-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 25px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  border: none;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3);
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

.resend-section {
  text-align: center;
  margin-top: 15px;
  
  .countdown-btn {
    color: #999;
    font-size: 13px;
    padding: 0;
  }
  
  .resend-btn {
    color: #ff6b6b;
    font-size: 13px;
    padding: 0;
    font-weight: 500;
    
    &:hover {
      color: #ff8787;
    }
  }
  
  @media screen and (max-width: 375px) {
    margin-top: 12px;
    
    .countdown-btn,
    .resend-btn {
      font-size: 12px;
    }
  }
}

.footer {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  
  .back-to-login {
    color: #ff6b6b;
    font-size: 14px;
    padding: 0;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      color: #ff8787;
      transform: translateX(-3px);
    }
  }
  
  @media screen and (max-width: 768px) {
    margin-top: auto;
  }
  
  @media screen and (max-width: 375px) {
    padding: 15px;
    
    .back-to-login {
      font-size: 13px;
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
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
  
  &:active {
    background: rgba(255, 107, 107, 0.2);
  }
}

.password-toggle {
  font-size: 16px;
  transition: color 0.3s ease;
  display: inline-block;
  
  &:hover {
    color: #ff6b6b;
    transform: scale(1.1);
  }
}
</style>