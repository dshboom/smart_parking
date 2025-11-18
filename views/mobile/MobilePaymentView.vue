<template>
  <div class="mobile-payment">
    <div class="payment-header">
      <div class="header-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h2>支付设置</h2>
    </div>

    <div class="payment-content">
      <!-- 余额信息 -->
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
          <div class="balance-actions">
            <el-button type="primary" size="small" @click="showRecharge = true">
              <el-icon><Plus /></el-icon>
              充值
            </el-button>
            <el-button size="small" @click="showWithdraw = true">
              <el-icon><Minus /></el-icon>
              提现
            </el-button>
          </div>
        </div>
      </div>

      <!-- 支付方式 -->
      <div class="payment-methods">
        <h3>支付方式</h3>
        <div class="method-list">
          <div 
            v-for="method in paymentMethods" 
            :key="method.id"
            class="method-item"
            @click="selectPaymentMethod(method)"
          >
            <div class="method-icon">
              <el-icon :size="24">
                <component :is="method.icon" />
              </el-icon>
            </div>
            <div class="method-info">
              <div class="method-name">{{ method.name }}</div>
              <div class="method-desc">{{ method.description }}</div>
            </div>
            <div class="method-status">
              <el-switch
                v-model="method.enabled"
                @click.stop
                @change="togglePaymentMethod(method)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 支付设置 -->
      <div class="payment-settings">
        <h3>支付设置</h3>
        <div class="setting-list">
          <div class="setting-item" @click="showAutoPay = true">
            <div class="setting-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="setting-info">
              <div class="setting-name">自动支付</div>
              <div class="setting-desc">停车结束时自动扣费</div>
            </div>
            <div class="setting-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <div class="setting-item" @click="showPassword = true">
            <div class="setting-icon">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="setting-info">
              <div class="setting-name">支付密码</div>
              <div class="setting-desc">{{ hasPassword ? '已设置' : '未设置' }}</div>
            </div>
            <div class="setting-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <div class="setting-item" @click="showLimit = true">
            <div class="setting-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="setting-info">
              <div class="setting-name">支付限额</div>
              <div class="setting-desc">单次支付最高{{ payLimit }}元</div>
            </div>
            <div class="setting-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 交易记录 -->
      <div class="transaction-history">
        <h3>最近交易</h3>
        <div class="transaction-list">
          <div 
            v-for="transaction in recentTransactions" 
            :key="transaction.id"
            class="transaction-item"
          >
            <div class="transaction-icon">
              <el-icon :size="20" :color="transaction.type === 'income' ? '#67c23a' : '#f56c6c'">
                <component :is="transaction.type === 'income' ? 'Top' : 'Bottom'" />
              </el-icon>
            </div>
            <div class="transaction-info">
              <div class="transaction-title">{{ transaction.title }}</div>
              <div class="transaction-time">{{ transaction.time }}</div>
            </div>
            <div class="transaction-amount" :class="transaction.type">
              {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount.toFixed(2) }}
            </div>
          </div>
          <div v-if="recentTransactions.length === 0" class="empty-transactions">
            <el-icon size="48" color="#ccc"><Document /></el-icon>
            <p>暂无交易记录</p>
          </div>
        </div>
        <el-button 
          v-if="recentTransactions.length > 0"
          type="link" 
          @click="goToAllTransactions"
          class="view-all-btn"
        >
          查看全部交易记录
        </el-button>
      </div>
    </div>

    <!-- 充值对话框 -->
    <el-dialog
      v-model="showRecharge"
      title="账户充值"
      width="90%"
      top="20vh"
      class="payment-dialog"
    >
      <div class="recharge-content">
        <div class="amount-input">
          <span class="currency">¥</span>
          <el-input-number
            v-model="rechargeAmount"
            :min="1"
            :max="10000"
            :step="50"
            :precision="2"
            size="large"
            controls-position="right"
          />
        </div>
        <div class="quick-amounts">
          <div 
            v-for="amount in quickAmounts" 
            :key="amount"
            class="quick-amount"
            :class="{ active: rechargeAmount === amount }"
            @click="rechargeAmount = amount"
          >
            ¥{{ amount }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRecharge = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <!-- 提现对话框 -->
    <el-dialog
      v-model="showWithdraw"
      title="账户提现"
      width="90%"
      top="20vh"
      class="payment-dialog"
    >
      <div class="withdraw-content">
        <div class="available-balance">
          可提现余额：<span class="amount">¥{{ userBalance.toFixed(2) }}</span>
        </div>
        <div class="amount-input">
          <span class="currency">¥</span>
          <el-input-number
            v-model="withdrawAmount"
            :min="1"
            :max="userBalance"
            :step="10"
            :precision="2"
            size="large"
            controls-position="right"
          />
        </div>
        <el-input
          v-model="withdrawAccount"
          placeholder="请输入提现账户（支付宝/银行卡）"
          size="large"
        >
          <template #prefix>
            <el-icon><Wallet /></el-icon>
          </template>
        </el-input>
      </div>
      <template #footer>
        <el-button @click="showWithdraw = false">取消</el-button>
        <el-button type="primary" @click="handleWithdraw">确认提现</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  ArrowLeft, Wallet, Plus, Minus, Setting, Lock, Money,
  ArrowRight, Top, Bottom, Document, CreditCard, Iphone
} from '@element-plus/icons-vue'
import { getMyPayments, getPaymentMethods, getUserBalance, rechargeBalance, withdrawBalance } from '@/api/payments'

export default {
  name: 'MobilePaymentView',
  components: {
    ArrowLeft, Wallet, Plus, Minus, Setting, Lock, Money,
    ArrowRight, Top, Bottom, Document, CreditCard, Iphone
  },
  data() {
    return {
      userBalance: 0,
      hasPassword: true,
      payLimit: 500,
      showRecharge: false,
      showWithdraw: false,
      showAutoPay: false,
      showPassword: false,
      showLimit: false,
      rechargeAmount: 100,
      withdrawAmount: 50,
      withdrawAccount: '',
      quickAmounts: [50, 100, 200, 500, 1000],
      paymentMethods: [],
      recentTransactions: []
    }
  },
  created() {
    this.loadBalance()
    this.loadTransactions()
    this.loadPaymentMethods()
  },
  methods: {
    goBack() {
      this.$router.back()
    },

    selectPaymentMethod(method) {
      // 可以跳转到详细设置页面
      this.$message.info(`点击了 ${method.name}`)
    },

    togglePaymentMethod(method) {
      // 切换支付方式启用状态
      const action = method.enabled ? '已启用' : '已禁用'
      this.$message.success(`${method.name} ${action}`)
    },

    async handleRecharge() {
      if (this.rechargeAmount <= 0) {
        this.$message.warning('请输入有效的充值金额')
        return
      }
      try {
        await rechargeBalance({ amount: this.rechargeAmount, payment_method: 'WECHAT_PAY' })
        await this.loadBalance()
        this.showRecharge = false
        this.$message.success(`充值成功 ¥${this.rechargeAmount}`)
        await this.loadTransactions()
      } catch (error) {
        this.$message.error(error?.response?.data?.detail || '充值失败')
      }
    },

    async handleWithdraw() {
      if (this.withdrawAmount <= 0) {
        this.$message.warning('请输入有效的提现金额')
        return
      }
      if (!this.withdrawAccount.trim()) {
        this.$message.warning('请输入提现账户')
        return
      }
      try {
        await withdrawBalance({ amount: this.withdrawAmount, bank_account: this.withdrawAccount })
        await this.loadBalance()
        this.showWithdraw = false
        this.$message.success(`提现申请已提交，金额 ¥${this.withdrawAmount}`)
        await this.loadTransactions()
        this.withdrawAmount = 50
        this.withdrawAccount = ''
      } catch (error) {
        this.$message.error(error?.response?.data?.detail || '提现失败')
      }
    },

    async loadBalance() {
      try {
        const resp = await getUserBalance()
        this.userBalance = Number(resp?.balance || 0)
      } catch (e) {
        this.userBalance = 0
      }
    },

    async loadTransactions() {
      try {
        const resp = await getMyPayments({ skip: 0, limit: 10 })
        const list = Array.isArray(resp) ? resp : (resp?.payments || resp?.data || [])
        this.recentTransactions = (list || []).map(t => ({
          id: t.id,
          title: t.payment_type || '支付',
          amount: Math.abs(Number(t.amount || 0)),
          type: (String(t.status || '').toLowerCase() === 'refunded') ? 'income' : 'expense',
          time: t.created_at ? new Date(t.created_at).toLocaleString() : ''
        }))
      } catch (e) {
        this.recentTransactions = []
      }
    },

    async loadPaymentMethods() {
      try {
        const methods = await getPaymentMethods()
        this.paymentMethods = (methods || []).map(m => ({
          id: m.method || 'wallet',
          name: m.name || '账户余额',
          description: m.provider || '支付方式',
          icon: m.method === 'ALIPAY' ? 'CreditCard' : (m.method === 'WECHAT_PAY' ? 'Iphone' : 'Wallet'),
          enabled: true
        }))
      } catch (e) {
        this.paymentMethods = [{ id: 'wallet', name: '账户余额', description: '使用账户余额支付', icon: 'Wallet', enabled: true }]
      }
    },

    goToAllTransactions() {
      this.$router.push('/mobile/transactions')
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
    
    &:hover {
      color: #409eff;
    }
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

.payment-content {
  padding: 20px;
}

.balance-section {
  margin-bottom: 25px;
  
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
      
      .el-icon {
        margin-right: 8px;
        font-size: 20px;
      }
      
      span {
        font-size: 16px;
        font-weight: 500;
      }
    }
    
    .balance-amount {
      margin-bottom: 20px;
      
      .currency {
        font-size: 24px;
        margin-right: 5px;
      }
      
      .amount {
        font-size: 36px;
        font-weight: bold;
      }
    }
    
    .balance-actions {
      display: flex;
      gap: 15px;
      
      .el-button {
        flex: 1;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        &.el-button--primary {
          background: white;
          color: #667eea;
          border: none;
          
          &:hover {
            background: #f5f7fa;
          }
        }
      }
    }
  }
}

.payment-methods,
.payment-settings,
.transaction-history {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  
  h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
  }
}

.method-list,
.setting-list,
.transaction-list {
  .method-item,
  .setting-item,
  .transaction-item {
    display: flex;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: #f5f7fa;
      border-radius: 8px;
      margin: 0 -10px;
      padding-left: 10px;
      padding-right: 10px;
    }
  }
}

.method-item {
  .method-icon {
    margin-right: 15px;
    color: #409eff;
  }
  
  .method-info {
    flex: 1;
    
    .method-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    
    .method-desc {
      font-size: 12px;
      color: #999;
    }
  }
}

.setting-item {
  .setting-icon {
    margin-right: 15px;
    color: #67c23a;
  }
  
  .setting-info {
    flex: 1;
    
    .setting-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    
    .setting-desc {
      font-size: 12px;
      color: #999;
    }
  }
  
  .setting-arrow {
    color: #ccc;
  }
}

.transaction-item {
  .transaction-icon {
    margin-right: 15px;
  }
  
  .transaction-info {
    flex: 1;
    
    .transaction-title {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    
    .transaction-time {
      font-size: 12px;
      color: #999;
    }
  }
  
  .transaction-amount {
    font-weight: 600;
    font-size: 16px;
    
    &.income {
      color: #67c23a;
    }
    
    &.expense {
      color: #f56c6c;
    }
  }
}

.empty-transactions {
  text-align: center;
  padding: 40px 0;
  color: #ccc;
  
  p {
    margin-top: 10px;
    font-size: 14px;
  }
}

.view-all-btn {
  width: 100%;
  margin-top: 15px;
  color: #409eff;
  font-weight: 500;
}

.payment-dialog {
  :deep(.el-dialog) {
    border-radius: 15px;
  }
  
  .recharge-content,
  .withdraw-content {
    .amount-input {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      
      .currency {
        font-size: 24px;
        color: #333;
        margin-right: 10px;
      }
      
      .el-input-number {
        flex: 1;
      }
    }
    
    .quick-amounts {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
      
      .quick-amount {
        text-align: center;
        padding: 10px;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        
        &:hover {
          border-color: #409eff;
          color: #409eff;
        }
        
        &.active {
          border-color: #409eff;
          background: #ecf5ff;
          color: #409eff;
        }
      }
    }
    
    .available-balance {
      margin-bottom: 15px;
      color: #666;
      
      .amount {
        color: #f56c6c;
        font-weight: 600;
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .payment-content {
    padding: 15px;
  }
  
  .balance-section .balance-card {
    padding: 20px;
    
    .balance-amount .amount {
      font-size: 32px;
    }
  }
  
  .payment-methods,
  .payment-settings,
  .transaction-history {
    padding: 15px;
  }
}

@media screen and (max-width: 375px) {
  .payment-header {
    padding: 12px 15px;
    
    h2 {
      font-size: 16px;
    }
  }
  
  .payment-content {
    padding: 12px;
  }
  
  .balance-section .balance-card {
    padding: 15px;
  }
  
  .payment-dialog {
    .quick-amounts {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
