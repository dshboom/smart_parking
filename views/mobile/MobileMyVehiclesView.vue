<template>
  <div class="mobile-container">
    <div class="mobile-card">
      <div class="mobile-card-header">
        <h2>我的车辆</h2>
      </div>
      <div class="mobile-card-body">
        <div class="vehicle-form">
          <input v-model="newVehicle.license_plate" class="mobile-input" placeholder="车牌号" />
          <input v-model="newVehicle.brand" class="mobile-input" placeholder="品牌" />
          <input v-model="newVehicle.model" class="mobile-input" placeholder="型号" />
          <input v-model="newVehicle.color" class="mobile-input" placeholder="颜色" />
          <button class="mobile-button" @click="addVehicle">添加车辆</button>
        </div>
        <div class="vehicle-list">
          <div v-for="item in vehicles" :key="item.id" class="vehicle-item">
            <div class="vehicle-meta">
              <div class="plate">{{ item.license_plate }}</div>
              <div class="detail">{{ item.brand || '-' }} / {{ item.model || '-' }} / {{ item.color || '-' }}</div>
              <div class="time">{{ formatDate(item.created_at) }}</div>
            </div>
            <button class="mobile-button danger" @click="removeVehicle(item.license_plate)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { getMyVehicles, addMyVehicle, removeMyVehicle } from '@/api/user'

export default {
  name: 'MobileMyVehiclesView',
  data() {
    return {
      vehicles: [],
      newVehicle: {
        license_plate: '',
        brand: '',
        model: '',
        color: ''
      }
    }
  },
  created() {
    this.loadVehicles()
  },
  methods: {
    async loadVehicles() {
      try {
        this.vehicles = await getMyVehicles()
      } catch (e) {
        ElMessage.error('加载车辆失败')
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
        ElMessage.error('添加失败')
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
.mobile-container {
  padding: 16px;
}
.mobile-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.mobile-card-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.mobile-card-body {
  padding: 16px;
}
.vehicle-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.mobile-input {
  appearance: none;
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  outline: none;
}
.mobile-button {
  height: 40px;
  background: #409EFF;
  color: #fff;
  border: none;
  border-radius: 8px;
}
.mobile-button.danger { background: #f56c6c; }
.vehicle-list { margin-top: 16px; }
.vehicle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 10px;
}
.vehicle-meta .plate { font-weight: 600; font-size: 16px; }
.vehicle-meta .detail { color: #666; margin-top: 4px; }
.vehicle-meta .time { color: #999; font-size: 12px; margin-top: 4px; }
</style>