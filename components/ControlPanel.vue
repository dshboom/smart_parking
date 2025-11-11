<template>
  <div class="controls-panel">
    <el-card class="control-card">
      <template #header>
        <div class="card-header">
          <span>停车场控制面板</span>
          <el-button-group>
            <el-button 
              v-if="!readOnly"
              :type="editMode ? 'danger' : 'primary'" 
              size="small"
              @click="toggleEditMode"
            >
              {{ editMode ? '退出编辑' : '编辑模式' }}
            </el-button>
            <el-button type="success" size="small" @click="findNearestEmptySpot">
              导航到最近空位
            </el-button>
            <el-button v-if="!readOnly" type="warning" size="small" @click="resetLayout">
              重置布局
            </el-button>
          </el-button-group>
        </div>
      </template>

      <div class="controls-content">
        <div v-if="editMode && !readOnly" class="edit-tools">
          <h4>编辑工具</h4>
          <el-radio-group :modelValue="selectedTool" @update:modelValue="$emit('update:selectedTool', $event)" size="small">
            <el-radio-button label="parking">停车位</el-radio-button>
            <el-radio-button label="wall">墙壁</el-radio-button>
            <el-radio-button label="road">道路</el-radio-button>
            <el-radio-button label="entrance">入口</el-radio-button>
            <el-radio-button label="exit">出口</el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="editMode && selectedSpot && !readOnly" class="edit-attributes">
          <h4>车位属性</h4>
          <el-form label-width="90px" size="small">
            <el-form-item label="车位类型">
              <el-select :modelValue="selectedSpot.space_type" @update:modelValue="$emit('update:selectedSpot', { ...selectedSpot, space_type: $event })" style="width: 160px">
                <el-option label="普通" value="standard" />
                <el-option label="残疾人" value="disabled" />
              </el-select>
            </el-form-item>
            <el-form-item label="维护停用">
              <el-switch :modelValue="selectedSpot.is_under_maintenance" @update:modelValue="$emit('update:selectedSpot', { ...selectedSpot, is_under_maintenance: $event })" />
            </el-form-item>
            <el-form-item label="预约状态">
              <el-tag :type="selectedSpot.is_reserved ? 'warning' : 'success'">
                {{ selectedSpot.is_reserved ? '已预约' : '未预约' }}
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSelectedSpotAttributes">保存</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="info-panel">
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
        </div>

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
  name: 'ControlPanel',
  props: {
    readOnly: Boolean,
    editMode: Boolean,
    selectedTool: String,
    selectedSpot: Object,
    stats: Object,
    path: Array
  },
  emits: ['update:editMode', 'update:selectedTool', 'update:selectedSpot', 'find-nearest-empty-spot', 'reset-layout', 'save-selected-spot-attributes'],
  setup(props, { emit }) {
    const toggleEditMode = () => {
      emit('update:editMode', !props.editMode)
    }

    const findNearestEmptySpot = () => {
      emit('find-nearest-empty-spot')
    }

    const resetLayout = () => {
      emit('reset-layout')
    }

    const saveSelectedSpotAttributes = () => {
      emit('save-selected-spot-attributes')
    }

    return {
      toggleEditMode,
      findNearestEmptySpot,
      resetLayout,
      saveSelectedSpotAttributes
    }
  }
}
</script>

<style scoped>
.control-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-tools, .edit-attributes {
  margin-bottom: 15px;
}

.info-panel .stat-item {
  text-align: center;
}

.info-panel .stat-label {
  font-size: 14px;
  color: #606266;
}

.info-panel .stat-value {
  font-size: 24px;
  font-weight: bold;
}

.info-panel .occupied {
  color: #f56c6c;
}

.info-panel .available {
  color: #67c23a;
}

.path-info {
  margin-top: 15px;
}
</style>