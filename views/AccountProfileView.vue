<template>
  <div class="account-profile">
    <!-- 个人信息卡片 -->
    <el-card class="profile-card" shadow="hover" v-loading="loading.profile">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
          <el-tag :type="getRoleType(profile.role)" size="small">{{ profile.role }}</el-tag>
        </div>
      </template>
      <el-form :model="profile" label-width="100px" @submit.native.prevent>
        <el-form-item label="用户名">
          <el-input v-model="profile.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :value="profile.phone" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="profile.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="profile.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-input :value="formatDate(profile.created_at)" disabled />
        </el-form-item>
        <el-form-item label="最后登录">
          <el-input :value="formatDate(profile.last_login_at)" disabled />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProfile" :loading="loading.save">保存</el-button>
          <el-button @click="resetProfile">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 密码修改卡片 -->
    <el-card class="password-card" shadow="hover" v-loading="loading.password">
      <template #header>
        <span>修改密码</span>
      </template>
      <el-form :model="passwordForm" label-width="100px" @submit.native.prevent
               :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="当前密码" prop="current_password">
          <el-input type="password" v-model="passwordForm.current_password" placeholder="请输入当前密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input type="password" v-model="passwordForm.new_password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input type="password" v-model="passwordForm.confirm_password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword" :loading="loading.password">修改密码</el-button>
          <el-button @click="resetPasswordForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ElMessage } from 'element-plus'
import { getInfo, updateMe, changePassword } from '@/api/user'

export default {
  name: 'AccountProfileView',
  data() {
    return {
      profile: {
        username: '',
        phone: '',
        email: '',
        nickname: '',
        role: '',
        created_at: '',
        last_login_at: ''
      },
      originalProfile: {
        username: '',
        phone: '',
        email: '',
        nickname: '',
        role: '',
        created_at: '',
        last_login_at: ''
      },
      passwordForm: {
        current_password: '',
        new_password: '',
        confirm_password: ''
      },
      loading: {
        profile: false,
        save: false,
        password: false
      },
      passwordRules: {
        current_password: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 8, message: '密码长度至少8位', trigger: 'blur' }
        ],
        confirm_password: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: this.validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapState({
      name: state => state.user.name
    })
  },
  created() {
    this.loadProfile()
  },
  methods: {
    // 获取角色标签类型
    getRoleType(role) {
      const roleMap = {
        'admin': 'danger',
        'user': 'info',
        'guest': 'warning'
      }
      return roleMap[role] || 'info'
    },
    
    // 验证确认密码
    validateConfirmPassword(rule, value, callback) {
      if (value !== this.passwordForm.new_password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    },
    
    async loadProfile() {
      this.loading.profile = true
      try {
        const response = await getInfo()
        const info = response.data
        this.profile = {
          username: info.username,
          phone: info.phone,
          email: info.email,
          nickname: info.nickname,
          role: info.role,
          created_at: info.created_at,
          last_login_at: info.last_login_at
        }
        this.originalProfile = { ...this.profile }
        this.$store.commit('user/SET_NAME', info.username)
      } catch (e) {
        ElMessage.error('加载个人信息失败: ' + (e.message || '未知错误'))
      } finally {
        this.loading.profile = false
      }
    },
    
    async saveProfile() {
      this.loading.save = true
      try {
        const data = {
          username: this.profile.username,
          email: this.profile.email,
          nickname: this.profile.nickname
        }
        const response = await updateMe(data)
        const updated = response.data
        
        this.profile.username = updated.username
        this.profile.email = updated.email
        this.profile.nickname = updated.nickname
        this.originalProfile = { ...this.profile }
        
        this.$store.commit('user/SET_NAME', updated.username)
        ElMessage.success('个人信息保存成功')
      } catch (e) {
        ElMessage.error('保存失败: ' + (e.message || '未知错误'))
      } finally {
        this.loading.save = false
      }
    },
    
    resetProfile() {
      this.profile = { ...this.originalProfile }
    },
    
    async changePassword() {
      if (this.passwordForm.confirm_password !== this.passwordForm.new_password) {
        ElMessage.error('两次输入的密码不一致')
        return
      }
      this.$refs.passwordFormRef.validate(async (valid) => {
        if (!valid) return
        
        this.loading.password = true
        try {
          await changePassword({
            current_password: this.passwordForm.current_password,
            new_password: this.passwordForm.new_password
          })
          
          ElMessage.success('密码修改成功')
          this.resetPasswordForm()
        } catch (e) {
          ElMessage.error('密码修改失败: ' + (e.message || '未知错误'))
        } finally {
          this.loading.password = false
        }
      })
    },
    
    resetPasswordForm() {
      this.passwordForm = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
      this.$refs.passwordFormRef.clearValidate()
    },
    
    formatDate(ts) {
      if (!ts) return '-'
      const d = new Date(ts)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const da = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${y}-${m}-${da} ${hh}:${mm}`
    }
  }
}
</script>

<style scoped>
.account-profile {
  padding: 20px;
  max-width: 980px;
  margin: 0 auto;
}

.profile-card, .password-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input {
  max-width: 400px;
}
</style>