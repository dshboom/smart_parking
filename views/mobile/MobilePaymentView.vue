<template>
  <div class="mobile-payment">
    <div class="payment-header">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h2>钱包余额</h2>
    </div>

    <div class="payment-content">
      <div class="balance-section">
        <div class="balance-card">
          <div class="balance-header">
            <el-icon><Wallet /></el-icon>
            <span>账户余额</span>
          </div>
          <div class="balance-amount">
            <span class="currency">¥</span>
            <span class="amount">{{ userBalance.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ArrowLeft, Wallet } from '@element-plus/icons-vue'
import { getUserBalance } from '@/api/payments'

export default {
  name: 'MobilePaymentView',
  components: { ArrowLeft, Wallet },
  data() {
    return { userBalance: 0 }
  },
  created() {
    this.loadBalance()
  },
  methods: {
    goBack() {
      this.$router.back()
    },
    async loadBalance() {
      try {
        const resp = await getUserBalance()
        this.userBalance = Number(resp?.balance || 0)
      } catch (e) {
        this.userBalance = 0
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-payment {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.payment-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-back {
    margin-right: 15px;
    cursor: pointer;
    color: #666;
    font-size: 20px;
  }

  h2 {
    flex: 1;
    text-align: center;
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }
}

.payment-content { padding: 20px; }

.balance-section {
  .balance-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 25px;
    color: white;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);

    .balance-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;

      .el-icon { margin-right: 8px; font-size: 20px; }
      span { font-size: 16px; font-weight: 500; }
    }

    .balance-amount {
      .currency { font-size: 24px; margin-right: 5px; }
      .amount { font-size: 36px; font-weight: bold; }
    }
  }
}

@media screen and (max-width: 768px) {
  .payment-content { padding: 15px; }
  .balance-section .balance-card { padding: 20px; }
  .balance-section .balance-card .balance-amount .amount { font-size: 32px; }
}

@media screen and (max-width: 375px) {
  .payment-header { padding: 12px 15px; }
  .payment-header h2 { font-size: 16px; }
  .payment-content { padding: 12px; }
  .balance-section .balance-card { padding: 15px; }
}
</style>