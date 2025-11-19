<template>
  <div class="payment-management">
    <!-- 页面头部与统计概览 -->
    <el-card class="page-card">
      <div class="page-header">
        <h2>支付管理</h2>
        <div class="page-actions">
        </div>
      </div>

      <div class="stats-grid">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">总交易额</div>
          <div class="stat-value">¥{{ (stats.totalAmount ?? 0).toFixed(2) }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">交易笔数</div>
          <div class="stat-value">{{ stats.transactionCount ?? 0 }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">成功率</div>
          <div class="stat-value">{{ (stats.successRate ?? 0).toFixed(1) }}%</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">退款金额</div>
          <div class="stat-value">¥{{ (stats.refundAmount ?? 0).toFixed(2) }}</div>
        </el-card>
      </div>
    </el-card>

    <!-- 筛选表单 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" style="width: 160px">
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.method" placeholder="全部" style="width: 160px">
            <el-option label="全部" value="" />
            <el-option label="充值" value="recharge" />
            <el-option label="提现" value="withdraw" />
            <el-option label="停车费" value="parking_fee" />
            <el-option label="预约费" value="reservation_fee" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="filterForm.user" placeholder="例如 1001" style="width: 160px" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="transactions" border>
        <el-table-column prop="id" label="交易ID" width="100" />
        <el-table-column prop="userName" label="用户" min-width="120" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="method" label="方式" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetails(row)">
              <el-icon><ViewIcon /></el-icon>
              详情
            </el-button>
            <el-button type="success" link @click="doRefund(row)" :disabled="row.status === 'refunded'">
              <el-icon><Refresh /></el-icon>
              退款
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="loadTransactions"
          @current-change="loadTransactions"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="交易详情" size="40%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="交易ID">{{ currentRow?.id }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentRow?.userName }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ currentRow?.amount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="方式">{{ currentRow?.method }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(currentRow?.status) }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatDateTime(currentRow?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRow?.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
  
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View as ViewIcon } from '@element-plus/icons-vue'
import { getAdminPayments } from '@/api/payments'

const loading = ref(false)
const transactions = ref([])
const stats = reactive({
  totalAmount: 0,
  transactionCount: 0,
  successRate: 0,
  refundAmount: 0
})

const filterForm = reactive({
  status: '',
  method: '',
  user: '',
  dateRange: []
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

const detailVisible = ref(false)
const currentRow = ref(null)

const getStatusType = (status) => {
  switch (status) {
    case 'success': return 'success'
    case 'failed': return 'danger'
    case 'pending': return 'warning'
    default: return ''
  }
}
const getStatusText = (status) => {
  switch (status) {
    case 'success': return '成功'
    case 'failed': return '失败'
    case 'pending': return '待处理'
    default: return '未知'
  }
}
const formatDateTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const loadStats = async () => {
  try {
    const res = await getAdminPayments({ skip: 0, limit: 1000 })
    const list = Array.isArray(res) ? res : (res?.payments || res?.data || [])
    const totalAmount = list.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const transactionCount = list.length
    const successCount = list.filter(t => (t.status || '').toLowerCase() === 'success').length
    const refundAmount = list.filter(t => (t.status || '').toLowerCase() === 'refunded').reduce((sum, t) => sum + Number(t.amount || 0), 0)
    stats.totalAmount = totalAmount
    stats.transactionCount = transactionCount
    stats.successRate = transactionCount ? (successCount * 100 / transactionCount) : 0
    stats.refundAmount = refundAmount
  } catch (error) {
  }
}

const loadTransactions = async () => {
  loading.value = true
  try {
    const skip = (pagination.current - 1) * pagination.pageSize
    const limit = pagination.pageSize
    const isNumericUser = filterForm.user && /^\d+$/.test(filterForm.user)
    const params = {
      status: filterForm.status || undefined,
      method: filterForm.method || undefined,
      user_id: isNumericUser ? Number(filterForm.user) : undefined,
      start_date: filterForm.dateRange?.[0] ? new Date(filterForm.dateRange[0]).toISOString() : undefined,
      end_date: filterForm.dateRange?.[1] ? new Date(filterForm.dateRange[1]).toISOString() : undefined,
      skip,
      limit
    }
    const res = await getAdminPayments(params)
    const list = Array.isArray(res) ? res : (res?.payments || res?.data || [])
    transactions.value = list.map(t => ({
      id: t.id,
      userName: (t.user && (t.user.username || t.user.name)) || '-',
      amount: Number(t.amount ?? 0),
      method: t.payment_type || t.method || '-',
      status: t.status || 'success',
      createdAt: t.created_at || t.createdAt || null,
      remark: t.remark || ''
    }))
    pagination.total = Number(res?.total ?? list.length)
  } catch (error) {
    ElMessage.error('加载交易列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadTransactions()
}
const handleReset = () => {
  Object.assign(filterForm, { status: '', method: '', user: '', dateRange: [] })
  pagination.current = 1
  loadTransactions()
}


const viewDetails = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const doRefund = async () => {
  ElMessage.info('当前后端未提供退款接口')
}

onMounted(() => {
  loadStats()
  loadTransactions()
})
</script>

<style scoped>
.payment-management {
  padding: 20px;
}
.page-card {
  margin-bottom: 16px;
}
.filter-card {
  margin-bottom: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-actions {
  display: flex;
  gap: 8px;
}
.stats-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  text-align: center;
}
.stat-title {
  color: var(--el-color-info);
  margin-bottom: 8px;
}
.stat-value {
  font-size: 20px;
  font-weight: 600;
}
.table-card {
  margin-top: 12px;
}
.pagination-container {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
