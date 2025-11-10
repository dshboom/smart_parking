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

    <el-card class="vehicles-card" shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div class="clearfix"><span>我的车辆</span></div>
      </template>

      <div class="add-vehicle">
        <el-input v-model="newVehicle.license_plate" placeholder="车牌号" style="width: 200px; margin-right: 10px;" />
        <el-input v-model="newVehicle.brand" placeholder="品牌" style="width: 160px; margin-right: 10px;" />
        <el-input v-model="newVehicle.model" placeholder="型号" style="width: 160px; margin-right: 10px;" />
        <el-input v-model="newVehicle.color" placeholder="颜色" style="width: 160px; margin-right: 10px;" />
        <el-button type="primary" @click="addVehicle" v-permission="'user:vehicle:add'">添加</el-button>
      </div>

      <el-table :data="vehicles" style="width: 100%; margin-top: 16px;" v-loading="loading.vehicles">
        <el-table-column prop="license_plate" label="车牌号" width="160" />
        <el-table-column prop="brand" label="品牌" width="160" />
        <el-table-column prop="model" label="型号" width="160" />
        <el-table-column prop="color" label="颜色" width="160" />
        <el-table-column label="创建时间">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="scope">
            <el-button type="danger" size="mini" @click="removeVehicle(scope.row.license_plate)" v-permission="'user:vehicle:delete'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
  </template>

<script>
import { mapState } from 'vuex'
import { ElMessage } from 'element-plus'
import { getInfo, getMyVehicles, addMyVehicle, removeMyVehicle } from '@/api/user'

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
      newVehicle: {
        license_plate: '',
        brand: '',
        model: '',
        color: ''
      },
      vehicles: [],
      loading: {
        profile: false,
        vehicles: false
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
    this.loadVehicles()
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
    async loadVehicles() {
      this.loading.vehicles = true
      try {
        this.vehicles = await getMyVehicles()
      } catch (e) {
        ElMessage.error('加载车辆失败')
      } finally {
        this.loading.vehicles = false
      }
    },
    async addVehicle() {
      if (!this.newVehicle.license_plate) {
        ElMessage.warning('请输入车牌号')
        return
      }
      try {
        await addMyVehicle({ ...this.newVehicle })
        ElMessage.success('添加成功')
        this.newVehicle = { license_plate: '', brand: '', model: '', color: '' }
        await this.loadVehicles()
      } catch (e) {
        ElMessage.error((e && e.message) || '添加失败')
      }
    },
    async removeVehicle(licensePlate) {
      try {
        await removeMyVehicle(licensePlate)
        ElMessage.success('删除成功')
        await this.loadVehicles()
      } catch (e) {
        ElMessage.error('删除失败')
      }
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
.profile-card, .vehicles-card {
  max-width: 980px;
  margin: 0 auto;
}
.add-vehicle {
  display: flex;
  align-items: center;
}
</style>