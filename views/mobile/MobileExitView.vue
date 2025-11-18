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

    <el-empty v-else description="请先在入场后进行停车，出场时在此结算" />
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
      wsOffEnded: null
    }
  },
  computed: {
    durationText() {
      if (!this.current?.entry_time) return '-'
      const entry = new Date(this.current.entry_time)
      const now = new Date()
      const hours = Math.max((now - entry) / 3600000, 0)
      return `${hours.toFixed(2)} 小时`
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
  },
  onActivated() {
    // 激活时强制刷新
    this.loadAll()
  },
  methods: {
    async loadAll() {
      this.loading = true
      try {
        const [currentList, balance] = await Promise.all([
          getMyParkingHistory({ status: 'active', limit: 1 }),
          getUserBalance().catch(() => ({ balance: 0 }))
        ])
        const curObj = Array.isArray(currentList?.data) ? currentList.data[0] : (Array.isArray(currentList) ? currentList[0] : null)
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
</style>