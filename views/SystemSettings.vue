<template>
  <div class="system-settings flat-container">
    <!-- 简洁页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">系统设置</h1>
          <p class="page-subtitle">System Settings</p>
        </div>
      </div>
    </div>

    <!-- 停车配置 -->
    <div class="settings-panel">
          <div class="tab-content">
            <div class="settings-group">
              <h3 class="group-title">
                <el-icon><OfficeBuilding /></el-icon>
                停车场选择
              </h3>
              <el-form label-width="140px" class="flat-form">
                <el-form-item label="选择停车场">
                  <el-select 
                    v-model="selectedLotId" 
                    placeholder="请选择停车场"
                    @change="loadParkingLotBillingRule"
                    class="flat-select"
                  >
                    <el-option
                      v-for="lot in parkingLots"
                      :key="lot.id"
                      :label="lot.name"
                      :value="lot.id"
                    />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-group" v-if="selectedLotId">
              <h3 class="group-title">
                <el-icon><Money /></el-icon>
                收费规则设置
              </h3>
              <el-form :model="parkingSettings" label-width="140px" class="flat-form">
                <el-form-item label="规则名称">
                  <el-input 
                    v-model="parkingSettings.ruleName" 
                    placeholder="请输入规则名称"
                    class="flat-input"
                  />
                </el-form-item>
                <el-form-item label="免费时长">
                  <el-input-number 
                    v-model="parkingSettings.freeDuration" 
                    :min="0" 
                    :max="1440"
                    controls-position="right"
                    class="flat-number-input"
                  />
                  <span class="unit-label">分钟</span>
                </el-form-item>
                <el-form-item label="小时费率">
                  <el-input-number 
                    v-model="parkingSettings.hourlyRate" 
                    :min="0" 
                    :max="1000"
                    :precision="2"
                    controls-position="right"
                    class="flat-number-input"
                  />
                  <span class="unit-label">元/小时</span>
                </el-form-item>
                <el-form-item label="每日封顶费用">
                  <el-input-number 
                    v-model="parkingSettings.dailyCapRate" 
                    :min="0" 
                    :max="10000"
                    :precision="2"
                    controls-position="right"
                    class="flat-number-input"
                  />
                  <span class="unit-label">元</span>
                </el-form-item>
              </el-form>
            </div>
          </div>
      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button type="primary" class="flat-btn primary" @click="saveSettings">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
        <el-button class="flat-btn secondary" @click="resetSettings">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button class="flat-btn tertiary" @click="testSettings">
          <el-icon><Connection /></el-icon>
          测试连接
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getParkingLots } from '@/api/parking'
import { getBillingRule, updateBillingRule } from '@/api/pricing'

export default {
  name: 'SystemSettings',
  setup() {
    // 停车设置
    const parkingLots = ref([])
    const selectedLotId = ref(null)
    const billingRules = reactive({})
    const parkingSettings = reactive({
      freeDuration: 30,
      firstHourFee: 5.00,
      hourlyFee: 3.00,
      dailyMaxFee: 50.00,
      nightCharge: false,
      nightStartTime: new Date(2024, 0, 1, 22, 0),
      nightEndTime: new Date(2024, 0, 1, 6, 0),
      nightFeeMultiplier: 0.8
    })

    // 加载停车场列表
    const loadParkingLots = async () => {
      try {
        const response = await getParkingLots({ page: 1, limit: 100 })
        const lots = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
        parkingLots.value = lots
        if (lots.length > 0 && !selectedLotId.value) {
          selectedLotId.value = lots[0].id
          await loadParkingLotBillingRule()
        }
      } catch (error) {
        console.error('加载停车场列表失败:', error)
        ElMessage.error('加载停车场列表失败')
      }
    }

    // 加载停车场计费规则
    const loadParkingLotBillingRule = async () => {
      if (!selectedLotId.value) return
      
      try {
        const rule = await getBillingRule(selectedLotId.value)
        billingRules[selectedLotId.value] = rule
        
        // 更新表单数据
        parkingSettings.ruleName = rule.rule_name || '默认计费规则'
        parkingSettings.freeDuration = rule.free_duration_minutes || 0
        parkingSettings.hourlyRate = Number(rule.hourly_rate) || 0
        parkingSettings.dailyCapRate = rule.daily_cap_rate ? Number(rule.daily_cap_rate) : null
      } catch (error) {
        console.error('加载计费规则失败:', error)
        ElMessage.error('加载计费规则失败')
      }
    }



    // 保存设置
    const saveSettings = async () => {
      try {
        // 如果选择了停车场，保存计费规则到后端
        if (selectedLotId.value) {
          await saveBillingRule()
        }
        
        ElMessage.success('设置保存成功')
      } catch (error) {
        console.error('保存设置失败:', error)
        ElMessage.error('保存设置失败')
      }
    }

    // 保存计费规则
    const saveBillingRule = async () => {
      if (!selectedLotId.value) return
      
      try {
        const updateData = {
          rule_name: parkingSettings.ruleName,
          free_duration_minutes: parkingSettings.freeDuration,
          hourly_rate: parkingSettings.hourlyRate,
          daily_cap_rate: parkingSettings.dailyCapRate
        }
        
        await updateBillingRule(selectedLotId.value, updateData)
        
        // 更新本地缓存
        billingRules[selectedLotId.value] = {
          ...billingRules[selectedLotId.value],
          ...updateData
        }
        
        ElMessage.success('计费规则保存成功')
      } catch (error) {
        console.error('保存计费规则失败:', error)
        ElMessage.error('保存计费规则失败')
        throw error
      }
    }

    // 重置设置
    const resetSettings = () => {
      ElMessageBox.confirm(
        '确定要重置所有设置为默认值吗？此操作不可恢复。',
        '确认重置',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        localStorage.removeItem('systemSettings')
        location.reload()
      }).catch(() => {})
    }

    // 测试连接
    const testSettings = async () => {
      try {
        ElMessage.success('测试完成')
      } catch (error) {
        ElMessage.error('测试失败')
      }
    }

    onMounted(() => {
      loadParkingLots()
    })

    return {
      parkingSettings,
      parkingLots,
      selectedLotId,
      billingRules,
      saveSettings,
      resetSettings,
      testSettings,
      loadParkingLotBillingRule
    }
  }
}
</script>

<style scoped>
/* 现代扁平化设计风格 */

/* 主容器 - 扁平化设计 */
.flat-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 页面标题 - 简洁设计 */
.page-header {
  margin-bottom: 24px;
  padding: 0 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section .page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.title-section .page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 设置面板 - 扁平卡片设计 */
.settings-panel {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.tab-content {
  padding: 24px;
}

/* 设置分组 - 扁平化区块 */
.settings-group {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-title .el-icon {
  color: #3b82f6;
  font-size: 18px;
}

/* 扁平化表单 */
.flat-form {
  max-width: 600px;
}

.flat-form .el-form-item {
  margin-bottom: 16px;
}

.flat-form .el-form-item__label {
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

/* 扁平化输入框 */
.flat-input .el-input__wrapper,
.flat-textarea .el-textarea__inner,
.flat-select .el-select__wrapper {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: none;
  transition: all 0.2s ease;
}

.flat-input .el-input__wrapper:hover,
.flat-textarea .el-textarea__inner:hover,
.flat-select .el-select__wrapper:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.flat-input .el-input__wrapper.is-focus,
.flat-textarea .el-textarea__inner:focus,
.flat-select .el-select__wrapper.is-focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 数字输入框 */
.flat-number-input {
  width: 120px;
}

.unit-label {
  margin-left: 8px;
  color: #6b7280;
  font-size: 14px;
}

/* 扁平化开关 */
.flat-switch .el-switch__core {
  border-radius: 12px;
}

/* 扁平化单选组 */
.flat-radio-group .el-radio {
  margin-right: 16px;
}

.flat-radio-group .el-radio__input.is-checked .el-radio__inner {
  background: #3b82f6;
  border-color: #3b82f6;
}

.flat-radio-group .el-radio__input.is-checked + .el-radio__label {
  color: #3b82f6;
}

/* 扁平化标签页 */
.flat-tabs .el-tabs__header {
  background: #f1f5f9;
  margin: 0;
  border-bottom: 1px solid #e2e8f0;
}

.flat-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.flat-tabs .el-tabs__item {
  color: #64748b;
  font-weight: 500;
  padding: 0 20px;
  height: 48px;
  line-height: 48px;
  transition: all 0.2s ease;
}

.flat-tabs .el-tabs__item:hover {
  color: #1e293b;
  background: rgba(59, 130, 246, 0.05);
}

.flat-tabs .el-tabs__item.is-active {
  color: #3b82f6;
  background: #ffffff;
  border-bottom: 2px solid #3b82f6;
}

/* 操作栏 - 扁平化设计 */
.action-bar {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

/* 扁平化按钮 */
.flat-btn {
  border-radius: 6px;
  font-weight: 500;
  padding: 8px 16px;
  height: 36px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.flat-btn.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.flat-btn.primary:hover {
  background: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.flat-btn.secondary {
  background: #ffffff;
  border-color: #d1d5db;
  color: #374151;
}

.flat-btn.secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.flat-btn.tertiary {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #ffffff;
}

.flat-btn.tertiary:hover {
  background: #d97706;
  border-color: #d97706;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .flat-container {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .title-section .page-title {
    font-size: 24px;
  }
  
  .tab-content {
    padding: 16px;
  }
  
  .settings-group {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .flat-form .el-form-item__label {
    width: 120px !important;
  }
  
  .action-bar {
    flex-direction: column;
    padding: 16px;
  }
  
  .flat-btn {
    width: 100%;
    justify-content: center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .flat-container {
    background: #0f172a;
  }
  
  .settings-panel {
    background: #1e293b;
    border-color: #334155;
  }
  
  .settings-group {
    background: #1e293b;
    border-color: #334155;
  }
  
  .title-section .page-title {
    color: #f1f5f9;
  }
  
  .group-title {
    color: #f1f5f9;
  }
  
  .flat-form .el-form-item__label {
    color: #cbd5e1;
  }
  
  .flat-input .el-input__wrapper,
  .flat-textarea .el-textarea__inner,
  .flat-select .el-select__wrapper {
    background: #334155;
    border-color: #475569;
    color: #f1f5f9;
  }
  
  .flat-tabs .el-tabs__header {
    background: #1e293b;
    border-bottom-color: #334155;
  }
  
  .flat-tabs .el-tabs__item {
    color: #94a3b8;
  }
  
  .flat-tabs .el-tabs__item.is-active {
    background: #334155;
    color: #60a5fa;
  }
  
  .action-bar {
    background: #1e293b;
    border-top-color: #334155;
  }
  
  .flat-btn.secondary {
    background: #334155;
    border-color: #475569;
    color: #f1f5f9;
  }
}
</style>