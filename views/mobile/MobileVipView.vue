<template>
  <div class="mobile-vip">
    <div class="vip-header">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h2>VIP 尊享</h2>
    </div>

    <div class="vip-content">
      <!-- 预约提示 -->
      <el-alert
        type="warning"
        :closable="false"
        title="预约功能仅向VIP开放"
        description="开通VIP后即可预约车位、享受优先导航与折扣"
        class="vip-alert"
      />

      <!-- 当前VIP状态与余额 -->
      <div class="status-section">
        <div class="status-card">
          <div class="status-icon">
            <el-icon><Medal /></el-icon>
          </div>
          <div class="status-info">
            <div class="status-title">当前会员</div>
            <div class="status-value">
              <template v-if="vip && vip.is_active">
                已开通 · 到期 {{ formatDate(vip.end_date) }}
              </template>
              <template v-else>
                未开通
              </template>
            </div>
          </div>
        </div>
        <div class="status-card">
          <div class="status-icon">
            <el-icon><Wallet /></el-icon>
          </div>
          <div class="status-info">
            <div class="status-title">账户余额</div>
            <div class="status-value">¥{{ balance.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- VIP权益 -->
      <div class="benefits-section">
        <h3>VIP 权益</h3>
        <div class="benefit-list">
          <div class="benefit-item">
            <el-icon><Star /></el-icon>
            车位预约优先权
          </div>
          <div class="benefit-item">
            <el-icon><Position /></el-icon>
            最近空位智能导航
          </div>
          <div class="benefit-item">
            <el-icon><Money /></el-icon>
            停车费专属折扣
          </div>
        </div>
      </div>

      <!-- VIP计划 -->
      <div class="plans-section">
        <h3>选择会员计划</h3>
        <div class="plan-list">
          <div 
            v-for="plan in planList" 
            :key="plan.key" 
            class="plan-card"
          >
            <div class="plan-header">
              <div class="plan-name">{{ plan.label }}</div>
              <div class="plan-price">¥{{ Number(plan.price).toFixed(2) }}</div>
            </div>
            <div class="plan-desc">有效期 {{ plan.duration_days }} 天</div>
            <div class="plan-actions">
              <el-button type="primary" size="small" :loading="upgrading" @click="upgrade(plan.key)">
                立即开通
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 充值引导 -->
      <el-dialog v-model="showRecharge" title="余额不足，去充值" width="90%" top="20vh">
        <div class="recharge-content">
          <div class="need-amount">需充值金额：<span class="amount">¥{{ needRecharge.toFixed(2) }}</span></div>
          <div class="quick-amounts">
            <div v-for="amount in quickAmounts" :key="amount" class="quick-amount" :class="{ active: rechargeAmount === amount }" @click="rechargeAmount = amount">¥{{ amount }}</div>
          </div>
        </div>
        <template #footer>
          <el-button @click="showRecharge = false">取消</el-button>
          <el-button type="primary" :loading="rechargeLoading" @click="doRechargeThenUpgrade">一键充值并开通</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { ArrowLeft, Medal, Star, Position, Money, Wallet } from '@element-plus/icons-vue'
import { getPricingConfig } from '@/api/pricing'

export default {
  name: 'MobileVipView',
  components: { ArrowLeft, Medal, Star, Position, Money, Wallet },
  data() {
    return {
      vip: null,
      balance: 0,
      plans: {},
      planList: [],
      upgrading: false,
      showRecharge: false,
      needRecharge: 0,
      rechargeAmount: 100,
      rechargeLoading: false,
      quickAmounts: [50, 100, 200, 500, 1000]
    }
  },
  created() {
    this.loadVip()
    this.loadBalance()
    this.loadPricing()
  },
  methods: {
    goBack() {
      this.$router.back()
    },
    async loadVip() {
      try {
        const resp = await this.$store.dispatch('user/getVipMe')
        this.vip = resp || null
      } catch (_) {
        this.vip = null
      }
    },
    async loadBalance() {
      try {
        const resp = await this.$store.dispatch('user/getBalance')
        this.balance = Number(resp?.balance || 0)
      } catch (_) {
        this.balance = 0
      }
    },
    async loadPricing() {
      try {
        const cfg = await getPricingConfig()
        const vipPlans = cfg?.vipPlans || {}
        this.plans = vipPlans
        this.planList = Object.keys(vipPlans).map(k => ({ key: k, label: vipPlans[k].label, price: vipPlans[k].price, duration_days: vipPlans[k].duration_days }))
      } catch (_) {
        this.plans = {
          monthly: { label: '月卡', price: 19, duration_days: 30 },
          quarterly: { label: '季卡', price: 49, duration_days: 90 },
          yearly: { label: '年卡', price: 149, duration_days: 365 }
        }
        this.planList = Object.keys(this.plans).map(k => ({ key: k, label: this.plans[k].label, price: this.plans[k].price, duration_days: this.plans[k].duration_days }))
      }
    },
    async upgrade(planKey) {
      if (!planKey) return
      this.upgrading = true
      try {
        const resp = await this.$store.dispatch('user/upgradeVip', planKey)
        if (resp?.vip) {
          this.vip = resp.vip
        }
        if (resp?.balance?.balance != null) {
          this.balance = Number(resp.balance.balance)
        }
        this.$message.success('VIP开通成功')
      } catch (error) {
        const detail = error?.response?.data?.detail || error?.message
        if (detail && typeof detail === 'object' && detail.needRechargeAmount != null) {
          this.needRecharge = Number(detail.needRechargeAmount || 0)
          this.rechargeAmount = Math.max(50, Math.ceil(this.needRecharge))
          this.showRecharge = true
        } else {
          this.$message.error(error?.response?.data?.detail?.message || error?.response?.data?.detail || '开通失败')
        }
      } finally {
        this.upgrading = false
      }
    },
    async doRechargeThenUpgrade() {
      try {
        this.rechargeLoading = true
        await this.$store.dispatch('user/recharge', { amount: this.rechargeAmount, method: 'wechat' })
        await this.loadBalance()
        this.showRecharge = false
        // 选择价格最接近的方案重试（以needRecharge为参考）
        const target = this.planList.find(p => Math.abs(Number(p.price) - Number(this.needRecharge)) < 5) || this.planList[0]
        await this.upgrade(target.key)
      } catch (error) {
        this.$message.error(error?.response?.data?.detail || '充值失败')
      } finally {
        this.rechargeLoading = false
      }
    },
    formatDate(iso) {
      if (!iso) return '-'
      try {
        const d = new Date(iso)
        return d.toLocaleDateString()
      } catch (_) {
        return String(iso)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-vip {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef7 100%);
}

.vip-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-back { margin-right: 15px; cursor: pointer; color: #666; font-size: 20px; }
  h2 { flex: 1; text-align: center; margin: 0; color: #333; font-size: 18px; font-weight: 600; }
}

.vip-content { padding: 20px; }

.vip-alert { margin-bottom: 16px; }

.status-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .status-card {
    flex: 1;
    background: white;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);

    .status-icon { width: 44px; height: 44px; border-radius: 50%; background: #eef3ff; display:flex; align-items:center; justify-content:center; color:#409eff; }
    .status-info { flex: 1; }
    .status-title { font-size: 12px; color: #666; }
    .status-value { font-size: 16px; font-weight: 600; color: #333; }
  }
}

.benefits-section {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;

  h3 { margin: 0 0 10px; font-size: 16px; color: #333; font-weight: 600; }
  .benefit-list { display: flex; gap: 16px; flex-wrap: wrap; }
  .benefit-item { display: flex; align-items: center; gap: 8px; color: #333; background: #f8fafc; padding: 10px 12px; border-radius: 12px; }
}

.plans-section {
  h3 { margin: 0 0 10px; font-size: 16px; color: #333; font-weight: 600; }
  .plan-list { display: flex; gap: 12px; flex-direction: column; }
  .plan-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .plan-header { display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .plan-name { font-size: 16px; font-weight: 700; color: #333; }
  .plan-price { font-size: 20px; font-weight: 700; color: #409eff; }
  .plan-desc { font-size: 12px; color: #666; margin-bottom: 10px; }
  .plan-actions { display:flex; justify-content:flex-end; }
}

.recharge-content {
  .need-amount { margin-bottom: 12px; .amount { font-weight: 700; color: #e6a23c; } }
  .quick-amounts { display:flex; gap: 8px; flex-wrap: wrap; }
  .quick-amount { padding: 8px 10px; border-radius: 10px; background:#f4f4f5; cursor:pointer; }
  .quick-amount.active { background:#409eff; color:white; }
}

@media screen and (max-width: 768px) {
  .vip-content { padding: 15px; }
}
</style>