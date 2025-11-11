<template>
  <div class="account-profile">
    <el-card class="profile-card" shadow="hover">
      <template #header>
        <div class="clearfix"><span>个人信息</span></div>
      </template>
      <el-form :model="profile" label-width="100px" @submit.native.prevent>
        <el-form-item label="用户名">
          <el-input v-model="profile.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :value="profile.phone" disabled />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProfile" v-permission="'user:profile:edit'">保存</el-button>
          <el-button @click="resetProfile">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

  </div>
  </template>

<script>
import { mapState } from 'vuex'
import { ElMessage } from 'element-plus'
import { getInfo } from '@/api/user'

export default {
  name: 'AccountProfileView',
  data() {
    return {
      profile: {
        username: '',
        phone: ''
      },
      originalProfile: {
        username: '',
        phone: ''
      },
      loading: {
        profile: false
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
    async loadProfile() {
      this.loading.profile = true
      try {
        const info = await getInfo()
        this.profile.username = info.username
        this.profile.phone = info.phone
        this.originalProfile = { ...this.profile }
        this.$store.commit('user/SET_NAME', info.username)
      } catch (e) {
        ElMessage.error('加载个人信息失败')
      } finally {
        this.loading.profile = false
      }
    },
    async saveProfile() {
      try {
        const data = { username: this.profile.username }
        const updated = await this.$store.dispatch('user/updateProfile', data)
        this.profile.username = updated.username
        this.originalProfile.username = updated.username
        ElMessage.success('保存成功')
      } catch (e) {
        ElMessage.error('保存失败')
      }
    },
    resetProfile() {
      this.profile = { ...this.originalProfile }
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
}
.profile-card {
  max-width: 980px;
  margin: 0 auto;
}
</style>