<template>
  <div class="user-management-container">
    <!-- 页面头部区域 -->
    <div class="header-section">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-subtitle">管理系统用户账户信息</h1>
        </div>
        <div class="header-actions"></div>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card users">
            <div class="stat-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card active">
            <div class="stat-icon active">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ activeUsers }}</div>
              <div class="stat-label">激活用户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card blocked">
            <div class="stat-icon blocked">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ blockedUsers }}</div>
              <div class="stat-label">禁用用户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card admins">
            <div class="stat-icon admins">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ adminUsers }}</div>
              <div class="stat-label">管理员</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索过滤区域 -->
    <div class="filter-container modern-card">
      <div class="filter-header">
        <h3 class="filter-title">
          <el-icon><Search /></el-icon>
          搜索筛选
        </h3>
        <div class="filter-tools">
          <el-switch
            v-model="showAdvancedFilters"
            inline-prompt
            active-text="高级筛选"
            inactive-text="基础筛选"
            class="advanced-switch"
          />
        </div>
      </div>
      <el-form :model="listQuery" class="filter-form" label-position="top">
        <!-- 第一行：用户名 + 车牌号 + 操作按钮 -->
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="用户名">
              <el-input 
                v-model="listQuery.username" 
                placeholder="请输入用户名" 
                prefix-icon="el-icon-search"
                clearable
                @keyup.enter="handleFilter"
                @clear="handleFilter"
                class="modern-input"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="车牌号">
              <el-input
                v-model="listQuery.license_plate"
                placeholder="输入车牌进行快速查找，如 京A12345 或 粤B·12345"
                clearable
                @keyup.enter="handleFilter"
                @clear="handleFilter"
                class="modern-input"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8" class="filter-actions">
            <el-form-item label="&nbsp;">
              <el-button type="primary" @click="handleFilter" :loading="listLoading" class="filter-btn">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button type="default" @click="handleReset" class="reset-btn">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 第二行：高级筛选（状态 + 角色） -->
        <el-row :gutter="24" v-show="showAdvancedFilters" style="margin-top: 12px;">
          <el-col :span="12">
            <el-form-item label="用户状态">
              <el-select v-model="listQuery.status" placeholder="请选择状态" clearable @change="handleFilter" class="modern-select">
                <el-option label="全部状态" value="" />
                <el-option label="激活" value="active" />
                <el-option label="禁用" value="blocked" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户角色">
              <el-select v-model="listQuery.role" placeholder="请选择角色" clearable @change="handleFilter" class="modern-select" >
                <el-option label="全部角色" value="" />
                <el-option label="管理员" value="admin" />
                <el-option label="普通用户" value="user" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 用户列表表格区域 -->
    <div class="table-section modern-card">
      <div class="table-header">
        <div class="table-title">
          <el-icon><List /></el-icon>
          <span>用户列表</span>
          <span class="table-count">({{ total }} 条记录)</span>
        </div>
        <div class="table-actions">
          <el-button 
            type="primary" 
            @click="handleBatchExport" 
            class="export-btn"
            :disabled="selectedUsers.length === 0"
          >
            <el-icon><Download /></el-icon>
            导出选中
          </el-button>
          <el-button 
            type="success" 
            @click="handleCreate" 
            class="add-user-btn"
          >
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </div>
      
      <div class="table-wrapper">
        <el-table
          v-loading="listLoading"
          :data="list"
          stripe
          style="width: 100%"
          @sort-change="sortChange"
          @selection-change="handleSelectionChange"
          @expand-change="handleExpandChange"
          class="modern-table"
          :header-cell-style="tableHeaderStyle"
          :row-class-name="tableRowClassName"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-panel">
                <div class="expand-title">用户车辆</div>
                <div class="expand-tools">
                  <el-input
                    v-model="rowVehicleInput[row.id]"
                    placeholder="输入车牌进行绑定"
                    size="small"
                    class="modern-input"
                    style="max-width: 240px;"
                  />
                  <el-button size="small" type="primary" @click="addRowVehicle(row.id)">绑定</el-button>
                </div>
                <div class="expand-content">
                  <template v-if="rowVehiclesLoading[row.id]">
                    <el-skeleton :rows="2" animated style="padding: 8px 0" />
                  </template>
                  <template v-else>
                    <template v-if="rowVehicles[row.id] && rowVehicles[row.id].length">
                      <div class="vehicle-tags">
                        <el-tooltip v-for="v in rowVehicles[row.id]" :key="v.license_plate" :content="'点击叉号解除绑定'" placement="top">
                          <el-tag
                            class="modern-tag"
                            type="info"
                            closable
                            @close="removeRowVehicle(row.id, v.license_plate)"
                            style="margin: 4px;"
                          >{{ v.license_plate }}</el-tag>
                        </el-tooltip>
                      </div>
                    </template>
                    <el-empty v-else description="暂无绑定车辆" />
                  </template>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column 
            prop="id" 
            label="用户ID" 
            width="90" 
            align="center"
            sortable="custom"
            class-name="id-column"
          />
          <el-table-column prop="username" label="用户名" min-width="140">
            <template #default="{row}">
              <div class="user-info">
                <div class="user-avatar">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="user-details">
                  <div class="username">{{ row.username }}</div>
                  <div class="user-id">#{{ row.id }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="联系方式" min-width="160">
            <template #default="{row}">
              <div class="contact-info">
                <div class="phone">
                  <el-icon><Phone /></el-icon>
                  {{ row.phone }}
                </div>
                <div class="email" v-if="row.email">
                  <el-icon><Message /></el-icon>
                  {{ row.email }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="role" label="用户角色" width="120" align="center">
            <template #default="{row}">
              <el-tag 
                :type="getRoleType(row.role)" 
                class="role-tag"
                effect="light"
                size="default"
              >
                <el-icon><Star v-if="row.role === 'admin'" /></el-icon>
                {{ getRoleLabel(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="账户状态" width="110" align="center">
            <template #default="{row}">
              <div class="status-container">
                <el-switch
                  v-model="row.status"
                  active-value="active"
                  inactive-value="blocked"
                  @change="handleStatusChange(row)"
                  class="status-switch"
                  :loading="row.statusLoading"
                />
                <span class="status-text" :class="row.status">
                  {{ row.status === 'active' ? '激活' : '禁用' }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" width="160" align="center">
            <template #default="{row}">
              <div class="time-info">
                <div class="date">{{ formatDate(row.created_at) }}</div>
                <div class="time">{{ formatTime(row.created_at) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{row}">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleEdit(row)" 
                  class="edit-btn"
                  circle
                  title="编辑用户"
                  v-permission="'user:edit'"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-dropdown @command="(cmd) => handleMoreAction(cmd, row)" trigger="click">
                  <el-button type="info" size="small" circle title="更多操作">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="view">
                        <el-icon><View /></el-icon>
                        查看详情
                      </el-dropdown-item>
                      <el-dropdown-item command="resetPwd">
                        <el-icon><Key /></el-icon>
                        重置密码
                      </el-dropdown-item>
                      <el-dropdown-item command="vehicles">
                        <el-icon><List /></el-icon>
                        车辆管理
                      </el-dropdown-item>
                      <el-dropdown-item command="vip">
                        <el-icon><Star /></el-icon>
                        VIP 管理
                      </el-dropdown-item>
                      <el-dropdown-item command="blacklist" divided>
                        <el-icon><Delete /></el-icon>
                        加入黑名单
                      </el-dropdown-item>
                      <el-dropdown-item command="blacklist_remove" class="danger-item">
                        <el-icon><Delete /></el-icon>
                        移除黑名单
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided class="danger-item" v-permission="'user:delete'">
                      <el-icon><Delete /></el-icon>
                      删除用户
                    </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="pagination-container modern-pagination">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
      class="modern-dialog"
    >
      <el-form ref="userForm" :model="userForm" :rules="userRules" label-width="80px" class="modern-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" class="modern-input" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" class="modern-input" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%" class="modern-select">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status" class="modern-radio-group">
            <el-radio label="active" class="modern-radio">激活</el-radio>
            <el-radio label="blocked" class="modern-radio">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" class="modern-btn-secondary">取 消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="modern-btn">
            确 定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 车辆管理对话框 -->
    <el-dialog v-model="vehiclesDialogVisible" title="车辆管理" width="640px" class="modern-dialog">
      <div v-if="currentUser" class="dialog-subtitle">当前用户：{{ currentUser.username }}（ID: {{ currentUser.id }}）</div>
      <div class="vehicle-bind">
        <el-input v-model="vehicleForm.license_plate" placeholder="请输入车牌号并点击绑定" class="modern-input" style="max-width: 320px;" />
        <el-button type="primary" @click="addVehicle" style="margin-left: 8px;">绑定车辆</el-button>
      </div>
      <div class="vehicle-list" style="margin-top: 12px;">
        <template v-if="vehicles && vehicles.length">
          <div class="vehicle-tags">
            <el-tag
              v-for="v in vehicles"
              :key="v.license_plate"
              type="info"
              closable
              @close="removeVehicle(v.license_plate)"
              class="modern-tag"
              style="margin: 4px;"
            >
              {{ v.license_plate }}
            </el-tag>
          </div>
        </template>
        <el-empty v-else description="暂无绑定车辆" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="vehiclesDialogVisible = false">关 闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- VIP 管理对话框 -->
    <el-dialog v-model="vipDialogVisible" title="VIP 管理" width="560px" class="modern-dialog">
      <div v-if="vipInfo" class="vip-hint">
        当前为 VIP 等级 {{ vipInfo.level }}，到期：{{ formatDate(vipInfo.end_date) }}
      </div>
      <el-form :model="vipForm" label-width="80px" class="modern-form">
        <el-form-item label="等级">
          <el-input-number v-model="vipForm.level" :min="1" :max="9" />
        </el-form-item>
        <el-form-item label="到期">
          <el-date-picker v-model="vipForm.end_date" type="date" placeholder="选择到期日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="vipForm.notes" type="textarea" placeholder="备注信息（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="vipDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="saveVip">保 存</el-button>
          <el-button type="danger" v-if="vipInfo" @click="removeVip">移除 VIP</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, List, Download, UserFilled, Phone, Message, Star, View, Key, MoreFilled, User, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { 
  fetchList, 
  updateUserStatus,
  getUserByLicensePlate,
  getUserVehicles,
  bindUserVehicle,
  unbindUserVehicle,
  getVip,
  createVip,
  updateVip,
  deleteVip,
  addBlacklist,
  removeBlacklist
} from '@/api/user'

export default {
  name: 'UserList',
  components: {
    Search,
    Refresh,
    Plus,
    Edit,
    Delete,
    List,
    Download,
    User,
    UserFilled,
    Phone,
    Message,
    Star,
    CircleCheck,
    CircleClose,
    View,
    Key,
    MoreFilled
  },
  setup() {
    const listLoading = ref(false)
    const total = ref(0)
    const dialogVisible = ref(false)
    const submitLoading = ref(false)
    const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')
    const isEdit = ref(false)
    const selectedUsers = ref([])
    const showAdvancedFilters = ref(false)
    
    const listQuery = reactive({
      page: 1,
      limit: 10,
      username: '',
      status: '',
      license_plate: '',
      sort: '+id'
    })

    const list = ref([])
    
    const userForm = reactive({
      id: null,
      username: '',
      phone: '',
      role: 'user',
      status: 'active'
    })

    const userRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ],
      role: [
        { required: true, message: '请选择角色', trigger: 'change' }
      ]
    }

    // 后端数据源（完整数据用于统计和分页）
    const allUsers = ref([])

    const getList = async () => {
      listLoading.value = true
      try {
        // 如果按车牌搜索，优先按车牌查询用户
        if (listQuery.license_plate && listQuery.license_plate.trim() !== '') {
          try {
            const resp = await getUserByLicensePlate(listQuery.license_plate.trim())
            const user = resp?.data || resp
            const filteredData = user ? [{ ...user, statusLoading: false }] : []
            allUsers.value = filteredData
            total.value = filteredData.length
            const start = (listQuery.page - 1) * listQuery.limit
            const end = start + listQuery.limit
            list.value = filteredData.slice(start, end)
            return
          } catch (e) {
            // 未找到或接口报错，降级为普通列表查询
          }
        }

        const params = {
          // 不传分页参数，先获取过滤后的完整数据用于前端分页
          status: listQuery.status || undefined,
          role: listQuery.role || undefined,
          username: listQuery.username || undefined,
        }
        const response = await fetchList(params)
        const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
        let filteredData = [...data].map(u => ({ ...u, statusLoading: false }))

        // 排序
        if (listQuery.sort === '+id') {
          filteredData.sort((a, b) => a.id - b.id)
        } else if (listQuery.sort === '-id') {
          filteredData.sort((a, b) => b.id - a.id)
        }

        allUsers.value = filteredData
        total.value = filteredData.length

        // 分页
        const start = (listQuery.page - 1) * listQuery.limit
        const end = start + listQuery.limit
        list.value = filteredData.slice(start, end)
      } catch (error) {
        console.error('获取用户列表失败:', error)
        ElMessage.error('获取用户列表失败')
      } finally {
        listLoading.value = false
      }
    }

    const handleFilter = () => {
      listQuery.page = 1
      getList()
    }

    const handleReset = () => {
      listQuery.username = ''
      listQuery.status = ''
      listQuery.license_plate = ''
      listQuery.page = 1
      getList()
    }

    const handleSizeChange = (val) => {
      listQuery.limit = val
      getList()
    }

    const handleCurrentChange = (val) => {
      listQuery.page = val
      getList()
    }

    const handleCreate = () => {
      isEdit.value = false
      resetForm()
      dialogVisible.value = true
    }

    const handleEdit = (row) => {
      isEdit.value = true
      Object.assign(userForm, row)
      dialogVisible.value = true
    }

    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除用户 "${row.username}" 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        ElMessage.success('删除成功')
        getList()
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }

    const handleStatusChange = async (row) => {
      row.statusLoading = true
      try {
        await updateUserStatus(row.id, row.status)
        const statusText = row.status === 'active' ? '激活' : '禁用'
        ElMessage.success(`用户状态已更新为${statusText}`)
      } catch (error) {
        ElMessage.error('更新用户状态失败')
        // 回滚开关状态
        row.status = row.status === 'active' ? 'blocked' : 'active'
      } finally {
        row.statusLoading = false
      }
    }

    const submitForm = () => {
      // 这里应该调用API保存数据
      ElMessage.success(isEdit.value ? '用户更新成功' : '用户创建成功')
      dialogVisible.value = false
      getList()
    }

    const handleDialogClose = () => {
      resetForm()
    }

    const resetForm = () => {
      Object.assign(userForm, {
        id: null,
        username: '',
        phone: '',
        role: 'user',
        status: 'active'
      })
    }

    const sortChange = (data) => {
      const { prop, order } = data
      if (prop === 'id') {
        if (order === 'ascending') {
          listQuery.sort = '+id'
        } else {
          listQuery.sort = '-id'
        }
        getList()
      }
    }

    const getRoleType = (role) => {
      return role === 'admin' ? 'danger' : 'info'
    }

    const getRoleLabel = (role) => {
      return role === 'admin' ? '管理员' : '用户'
    }

    const handleSelectionChange = (selection) => {
      selectedUsers.value = selection
    }

    const handleMoreAction = async (command, row) => {
      switch (command) {
        case 'view':
          ElMessage.info(`查看用户详情: ${row.username}`)
          break
        case 'resetPwd':
          ElMessageBox.confirm(
            `确定要重置用户 "${row.username}" 的密码吗？`,
            '重置密码确认',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }
          ).then(() => {
            ElMessage.success('密码重置成功')
          })
          break
        case 'delete':
          handleDelete(row)
          break
        case 'vehicles':
          currentUser.value = row
          vehiclesDialogVisible.value = true
          await loadUserVehicles(row.id)
          break
        case 'vip':
          currentUser.value = row
          vipDialogVisible.value = true
          await loadVip(row.id)
          break
        case 'blacklist':
          ElMessageBox.prompt('请输入加入黑名单的原因', '加入黑名单', {
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }).then(async ({ value }) => {
            await addBlacklist(row.id, { reason: value || '违规' })
            row.status = 'blocked'
            ElMessage.success('已加入黑名单并禁用该用户')
          }).catch(() => {})
          break
        case 'blacklist_remove':
          await removeBlacklist(row.id)
          row.status = 'active'
          ElMessage.success('已移除黑名单并激活该用户')
          break
      }
    }

    // ===== 车辆绑定 =====
    const vehiclesDialogVisible = ref(false)
    const currentUser = ref(null)
    const vehicles = ref([])
    const vehicleForm = reactive({ license_plate: '' })

    const loadUserVehicles = async (userId) => {
      try {
        const resp = await getUserVehicles(userId)
        vehicles.value = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : [])
      } catch (e) {
        vehicles.value = []
      }
    }

    const addVehicle = async () => {
      if (!vehicleForm.license_plate || vehicleForm.license_plate.trim() === '') {
        ElMessage.warning('请输入车牌号码')
        return
      }
      try {
        await bindUserVehicle(currentUser.value.id, { license_plate: vehicleForm.license_plate.trim() })
        ElMessage.success('车辆绑定成功')
        vehicleForm.license_plate = ''
        await loadUserVehicles(currentUser.value.id)
      } catch (e) {
        ElMessage.error('车辆绑定失败')
      }
    }

    const removeVehicle = async (licensePlate) => {
      try {
        await unbindUserVehicle(currentUser.value.id, licensePlate)
        ElMessage.success('已解除绑定')
        await loadUserVehicles(currentUser.value.id)
      } catch (e) {
        ElMessage.error('解除绑定失败')
      }
    }

    // ===== 表格展开：行内车辆列表与绑定 =====
    const rowVehicles = reactive({})
    const rowVehiclesLoading = reactive({})
    const rowVehicleInput = reactive({})

    const handleExpandChange = async (row) => {
      if (!row) return
      await loadRowVehicles(row.id)
    }

    const loadRowVehicles = async (userId) => {
      rowVehiclesLoading[userId] = true
      try {
        const resp = await getUserVehicles(userId)
        const arr = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : [])
        rowVehicles[userId] = arr || []
      } catch (e) {
        rowVehicles[userId] = []
      } finally {
        rowVehiclesLoading[userId] = false
      }
    }

    const addRowVehicle = async (userId) => {
      const plate = (rowVehicleInput[userId] || '').trim()
      if (!plate) {
        ElMessage.warning('请输入车牌号码')
        return
      }
      try {
        await bindUserVehicle(userId, { license_plate: plate })
        ElMessage.success('车辆绑定成功')
        rowVehicleInput[userId] = ''
        await loadRowVehicles(userId)
      } catch (e) {
        ElMessage.error('车辆绑定失败')
      }
    }

    const removeRowVehicle = async (userId, licensePlate) => {
      try {
        await unbindUserVehicle(userId, licensePlate)
        ElMessage.success('已解除绑定')
        await loadRowVehicles(userId)
      } catch (e) {
        ElMessage.error('解除绑定失败')
      }
    }

    // ===== VIP 管理 =====
    const vipDialogVisible = ref(false)
    const vipInfo = ref(null)
    const vipForm = reactive({ level: 1, end_date: '', notes: '' })

    const formatDateOnly = (d) => {
      if (!d) return ''
      if (d instanceof Date) return d.toISOString().split('T')[0]
      try {
        return new Date(d).toISOString().split('T')[0]
      } catch (e) {
        return String(d)
      }
    }

    const loadVip = async (userId) => {
      try {
        const resp = await getVip(userId)
        const info = resp?.data || resp
        vipInfo.value = info || null
        Object.assign(vipForm, {
          level: info?.level || 1,
          end_date: info?.end_date || '',
          notes: info?.notes || ''
        })
      } catch (e) {
        vipInfo.value = null
        Object.assign(vipForm, { level: 1, end_date: '', notes: '' })
      }
    }

    const saveVip = async () => {
      try {
        const payload = {
          level: vipForm.level,
          end_date: formatDateOnly(vipForm.end_date),
          notes: vipForm.notes || ''
        }
        if (vipInfo.value) {
          await updateVip(currentUser.value.id, payload)
          ElMessage.success('VIP信息已更新')
        } else {
          await createVip(currentUser.value.id, payload)
          ElMessage.success('已创建VIP会员')
        }
        await loadVip(currentUser.value.id)
      } catch (e) {
        ElMessage.error('保存VIP信息失败')
      }
    }

    const removeVip = async () => {
      try {
        await deleteVip(currentUser.value.id)
        ElMessage.success('已移除VIP')
        await loadVip(currentUser.value.id)
      } catch (e) {
        ElMessage.error('移除VIP失败')
      }
    }

    const handleBatchExport = () => {
      if (selectedUsers.value.length === 0) {
        ElMessage.warning('请先选择要导出的用户')
        return
      }
      
      try {
        const exportData = selectedUsers.value.map(user => ({
          '用户ID': user.id,
          '用户名': user.username,
          '手机号': user.phone,
          '角色': user.role === 'admin' ? '管理员' : '用户',
          '状态': user.status === 'active' ? '激活' : '禁用',
          '创建时间': formatDate(user.created_at),
          '更新时间': formatDate(user.updated_at)
        }))
        
        import('@/utils/export').then(({ exportToExcel }) => {
          exportToExcel(exportData, '用户数据导出.xlsx')
          ElMessage.success(`成功导出 ${selectedUsers.value.length} 个用户数据`)
        })
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败，请重试')
      }
    }

    const tableHeaderStyle = () => {
      return {
        background: 'var(--modern-bg-secondary)',
        color: 'var(--modern-text-primary)',
        fontWeight: '600',
        fontSize: '14px'
      }
    }

    const tableRowClassName = ({ row, rowIndex }) => {
      if (row.status === 'blocked') {
        return 'disabled-row'
      }
      return ''
    }

    const normalizeDateTime = (dateTime) => {
      if (!dateTime) return ''
      if (typeof dateTime === 'string') return dateTime
      try {
        return new Date(dateTime).toISOString()
      } catch (e) {
        return String(dateTime)
      }
    }

    const formatDate = (dateTime) => {
      const s = normalizeDateTime(dateTime)
      return s.includes('T') ? s.split('T')[0] : s.split(' ')[0]
    }

    const formatTime = (dateTime) => {
      const s = normalizeDateTime(dateTime)
      const part = s.includes('T') ? s.split('T')[1] : s.split(' ')[1]
      return part ? part.substring(0, 8) : ''
    }

    onMounted(() => {
      getList()
    })

    const activeUsers = computed(() => allUsers.value.filter(u => u.status === 'active').length)
    const blockedUsers = computed(() => allUsers.value.filter(u => u.status === 'blocked').length)
    const adminUsers = computed(() => allUsers.value.filter(u => u.role === 'admin').length)

    return {
      list,
      total,
      selectedUsers,
      listLoading,
      listQuery,
      showAdvancedFilters,
      dialogVisible,
      dialogTitle,
      submitLoading,
      userForm,
      userRules,
      getList,
      handleFilter,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleCreate,
      handleEdit,
      handleDelete,
      handleStatusChange,
      handleSelectionChange,
      handleMoreAction,
      handleBatchExport,
      submitForm,
      handleDialogClose,
      sortChange,
      getRoleType,
      getRoleLabel,
      tableHeaderStyle,
      tableRowClassName,
      formatDate,
      formatTime,
      activeUsers,
      blockedUsers,
      adminUsers,
      // dialogs & forms
      vehiclesDialogVisible,
      vipDialogVisible,
      currentUser,
      vehicles,
      vehicleForm,
      addVehicle,
      removeVehicle,
      vipInfo,
      vipForm,
      saveVip,
      removeVip,
      // row expand vehicles
      rowVehicles,
      rowVehiclesLoading,
      rowVehicleInput,
      handleExpandChange,
      addRowVehicle,
      removeRowVehicle
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/modern-theme.css';

@keyframes countUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-management-container {
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.header-section {
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg-primary) 100%);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}



.title-icon {
  font-size: 1.5rem;
  background: var(--primary-gradient);
  color: white;
  padding: 8px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.9;
}

.filter-container {
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: all 0.4s ease;
  overflow: hidden;
}
.filter-container.collapsed {
  max-height: 88px;
}
.filter-container.expanded {
  max-height: 400px;
}
.filter-form {
  transition: all 0.4s ease;
  overflow: hidden;
}
.modern-input,
.modern-select {
  border-radius: var(--border-radius-md);
  transition: all 0.3s ease;
}
.modern-input:focus-within,
.modern-select:focus-within {
  box-shadow: 0 0 0 2px var(--primary-light), inset 0 2px 4px var(--shadow-light);
  border-color: var(--primary-color);
}
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}
.filter-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: var(--border-radius-md);
  padding: 4px 8px;
  font-size: 0.85rem;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
}
.filter-tag.active {
  background: var(--primary-gradient);
  color: white;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

/* 表格区域样式 */
.table-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.table-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-primary);
}

.table-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.table-title .el-icon {
  font-size: 1.2rem;
  color: var(--primary-color);
}

.table-count {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 0.9rem;
}

.table-actions {
  display: flex;
  gap: var(--spacing-sm);
}
/* 统一表格右侧操作按钮样式 */
.table-actions .export-btn,
.table-actions .add-user-btn {
  min-width: 120px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}
.table-actions .export-btn:hover,
.table-actions .add-user-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.table-wrapper {
  padding: var(--spacing-lg);
}

/* 筛选工具区域 */
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-tools {
  display: flex;
  align-items: center;
}
/* 搜索区按钮靠右与统一尺寸 */
.filter-actions .el-form-item {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.filter-actions .filter-btn,
.filter-actions .reset-btn {
  min-width: 110px;
}
.filter-actions .reset-btn {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
}
.filter-actions .reset-btn:hover {
  background: var(--bg-secondary);
}
.advanced-switch {
  --el-switch-on-color: var(--primary-color);
}

/* 用户信息显示 */
.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--button-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px var(--shadow-primary);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.user-avatar::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
  transform: rotate(45deg);
  transition: all 0.6s ease;
  opacity: 0;
}

.user-avatar:hover::before {
  opacity: 1;
  transform: rotate(45deg) translate(50%, 50%);
}

.user-avatar:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 4px 8px var(--shadow-primary);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.user-id {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 联系信息 */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phone, .email {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.phone .el-icon, .email .el-icon {
  color: var(--primary-color);
  font-size: 0.9rem;
}

.email {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* 角色标签 */
.role-tag {
  font-weight: 500;
  border-radius: var(--border-radius-md);
  padding: 6px 10px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px var(--shadow-light);
}

.role-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px var(--shadow-medium);
}

.role-tag .el-icon {
  font-size: 0.9rem;
}

/* 状态容器 */
.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-switch {
  --el-switch-on-color: var(--success-color);
  --el-switch-off-color: var(--warning-color);
  transition: all 0.3s ease;
}

.status-switch:hover {
  transform: scale(1.05);
}

.status-text {
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-text.active {
  color: var(--success-color);
}

.status-text.blocked {
  color: var(--warning-color);
}

/* 时间信息 */
.time-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.date {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
}

.edit-btn, .more-btn {
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.edit-btn:hover, .more-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-md);
}

.edit-btn:active, .more-btn:active {
  transform: translateY(0) scale(1);
}

.danger-item {
  color: var(--status-error) !important;
}

/* 禁用行样式 */
:deep(.disabled-row) {
  opacity: 0.6;
  background-color: var(--table-disabled-bg) !important;
}

/* 现代化分页样式 */
.pagination-container {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideUp 0.6s ease-out 0.6s both;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  position: relative;
}

.pagination-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: var(--spacing-lg);
  right: var(--spacing-lg);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
}

/* 分页控件现代化 */
:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-button-bg-color: var(--bg-glass);
  --el-pagination-button-disabled-bg-color: rgba(255, 255, 255, 0.3);
  --el-pagination-button-hover-bg-color: var(--primary-light);
  --el-pagination-height: 36px;
  --el-pagination-button-width: 36px;
  --el-pagination-font-size: 14px;
  --el-pagination-border-radius: var(--border-radius-md);
  --el-pagination-border-color: var(--border-light);
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  border-radius: var(--border-radius-md) !important;
  border: 1px solid var(--border-light);
  background: var(--bg-glass);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  margin: 0 2px;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

:deep(.el-pagination .el-pager li) {
  border-radius: var(--border-radius-md) !important;
  border: 1px solid var(--border-light);
  background: var(--bg-glass);
  backdrop-filter: blur(5px);
  margin: 0 2px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  font-weight: 500;
}

:deep(.el-pagination .el-pager li:hover) {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

:deep(.el-pagination .el-pager li.active) {
  background: var(--primary-gradient);
  border-color: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-primary);
  transform: translateY(-1px);
}

:deep(.el-pagination .el-pager li.active:hover) {
  background: var(--primary-gradient);
  transform: translateY(-1px) scale(1.05);
}

/* 页码尺寸选择器 */
:deep(.el-pagination__sizes) {
  margin-right: var(--spacing-md);
}

:deep(.el-pagination__sizes .el-select .el-input__wrapper) {
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-glass);
  backdrop-filter: blur(5px);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

:deep(.el-pagination__sizes .el-select .el-input__wrapper:hover) {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

/* 跳转输入框 */
:deep(.el-pagination__jump) {
  margin-left: var(--spacing-md);
  color: var(--text-secondary);
  font-size: 14px;
}

:deep(.el-pagination__jump .el-input__wrapper) {
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-glass);
  backdrop-filter: blur(5px);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  margin: 0 var(--spacing-xs);
}

:deep(.el-pagination__jump .el-input__wrapper:hover) {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

:deep(.el-pagination__jump .el-input__inner) {
  text-align: center;
  font-weight: 500;
}

/* 总计信息 */
:deep(.el-pagination__total) {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  margin-right: var(--spacing-md);
}

/* 批量操作按钮 */
.batch-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.batch-btn {
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-glass);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  font-weight: 500;
}

.batch-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.batch-btn.danger:hover {
  background: var(--error-light);
  border-color: var(--error-color);
  color: var(--error-color);
}

/* Modern table styling */
:deep(.modern-table) {
  background: transparent;
  border: none;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}
:deep(.modern-table .el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--card-gradient);
  backdrop-filter: blur(5px);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
}
:deep(.modern-table .el-table__body-wrapper) {
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
}
/* 斑马纹 */
:deep(.modern-table .el-table__row:nth-child(even) td) {
  background: var(--table-stripe-bg);
}
/* 悬停高亮 */
:deep(.modern-table .el-table__row:hover td) {
  background: var(--table-row-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px var(--shadow-light);
}
/* 操作按钮图标化 */
:deep(.action-buttons .el-button) {
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}
:deep(.action-buttons .el-button:hover) {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

/* 展开面板样式 */
.expand-panel {
  padding: 12px;
  background: var(--bg-primary);
  border: 1px dashed var(--border-light);
  border-radius: var(--border-radius-md);
}
.expand-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.expand-tools {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.expand-content {
  min-height: 40px;
}
.vehicle-tags {
  display: flex;
  flex-wrap: wrap;
}

/* 统一页头布局（补充） */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.header-actions .add-user-btn {
  min-width: 120px;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast) ease;
}

.header-actions .add-user-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Modern tag styling */
:deep(.modern-tag) {
  border-radius: var(--border-radius-md);
  font-weight: 500;
  padding: 6px 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px var(--shadow-light);
  border: 1px solid transparent;
}

:deep(.modern-tag.el-tag--danger) {
  background: var(--status-error-bg);
  border-color: var(--error-color);
  color: var(--error-color);
}

:deep(.modern-tag.el-tag--info) {
  background: var(--status-info-bg);
  border-color: var(--info-color);
  color: var(--info-color);
}

:deep(.modern-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px var(--shadow-medium);
}

/* Modern switch styling */
:deep(.modern-switch) {
  --el-switch-on-color: var(--status-success);
  --el-switch-off-color: var(--status-warning);
  position: relative;
}

:deep(.modern-switch .el-switch__core) {
  border-radius: 12px;
  box-shadow: inset 0 2px 4px var(--shadow-light);
}

:deep(.modern-switch .el-switch__core .el-switch__action) {
  border-radius: 50%;
  box-shadow: 0 2px 4px var(--shadow-medium);
  transition: all 0.3s ease;
}

:deep(.modern-switch:hover .el-switch__core .el-switch__action) {
  transform: scale(1.1);
}

/* Modern dialog styling */
:deep(.modern-dialog) {
  border-radius: var(--border-radius-xl);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-xl);
  animation: dialogFadeIn 0.3s ease-out;
}

@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

:deep(.modern-dialog .el-dialog__header) {
  padding: 24px 32px 20px;
  border-bottom: 1px solid var(--border-lighter);
  margin: 0;
  background: var(--header-gradient);
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

:deep(.modern-dialog .el-dialog__title) {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 0 1px 2px var(--shadow-light);
}

:deep(.modern-dialog .el-dialog__body) {
  padding: 32px;
}

:deep(.modern-dialog .el-dialog__footer) {
  padding: 20px 32px 24px;
  border-top: 1px solid var(--border-lighter);
  background: var(--bg-gradient);
  border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
}

/* Modern form styling */
:deep(.modern-form .el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

:deep(.modern-form .el-form-item__label:hover) {
  color: var(--primary-color);
  transform: translateX(2px);
}

:deep(.modern-form .el-input__wrapper) {
  border-radius: var(--border-radius-md);
  box-shadow: inset 0 2px 4px var(--shadow-light);
  transition: all 0.3s ease;
}

:deep(.modern-form .el-input__wrapper:hover) {
  box-shadow: inset 0 2px 6px var(--shadow-medium);
}

:deep(.modern-form .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--primary-light), inset 0 2px 4px var(--shadow-light);
}

/* Modern radio group styling */
:deep(.modern-radio-group) {
  display: flex;
  gap: var(--spacing-md);
}

:deep(.modern-radio) {
  margin: 0;
  padding: 12px 20px;
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--border-light);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px var(--shadow-light);
  font-weight: 500;
}

:deep(.modern-radio:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--shadow-medium);
  border-color: var(--primary-color);
}

:deep(.modern-radio.is-checked) {
  background: var(--primary-gradient);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px var(--shadow-primary);
  transform: translateY(-2px);
}

/* 统计卡片基础样式 */
.stats-section {
  margin-bottom: var(--spacing-xl);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-lg);
}

.stats-container {
  display: contents;
}

.stat-card {
  background: var(--card-gradient);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal) ease;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.stat-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--primary-gradient);
  transform: scaleX(0);
  transition: transform var(--transition-normal) ease;
}

.stat-card:hover::before {
  transform: scaleX(1);
}

/* 彩色圆角卡片主题（轻度着色覆盖，保证可读性） */
.stat-card.users { border-color: var(--primary-color); }
.stat-card.active { border-color: var(--success-color); }
.stat-card.blocked { border-color: var(--error-color); }
.stat-card.admins { border-color: var(--warning-color); }

.stat-card.users::before { background: var(--primary-gradient); }
.stat-card.active::before { background: var(--success-gradient); }
.stat-card.blocked::before { background: var(--error-gradient); }
.stat-card.admins::before { background: var(--warning-gradient); }

.stat-card.users::after,
.stat-card.active::after,
.stat-card.blocked::after,
.stat-card.admins::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.stat-card.users::after { background: var(--primary-gradient); opacity: 0.10; }
.stat-card.active::after { background: var(--success-gradient); opacity: 0.10; }
.stat-card.blocked::after { background: var(--error-gradient); opacity: 0.10; }
.stat-card.admins::after { background: var(--warning-gradient); opacity: 0.10; }

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-lg);
  font-size: var(--font-size-xl);
  transition: all var(--transition-normal) ease;
  position: relative;
  overflow: hidden;
}

.stat-icon.users {
  background: var(--primary-gradient);
  color: white;
}

.stat-icon.active {
  background: var(--success-gradient);
  color: white;
}

.stat-icon.blocked {
  background: var(--error-gradient);
  color: white;
}

.stat-icon.admins {
  background: var(--warning-gradient);
  color: white;
}

.stat-card:hover .stat-icon {
  transform: rotate(10deg) scale(1.1);
  box-shadow: var(--shadow-lg);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  text-shadow: 0 1px 2px var(--shadow-light);
  animation: countUp 0.6s ease-out;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* 标题区副标题卡片化（覆盖前面基础样式） */
.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.95;
  display: inline-block;
  padding: 6px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

/* Responsive design */
@media (max-width: 768px) {
  .user-management-container {
    padding: var(--spacing-md);
  }
  
  .filter-container {
    padding: var(--spacing-md);
  }
  
  .header-section {
    margin-bottom: var(--spacing-lg);
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .table-header {
    padding: var(--spacing-md);
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  :deep(.el-table) {
    font-size: 0.9rem;
  }
  
  :deep(.modern-table th),
  :deep(.modern-table td) {
    padding: 8px 4px;
  }
  
  :deep(.modern-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  :deep(.modern-radio-group) {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .stat-card {
    padding: var(--spacing-md);
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: var(--spacing-md);
  }
  
  .stat-number {
    font-size: var(--font-size-xl);
  }
  
  /* 响应式分页布局 */
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .batch-actions {
    justify-content: center;
    order: -1;
    margin-bottom: var(--spacing-sm);
  }
  
  :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  :deep(.el-pagination__jump) {
    width: 100%;
    text-align: center;
    margin: var(--spacing-xs) 0;
  }
  
  :deep(.el-pagination__jump .el-input) {
    width: 80px;
    display: inline-block;
  }
}

@media (max-width: 480px) {
  .user-management-container {
    padding: var(--spacing-sm);
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .filter-container {
    padding: var(--spacing-sm);
  }
  
  .pagination-container {
    padding: var(--spacing-md);
  }
  
  .stats-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .stat-card {
    padding: var(--spacing-md);
    flex-direction: row;
    text-align: left;
  }
  
  .stat-icon {
    margin-right: var(--spacing-md);
    margin-bottom: 0;
    width: 48px;
    height: 48px;
    font-size: var(--font-size-lg);
  }
  
  .stat-number {
    font-size: var(--font-size-lg);
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-xs);
  }
  
  .user-avatar {
    margin: 0 auto;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .edit-btn, .more-btn {
    width: 100%;
  }
}
</style>