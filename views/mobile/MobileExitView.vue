<template>
  <div class="mobile-exit">
    <div class="exit-header">
      <h2>🚙 出场结算</h2>
      <p v-if="current">当前车辆：{{ current.license_plate }}</p>
      <p v-else>当前暂无在停车辆</p>
    </div>

    <div v-if="current" class="exit-card">
      <el-card shadow="hover">
        <div class="exit-info">
          <div class="row">
            <span class="label">入场时间</span>
            <span class="value">{{ formatTime(current.entry_time) }}</span>
          </div>
          <div class="row">
            <span class="label">已停时长</span>
            <span class="value">{{ durationText }}</span>
          </div>
          <div class="row">
            <span class="label">预估费用</span>
            <span class="value fee">¥{{ previewFee }}</span>
          </div>
        </div>

        <div class="exit-actions">
          <el-space>
            <el-button @click="refreshPreview" :loading="loading">刷新预估</el-button>
            <el-button type="primary" @click="doSettle" :loading="settleLoading">确认结算</el-button>
          </el-space>
        </div>

        <div class="payment-options">
          <el-checkbox v-model="useBalance">优先使用余额</el-checkbox>
          <span class="balance" v-if="balanceText">（{{ balanceText }}）</span>
        </div>
      </el-card>
    </div>

    <div v-else class="empty-container">
      <el-empty description="请先在入场后进行停车" />
      <div v-if="billingRule" class="billing-rule-info">
        <el-card shadow="never">
          <template v-slot:header>
<div  class="rule-header">
            <span>计费规则</span>
          </div>
</template>
          <div class="rule-content">
            <div v-for="(value, key) in billingRuleDisplayItems" :key="key" class="rule-item">
              <span class="rule-label">{{ value.label }}：</span>
              <span class="rule-value">{{ value.prefix }}{{ billingRule[key] }}{{ value.suffix }}</span>
            </div>
            <div v-if="billingRuleDisplayItems.length === 0" class="rule-item">
              <span class="rule-value">暂无计费规则信息</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { getMyParkingHistory } from '@/api/user'
import { getBillingRule } from '@/api/pricing'
import { getUserBalance } from '@/api/payments'
import { exitAndSettle, getParkingSpaces } from '@/api/parking'
import { wsManager } from '@/utils/websocket'
import { getToken } from '@/utils/auth'

export default {
  name: 'MobileExitView',
  data() {
    return {
      current: null,
      previewFee: '0.00',
      loading: false,
      settleLoading: false,
      useBalance: true,
      balanceText: '',
      wsOffStarted: null,
      wsOffEnded: null,
      billingRule: null,
      defaultLotId: null,
      billingRuleTimer: null
    }
  },
  computed: {
    durationText() {
      if (!this.current?.entry_time) return '-'
      const entry = new Date(this.current.entry_time)
      const now = new Date()
      const hours = Math.max((now - entry) / 3600000, 0)
      return `${hours.toFixed(2)} 小时`
    },
    billingRuleDisplayItems() {
      if (!this.billingRule) return []
      
      // 完全根据后端返回的数据来显示，不预设任何字段
      const items = []
      const rule = this.billingRule
      
      // 遍历后端返回的所有字段
      Object.keys(rule).forEach(key => {
        const value = rule[key]
        
        // 跳过内部字段和空值
        if (key.includes('id') || key.includes('time') || key === 'rule_name' || value === null || value === undefined) {
          return
        }
        
        // 根据字段名动态生成显示标签和格式
        let label = key
        let prefix = ''
        let suffix = ''
        
        // 智能识别字段类型（完全基于字段名，不硬编码业务逻辑）
        if (key.includes('minute')) {
          label = '免费时长'
          suffix = ' 分钟'
        } else if (key.includes('hourly') || key.includes('rate')) {
          label = '小时费率'
          prefix = '¥'
          suffix = '/小时'
        } else if (key.includes('daily') || key.includes('cap')) {
          label = '每日封顶'
          prefix = '¥'
        } else if (key.includes('fee') || key.includes('price')) {
          label = '费用'
          prefix = '¥'
        }
        
        items.push({
          key,
          label,
          prefix,
          suffix
        })
      })
      
      return items
    }
  },
  async mounted() {
    await this.loadAll()
    // 按需建立 WebSocket 连接并订阅用户专属提醒
    try { if (getToken()) wsManager.connect() } catch (e) {}
    this.wsOffStarted = wsManager.subscribe('my_parking_started', (payload) => {
      const plate = payload?.license_plate || payload?.payload?.license_plate
      this.$message.success(`入场完成：${plate || '车辆'} 已入场`)
      this.loadAll()
    })
    this.wsOffEnded = wsManager.subscribe('my_parking_ended', (payload) => {
      const plate = payload?.license_plate || payload?.payload?.license_plate
      const fee = payload?.final_fee ?? payload?.payload?.final_fee
      const msg = fee != null ? `出场完成：${plate || '车辆'}，费用 ¥${Number(fee).toFixed(2)}` : `出场完成：${plate || '车辆'}`
      this.$message.info(msg)
      this.loadAll()
    })
  },
  unmounted() {
    try { if (typeof this.wsOffStarted === 'function') this.wsOffStarted() } catch (e) {}
    try { if (typeof this.wsOffEnded === 'function') this.wsOffEnded() } catch (e) {}
    // 清除定时器
    if (this.billingRuleTimer) {
      clearInterval(this.billingRuleTimer)
      this.billingRuleTimer = null
    }
  },
  onActivated() {
    // 激活时强制刷新
    this.loadAll()
    // 设置计费规则定时刷新（每30秒更新一次）
    if (this.billingRuleTimer) {
      clearInterval(this.billingRuleTimer)
    }
    this.billingRuleTimer = setInterval(() => {
      if (!this.current) {
        this.loadDefaultBillingRule()
      }
    }, 30000)
  },
  methods: {
    async loadAll() {
      this.loading = true
      try {
        const [currentList, balance] = await Promise.all([
          getMyParkingHistory({ status: 'active', limit: 50 }),
          getUserBalance().catch(() => ({ balance: 0 }))
        ])
        const listArr = Array.isArray(currentList?.data) ? currentList.data : (Array.isArray(currentList) ? currentList : [])
        const activeList = listArr.filter(r => String(r?.status).toUpperCase() === 'PARKED')
        const curObj = activeList.length ? activeList[0] : null
        // 解析当前活动记录并补充 space_id（用于释放）
        if (curObj && curObj.parking_lot_id) {
          try {
            const spaces = await getParkingSpaces(curObj.parking_lot_id, { status_value: 'occupied' })
            const list = Array.isArray(spaces) ? spaces : (Array.isArray(spaces?.items) ? spaces.items : [])
            const match = list.find(s => s.vehicle_id === curObj.vehicle_id)
            this.current = { ...curObj, space_id: match?.id || null }
          } catch (_) {
            this.current = curObj
          }
        } else {
          this.current = curObj
        }
        const bal = Number(balance?.balance ?? 0)
        this.balanceText = `余额：¥${bal.toFixed(2)}`
        
        // 如果没有当前停车记录，获取默认计费规则
        if (!this.current) {
          await this.loadDefaultBillingRule()
        }
        
        await this.refreshPreview()
      } catch (e) {
        console.warn('加载出场数据失败：', e)
      } finally {
        this.loading = false
      }
    },
    async refreshPreview() {
      if (!this.current?.entry_time) return
      if (!this.current?.parking_lot_id) { this.previewFee = '0.00'; return }
      try {
        const ruleResp = await getBillingRule(this.current.parking_lot_id)
        // 保存完整的计费规则用于显示（不修改原始数据）
        this.billingRule = ruleResp
        
        // 计算费用时使用默认值处理（仅用于计算逻辑）
        const freeMin = Number(ruleResp?.free_duration_minutes || 0)
        const hourly = Number(ruleResp?.hourly_rate || 0)
        const dailyCap = ruleResp?.daily_cap_rate != null ? Number(ruleResp.daily_cap_rate) : null
        const entry = new Date(this.current.entry_time)
        const now = new Date()
        const totalMinutes = Math.max(Math.floor((now.getTime() - entry.getTime()) / 60000), 0)
        if (totalMinutes <= freeMin) { this.previewFee = '0.00'; return }
        const billableMinutes = totalMinutes - freeMin
        let fee = 0
        if (dailyCap == null) {
          const hours = Math.floor((billableMinutes + 59) / 60)
          fee = hourly * hours
        } else {
          const days = Math.floor(billableMinutes / 1440)
          const rem = billableMinutes % 1440
          const remHours = Math.floor((rem + 59) / 60)
          const remFee = Math.min(hourly * remHours, dailyCap)
          fee = days * dailyCap + remFee
        }
        this.previewFee = Number(fee).toFixed(2)
      } catch (e) {
        this.previewFee = '0.00'
      }
    },
    formatTime(ts) {
      if (!ts) return '-'
      const date = new Date(ts)
      return date.toLocaleString()
    },
    async loadDefaultBillingRule() {
      try {
        // 获取停车场列表，使用第一个停车场的计费规则作为默认规则
        const { getParkingLots } = await import('@/api/parking')
        const lotsResp = await getParkingLots({ page: 1, limit: 1 })
        const lots = Array.isArray(lotsResp?.data) ? lotsResp.data : (Array.isArray(lotsResp) ? lotsResp : [])
        if (lots.length > 0) {
          const ruleResp = await getBillingRule(lots[0].id)
          // 完全使用后端返回的数据，不做任何处理
          this.billingRule = ruleResp
          this.defaultLotId = lots[0].id
        }
      } catch (e) {
        console.warn('获取默认计费规则失败：', e)
        this.billingRule = null
      }
    },
    formatAmount(a) {
      const num = Number(a || 0)
      return num.toFixed(2)
    },
    async doSettle() {
      if (!this.current?.id) {
        this.$confirm('未选择车位，是否立即前往选择？', '提示', {
          confirmButtonText: '前往选择',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const plate = this.current?.license_plate || this.current?.license_plate_snapshot || ''
          const query = plate ? `?autoNav=1&plate=${encodeURIComponent(plate)}` : '?autoNav=1'
          this.$router.push(`/mobile/find${query}`)
        }).catch(() => {})
        return
      }
      this.settleLoading = true
      try {
        const resp = await exitAndSettle(this.current.id)
        if (resp?.detail && resp.detail.includes('余额不足')) {
          this.$message.warning('余额不足，请前往支付页完成支付')
        } else {
          const amt = Number(resp?.amount || this.previewFee || 0)
          this.$message.success(`结算成功，支付金额：¥${amt.toFixed(2)}`)
          this.current = null
        }
        await this.loadAll()
      } catch (error) {
        this.$message.error(error?.response?.data?.detail || error.message || '结算失败，请重试')
      } finally {
        this.settleLoading = false
      }
    }
  }
}
  </script>

<style lang="scss" scoped>
.mobile-exit {
  padding: 20px 0;
}
.exit-header {
  text-align: center;
  margin-bottom: 16px;
  h2 { font-size: 22px; margin: 0; }
  p { color: #666; margin: 6px 0 0; }
}
.exit-card { padding: 0 12px; }
.exit-info {
  .row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    .label { color: #999; }
    .value { color: #333; }
    .fee { color: #e64a19; font-weight: 600; }
  }
}
.exit-actions { margin-top: 12px; }
.payment-options { margin-top: 8px; color: #666; }
.balance { margin-left: 8px; }

.empty-container {
  padding: 0 12px;
}
.billing-rule-info {
  margin-top: 20px;
  .rule-header {
    font-weight: 600;
    color: #333;
  }
  .rule-content {
    padding: 15px 0;
  }
  .rule-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    &:last-child {
      border-bottom: none;
    }
  }
  .rule-label {
    color: #666;
    font-size: 14px;
  }
  .rule-value {
    color: #333;
    font-size: 14px;
    font-weight: 500;
  }
}
</style>