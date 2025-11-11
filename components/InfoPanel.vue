<template>
  <div class="info-panel">
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>停车场信息</span>
        </div>
      </template>
      <div class="info-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-label">总停车位</div>
              <div class="stat-value">{{ stats.total_spaces }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-label">已占用</div>
              <div class="stat-value occupied">{{ stats.occupied_spaces }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-label">可用</div>
              <div class="stat-value available">{{ stats.available_spaces }}</div>
            </div>
          </el-col>
        </el-row>

        <div v-if="path.length > 0" class="path-info">
          <el-alert
            :title="`找到路径！距离: ${path.length - 1} 步，预计时间: ${(path.length - 1) * 30} 秒`"
            type="success"
            :closable="false"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'InfoPanel',
  props: {
    stats: {
      type: Object,
      required: true,
      default: () => ({ total_spaces: 0, occupied_spaces: 0, available_spaces: 0 })
    },
    path: {
      type: Array,
      required: true,
      default: () => []
    }
  }
}
</script>

<style scoped>
.info-panel {
  margin-top: 20px;
}

.info-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.occupied {
  color: #f56c6c;
}

.stat-value.available {
  color: #67c23a;
}

.path-info {
  margin-top: 20px;
}
</style>