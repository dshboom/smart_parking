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
                <el-icon><Position /></el-icon>
                停车场设置
              </h3>
              <el-form :model="parkingSettings" label-width="120px" class="modern-form">
                <el-form-item label="停车场名称">
                  <el-input v-model="parkingSettings.parkingLotName" placeholder="请输入停车场名称" />
                </el-form-item>
                <el-form-item label="总停车位">
                  <el-input-number 
                    v-model="parkingSettings.totalSpaces" 
                    :min="1" 
                    :max="10000"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="预留车位数">
                  <el-input-number 
                    v-model="parkingSettings.reservedSpaces" 
                    :min="0" 
                    :max="parkingSettings.totalSpaces"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="地址">
                  <el-input 
                    v-model="parkingSettings.address" 
                    type="textarea" 
                    :rows="2"
                    placeholder="请输入停车场地址"
                  />
                </el-form-item>
                <el-form-item label="联系电话">
                  <el-input v-model="parkingSettings.contactPhone" placeholder="请输入联系电话" />
                </el-form-item>
                <el-form-item label="营业时间">
                  <el-time-picker
                    v-model="parkingSettings.openTime"
                    placeholder="开始时间"
                    format="HH:mm"
                  />
                  <span style="margin: 0 8px;">至</span>
                  <el-time-picker
                    v-model="parkingSettings.closeTime"
                    placeholder="结束时间"
                    format="HH:mm"
                  />
                </el-form-item>
              </el-form>
            </div>

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
                    <el-option label="VIP用户" value="vip" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Key /></el-icon>
                安全设置
              </h3>
              <el-form :model="userSettings" label-width="120px" class="modern-form">
                <el-form-item label="密码最小长度">
                  <el-input-number 
                    v-model="userSettings.minPasswordLength" 
                    :min="6" 
                    :max="32"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="密码复杂度">
                  <el-checkbox-group v-model="userSettings.passwordComplexity">
                    <el-checkbox label="uppercase">包含大写字母</el-checkbox>
                    <el-checkbox label="lowercase">包含小写字母</el-checkbox>
                    <el-checkbox label="number">包含数字</el-checkbox>
                    <el-checkbox label="special">包含特殊字符</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="登录失败次数">
                  <el-input-number 
                    v-model="userSettings.maxLoginAttempts" 
                    :min="3" 
                    :max="10"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="锁定时间(分钟)">
                  <el-input-number 
                    v-model="userSettings.lockoutDuration" 
                    :min="5" 
                    :max="1440"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="会话超时(分钟)">
                  <el-input-number 
                    v-model="userSettings.sessionTimeout" 
                    :min="5" 
                    :max="1440"
                    controls-position="right"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="通知配置" name="notification">
          <div class="tab-content">
            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Message /></el-icon>
                邮件通知
              </h3>
              <el-form :model="notificationSettings" label-width="120px" class="modern-form">
                <el-form-item label="启用邮件通知">
                  <el-switch 
                    v-model="notificationSettings.emailEnabled" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="SMTP服务器">
                  <el-input v-model="notificationSettings.smtpServer" placeholder="请输入SMTP服务器地址" />
                </el-form-item>
                <el-form-item label="SMTP端口">
                  <el-input-number 
                    v-model="notificationSettings.smtpPort" 
                    :min="1" 
                    :max="65535"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="发件人邮箱">
                  <el-input v-model="notificationSettings.senderEmail" placeholder="请输入发件人邮箱" />
                </el-form-item>
                <el-form-item label="发件人名称">
                  <el-input v-model="notificationSettings.senderName" placeholder="请输入发件人名称" />
                </el-form-item>
                <el-form-item label="SMTP用户名">
                  <el-input v-model="notificationSettings.smtpUsername" placeholder="请输入SMTP用户名" />
                </el-form-item>
                <el-form-item label="SMTP密码">
                  <el-input 
                    v-model="notificationSettings.smtpPassword" 
                    type="password"
                    placeholder="请输入SMTP密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="SSL/TLS">
                  <el-switch 
                    v-model="notificationSettings.smtpSSL" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Cellphone /></el-icon>
                短信通知
              </h3>
              <el-form :model="notificationSettings" label-width="120px" class="modern-form">
                <el-form-item label="启用短信通知">
                  <el-switch 
                    v-model="notificationSettings.smsEnabled" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="短信服务商">
                  <el-select v-model="notificationSettings.smsProvider" placeholder="请选择短信服务商">
                    <el-option label="阿里云" value="aliyun" />
                    <el-option label="腾讯云" value="tencent" />
                    <el-option label="华为云" value="huawei" />
                  </el-select>
                </el-form-item>
                <el-form-item label="AccessKey">
                  <el-input v-model="notificationSettings.smsAccessKey" placeholder="请输入AccessKey" />
                </el-form-item>
                <el-form-item label="SecretKey">
                  <el-input 
                    v-model="notificationSettings.smsSecretKey" 
                    type="password"
                    placeholder="请输入SecretKey"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="短信签名">
                  <el-input v-model="notificationSettings.smsSignName" placeholder="请输入短信签名" />
                </el-form-item>
                <el-form-item label="模板ID">
                  <el-input v-model="notificationSettings.smsTemplateId" placeholder="请输入短信模板ID" />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="系统日志" name="logs">
          <div class="tab-content">
            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Document /></el-icon>
                日志配置
              </h3>
              <el-form :model="logSettings" label-width="120px" class="modern-form">
                <el-form-item label="日志级别">
                  <el-select v-model="logSettings.logLevel" placeholder="请选择日志级别">
                    <el-option label="DEBUG" value="debug" />
                    <el-option label="INFO" value="info" />
                    <el-option label="WARNING" value="warning" />
                    <el-option label="ERROR" value="error" />
                    <el-option label="CRITICAL" value="critical" />
                  </el-select>
                </el-form-item>
                <el-form-item label="日志保留天数">
                  <el-input-number 
                    v-model="logSettings.logRetentionDays" 
                    :min="1" 
                    :max="365"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item label="启用文件日志">
                  <el-switch 
                    v-model="logSettings.fileLogging" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="日志文件大小">
                  <el-input-number 
                    v-model="logSettings.maxLogFileSize" 
                    :min="1" 
                    :max="1000"
                    controls-position="right"
                  />
                  <span style="margin-left: 8px;">MB</span>
                </el-form-item>
                <el-form-item label="启用数据库日志">
                  <el-switch 
                    v-model="logSettings.databaseLogging" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="启用操作日志">
                  <el-switch 
                    v-model="logSettings.operationLogging" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="settings-section">
              <h3 class="section-title">
                <el-icon><Monitor /></el-icon>
                系统监控
              </h3>
              <el-form :model="logSettings" label-width="120px" class="modern-form">
                <el-form-item label="启用监控">
                  <el-switch 
                    v-model="logSettings.monitoringEnabled" 
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                <el-form-item label="监控间隔">
                  <el-input-number 
                    v-model="logSettings.monitoringInterval" 
                    :min="1" 
                    :max="3600"
                    controls-position="right"
                  />
                  <span style="margin-left: 8px;">秒</span>
                </el-form-item>
                <el-form-item label="CPU告警阈值">
                  <el-input-number 
                    v-model="logSettings.cpuAlertThreshold" 
                    :min="50" 
                    :max="100"
                    controls-position="right"
                  />
                  <span style="margin-left: 8px;">%</span>
                </el-form-item>
                <el-form-item label="内存告警阈值">
                  <el-input-number 
                    v-model="logSettings.memoryAlertThreshold" 
                    :min="50" 
                    :max="100"
                    controls-position="right"
                  />
                  <span style="margin-left: 8px;">%</span>
                </el-form-item>
                <el-form-item label="磁盘告警阈值">
                  <el-input-number 
                    v-model="logSettings.diskAlertThreshold" 
                    :min="50" 
                    :max="100"
                    controls-position="right"
                  />
                  <span style="margin-left: 8px;">%</span>
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
      parkingLotName: '智能停车场',
      totalSpaces: 500,
      reservedSpaces: 50,
      address: '北京市朝阳区xxx路xxx号',
      contactPhone: '010-12345678',
      openTime: new Date(2024, 0, 1, 6, 0),
      closeTime: new Date(2024, 0, 1, 22, 0),
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
      defaultRole: 'user',
      minPasswordLength: 8,
      passwordComplexity: ['uppercase', 'lowercase', 'number'],
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      sessionTimeout: 120
    })

    // 通知设置
    const notificationSettings = reactive({
      emailEnabled: false,
      smtpServer: '',
      smtpPort: 587,
      senderEmail: '',
      senderName: '智能停车系统',
      smtpUsername: '',
      smtpPassword: '',
      smtpSSL: true,
      smsEnabled: false,
      smsProvider: 'aliyun',
      smsAccessKey: '',
      smsSecretKey: '',
      smsSignName: '',
      smsTemplateId: ''
    })

    // 日志设置
    const logSettings = reactive({
      logLevel: 'info',
      logRetentionDays: 30,
      fileLogging: true,
      maxLogFileSize: 100,
      databaseLogging: true,
      operationLogging: true,
      monitoringEnabled: true,
      monitoringInterval: 60,
      cpuAlertThreshold: 80,
      memoryAlertThreshold: 85,
      diskAlertThreshold: 90
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
          Object.assign(notificationSettings, settings.notification || {})
          Object.assign(logSettings, settings.logs || {})
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
          user: userSettings,
          notification: notificationSettings,
          logs: logSettings
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
        // 测试邮件配置
        if (notificationSettings.emailEnabled) {
          // 这里可以添加实际的邮件测试逻辑
          ElMessage.info('邮件配置测试功能开发中...')
        }
        
        // 测试短信配置
        if (notificationSettings.smsEnabled) {
          // 这里可以添加实际的短信测试逻辑
          ElMessage.info('短信配置测试功能开发中...')
        }
        
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
      notificationSettings,
      logSettings,
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
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section .page-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 4px 0;
}

.title-section .page-subtitle {
  font-size: 14px;
  color: #8b949e;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 设置标签页 */
.settings-tabs {
  margin-bottom: 24px;
}

.tab-content {
  padding: 24px 0;
}

.settings-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title .el-icon {
  color: #667eea;
  font-size: 20px;
}

.modern-form {
  max-width: 600px;
}

.modern-form .el-form-item {
  margin-bottom: 20px;
}

.modern-form .el-form-item__label {
  color: #e6edf3;
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 24px;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  min-width: 120px;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  min-width: 120px;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.test-btn {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
  min-width: 120px;
}

.test-btn:hover {
  background: rgba(255, 193, 7, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-actions {
    flex-direction: column;
  }
  
  .save-btn,
  .reset-btn,
  .test-btn {
    width: 100%;
  }
}
</style>