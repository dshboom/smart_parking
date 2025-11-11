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
            <span class="label">VIP状态</span>
            <span class="value"><el-tag :type="vipActive ? 'success' : 'info'">{{ vipActive ? 'VIP' : '普通' }}</el-tag></span>
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
import { getMyCurrentParking } from '@/api/parking'
import { calcParkingFeeAdvanced, calcParkingFee } from '@/api/pricing'
import { getMyVip } from '@/api/user'
import { getMyBalance, settleParkingFee } from '@/api/payments'

export default {
  name: 'MobileExitView',
  data() {
    return {
      current: null,
      vipActive: false,
      previewFee: '0.00',
      loading: false,
      settleLoading: false,
      useBalance: true,
      balanceText: ''
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
  },
  methods: {
    async loadAll() {
      this.loading = true
      try {
        const [current, vip, balance] = await Promise.all([
          getMyCurrentParking(),
          getMyVip().catch(() => ({ is_active: false })),
          getMyBalance().catch(() => ({ balance: 0 }))
        ])
        // 兼容后端返回结构：{ has_current_parking, current_parking }
        const curObj = current?.current_parking || current?.data?.current_parking || current || current?.data || null
        this.current = curObj
        this.vipActive = Boolean(vip?.is_active || vip?.data?.is_active)
        const bal = Number(balance?.balance ?? balance?.data?.balance ?? 0)
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
      const entryISO = new Date(this.current.entry_time).toISOString()
      const nowISO = new Date().toISOString()
      try {
        const resp = await calcParkingFeeAdvanced({
          entry_time: entryISO,
          exit_time: nowISO,
          is_vip: this.vipActive
        })
        const fee = Number(resp?.fee ?? resp?.data?.fee ?? 0)
        this.previewFee = fee.toFixed(2)
      } catch (e) {
        console.warn('高级计费失败，回退基础计费：', e)
        try {
          const entry = new Date(this.current.entry_time)
          const now = new Date()
          const hours = Math.max((now - entry) / 3600000, 0)
          const basic = await calcParkingFee(hours, this.vipActive)
          const fee2 = Number(basic?.fee ?? basic?.data?.fee ?? 0)
          this.previewFee = fee2.toFixed(2)
        } catch (_) {
          this.previewFee = '0.00'
        }
      }
    },
    formatTime(ts) {
      if (!ts) return '-'
      const date = new Date(ts)
      return date.toLocaleString()
    },
    async doSettle() {
      if (!this.current?.id) return
      this.settleLoading = true
      try {
        const payload = {
          record_id: this.current.id,
          use_balance: this.useBalance,
          force_end: true
        }
        const resp = await settleParkingFee(payload)
        const fee = Number(resp?.fee ?? resp?.data?.fee ?? 0).toFixed(2)
        this.$message.success(`结算成功，支付金额：¥${fee}`)
        // 结算后清空当前状态
        this.current = null
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