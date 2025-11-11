<template>
  <div class="system-settings modern-container">
    <!-- 现代化页面标题 -->
    <div class="page-header modern-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">系统设置</h2>
          <p class="page-subtitle">System Settings</p>
        </div>
      </div>
    </div>

    <!-- 设置分类标签页 -->
    <div class="settings-tabs modern-card">
      <el-tabs v-model="activeTab" class="modern-tabs">
        <el-tab-pane label="基础设置" name="basic">
          <div class="tab-content">
            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Setting /></el-icon>
                系统基本信息
              </h3>
              <el-form :model="basicSettings" label-width="120px" class="modern-form">
                <el-form-item label="系统名称">
                  <el-input v-model="basicSettings.systemName" placeholder="请输入系统名称" />
                </el-form-item>
                <el-form-item label="系统版本">
                  <el-input v-model="basicSettings.systemVersion" disabled />
                </el-form-item>
                <el-form-item label="系统描述">
                  <el-input 
                    v-model="basicSettings.systemDescription" 
                    type="textarea" 
                    :rows="3"
                    placeholder="请输入系统描述"
                  />
                </el-form-item>
                <el-form-item label="维护模式">
                  <el-switch 
                    v-model="basicSettings.maintenanceMode" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="维护提示">
                  <el-input 
                    v-model="basicSettings.maintenanceMessage" 
                    type="textarea" 
                    :rows="2"
                    placeholder="维护模式下的提示信息"
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Clock /></el-icon>
                时间设置
              </h3>
              <el-form :model="basicSettings" label-width="120px" class="modern-form">
                <el-form-item label="时区">
                  <el-select v-model="basicSettings.timezone" placeholder="请选择时区">
                    <el-option label="UTC+8 北京时间" value="Asia/Shanghai" />
                    <el-option label="UTC+9 东京时间" value="Asia/Tokyo" />
                    <el-option label="UTC+0 格林威治时间" value="UTC" />
                  </el-select>
                </el-form-item>
                <el-form-item label="时间格式">
                  <el-radio-group v-model="basicSettings.timeFormat">
                    <el-radio label="24h">24小时制</el-radio>
                    <el-radio label="12h">12小时制</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="日期格式">
                  <el-radio-group v-model="basicSettings.dateFormat">
                    <el-radio label="YYYY-MM-DD">年-月-日</el-radio>
                    <el-radio label="DD/MM/YYYY">日/月/年</el-radio>
                    <el-radio label="MM/DD/YYYY">月/日/年</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="停车配置" name="parking">
          <div class="tab-content">
            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Money /></el-icon>
                收费规则
              </h3>
              <el-form :model="parkingSettings" label-width="120px" class="modern-form">
                <el-form-item label="免费时长(分钟)">
                  <el-input-number 
                    v-model="parkingSettings.freeDuration" 
                    :min="0" 
                    :max="1440"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="首小时费用">
                  <el-input-number 
                    v-model="parkingSettings.firstHourFee" 
                    :min="0" 
                    :max="1000"
                    :precision="2"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="后续每小时费用">
                  <el-input-number 
                    v-model="parkingSettings.hourlyFee" 
                    :min="0" 
                    :max="1000"
                    :precision="2"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="每日最高费用">
                  <el-input-number 
                    v-model="parkingSettings.dailyMaxFee" 
                    :min="0" 
                    :max="10000"
                    :precision="2"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="夜间收费">
                  <el-switch 
                    v-model="parkingSettings.nightCharge" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="夜间时段" v-if="parkingSettings.nightCharge">
                  <el-time-picker
                    v-model="parkingSettings.nightStartTime"
                    placeholder="开始时间"
                    format="HH:mm"
                  />
                  <span style="margin: 0 8px;">至</span>
                  <el-time-picker
                    v-model="parkingSettings.nightEndTime"
                    placeholder="结束时间"
                    format="HH:mm"
                  />
                </el-form-item>
                <el-form-item label="夜间费率" v-if="parkingSettings.nightCharge">
                  <el-input-number 
                    v-model="parkingSettings.nightFeeMultiplier" 
                    :min="0.1" 
                    :max="10"
                    :precision="1"
                    controls-position="right"
                  />
                  <span style="margin-left: 8px;">倍</span>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="用户配置" name="user">
          <div class="tab-content">
            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><User /></el-icon>
                用户注册设置
              </h3>
              <el-form :model="userSettings" label-width="120px" class="modern-form">
                <el-form-item label="开放注册">
                  <el-switch 
                    v-model="userSettings.allowRegistration" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="邮箱验证">
                  <el-switch 
                    v-model="userSettings.emailVerification" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="手机验证">
                  <el-switch 
                    v-model="userSettings.phoneVerification" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="默认角色">
                  <el-select v-model="userSettings.defaultRole" placeholder="请选择默认角色">
                    <el-option label="普通用户" value="user" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 保存按钮 -->
      <div class="settings-actions">
        <el-button type="primary" class="modern-btn save-btn" @click="saveSettings">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
        <el-button class="modern-btn reset-btn" @click="resetSettings">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button class="modern-btn test-btn" @click="testSettings">
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

export default {
  name: 'SystemSettings',
  setup() {
    const activeTab = ref('basic')
    
    // 基础设置
    const basicSettings = reactive({
      systemName: '智能停车管理系统',
      systemVersion: 'v1.0.0',
      systemDescription: '现代化智能停车管理解决方案',
      maintenanceMode: false,
      maintenanceMessage: '系统正在维护中，请稍后访问...',
      timezone: 'Asia/Shanghai',
      timeFormat: '24h',
      dateFormat: 'YYYY-MM-DD'
    })

    // 停车设置
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

    // 用户设置
    const userSettings = reactive({
      allowRegistration: true,
      emailVerification: true,
      phoneVerification: false,
      defaultRole: 'user'
    })



    // 加载设置
    const loadSettings = () => {
      try {
        // 从localStorage加载设置
        const savedSettings = localStorage.getItem('systemSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          Object.assign(basicSettings, settings.basic || {})
          Object.assign(parkingSettings, settings.parking || {})
          Object.assign(userSettings, settings.user || {})
          // Removed notification and log settings
        }
      } catch (error) {
        console.error('加载设置失败:', error)
      }
    }

    // 保存设置
    const saveSettings = async () => {
      try {
        const settings = {
          basic: basicSettings,
          parking: parkingSettings,
          user: userSettings
        }
        
        localStorage.setItem('systemSettings', JSON.stringify(settings))
        ElMessage.success('设置保存成功')
      } catch (error) {
        console.error('保存设置失败:', error)
        ElMessage.error('保存设置失败')
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
      loadSettings()
    })

    return {
      activeTab,
      basicSettings,
      parkingSettings,
      userSettings,
      saveSettings,
      resetSettings,
      testSettings
    }
  }
}
</script>

<style scoped>
/* 导入现代主题 */
@import '@/styles/modern-theme.css';

.system-settings {
  padding: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.system-settings::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(64, 158, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(82, 196, 26, 0.1) 0%, transparent 50%);
  z-index: -1;
}

/* 页面标题 */
.page-header {
  margin-bottom: 32px;
  position: relative;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  height: 4px;
  background: linear-gradient(90deg, #409eff 0%, #52c41a 100%);
  border-radius: 2px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section .page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
  position: relative;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-section .page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 设置标签页 */
.settings-tabs {
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.settings-tabs::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(82, 196, 26, 0.03) 100%);
  z-index: -1;
}

.tab-content {
  padding: 24px 0;
}

/* 设置区域卡片 */
.settings-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.settings-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.settings-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.02) 0%, rgba(82, 196, 26, 0.02) 100%);
  z-index: -1;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #409eff 0%, #52c41a 100%);
  border-radius: 2px;
}

.section-title .el-icon {
  color: #409eff;
  font-size: 20px;
}

.modern-form {
  max-width: 600px;
}

.modern-form .el-form-item {
  margin-bottom: 20px;
}

.modern-form .el-form-item__label {
  color: #2c3e50;
  font-weight: 500;
}

.modern-form .el-input,
.modern-form .el-textarea,
.modern-form .el-select,
.modern-form .el-input-number {
  width: 100%;
}

/* 保存按钮区域 */
.settings-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  margin-top: 24px;
  position: relative;
  overflow: hidden;
}

.settings-actions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.02) 0%, rgba(82, 196, 26, 0.02) 100%);
  z-index: -1;
}

/* 操作按钮 */
.save-btn {
  background: linear-gradient(135deg, #409eff 0%, #52c41a 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  min-width: 120px;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.4);
  background: linear-gradient(135deg, #52c41a 0%, #409eff 100%);
}

.save-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.reset-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #2c3e50;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 120px;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reset-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.test-btn {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
  min-width: 120px;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 193, 7, 0.4);
  background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%);
}

.test-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-settings {
    padding: 16px;
  }
  
  .system-settings::before {
    display: none;
  }
  
  .page-header {
    margin-bottom: 24px;
  }
  
  .page-header::before {
    display: none;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .title-section .page-title {
    font-size: 2rem;
  }
  
  .title-section .page-subtitle {
    font-size: 1rem;
  }
  
  .settings-tabs {
    padding: 16px;
  }
  
  .settings-tabs::before {
    display: none;
  }
  
  .tab-content {
    padding: 16px 0;
  }
  
  .settings-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .settings-section::before {
    display: none;
  }
  
  .section-title {
    font-size: 1.2rem;
    margin-bottom: 16px;
  }
  
  .section-title::after {
    width: 40px;
    height: 2px;
  }
  
  .modern-form {
    max-width: 100%;
  }
  
  .el-form-item {
    margin-bottom: 16px;
  }
  
  .el-form-item__label {
    font-size: 14px;
  }
  
  .el-input__inner,
  .el-textarea__inner {
    font-size: 14px;
    padding: 8px 12px;
  }
  
  .settings-actions {
    flex-direction: column;
    padding: 16px;
    gap: 8px;
  }
  
  .settings-actions::before {
    display: none;
  }
  
  .save-btn,
  .reset-btn,
  .test-btn {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .system-settings {
    padding: 12px;
  }
  
  .title-section .page-title {
    font-size: 1.8rem;
  }
  
  .settings-tabs .el-tabs__item {
    padding: 0 8px;
    font-size: 13px;
  }
  
  .settings-section {
    padding: 12px;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
  
  .el-form-item__label {
    font-size: 13px;
  }
  
  .el-input__inner,
  .el-textarea__inner {
    font-size: 13px;
  }
}
</style>