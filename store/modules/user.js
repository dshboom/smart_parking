import { login, logout, getInfo, register, updateMe, getMyStats, getMyVip, upgradeMyVip } from '@/api/user'
import { getUserBalance, rechargeBalance, withdrawBalance, getUserTransactions, getPaymentMethods as apiGetPaymentMethods } from '@/api/payments'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

const getDefaultState = () => {
  return {
    token: getToken(),
    name: localStorage.getItem('name') || '',
    avatar: localStorage.getItem('avatar') || '',
    status: localStorage.getItem('user_status') || '',
    vip_level: null
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
    localStorage.setItem('name', name)
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
    localStorage.setItem('avatar', avatar)
  },
  SET_STATUS: (state, status) => {
    state.status = status
    localStorage.setItem('user_status', status)
  },
  SET_VIP_LEVEL: (state, level) => {
    state.vip_level = level
  }
}

const actions = {
  // user register
  register({ commit }, userInfo) {
    const { username, phone, password } = userInfo
    return new Promise((resolve, reject) => {
      register({ username: username.trim(), phone: phone.trim(), password: password }).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user login
  login({ commit }, userInfo) {
    const { phone, password, remember } = userInfo
    return new Promise((resolve, reject) => {
      login({ phone: phone.trim(), password: password }).then(response => {
        // response is already the JSON body from backend
        commit('SET_TOKEN', response.access_token)
        setToken(response.access_token, remember)
        commit('SET_STATUS', 'user')
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token).then(response => {
        // response is already the JSON body from backend
        if (!response) {
          return reject('Verification failed, please Login again.')
        }

        const { username, role, vip_level } = response
        commit('SET_NAME', username)
        commit('SET_STATUS', role)
        commit('SET_VIP_LEVEL', Number.isFinite(vip_level) ? vip_level : 0)
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // get current user's stats
  getStats() {
    return new Promise((resolve, reject) => {
      getMyStats().then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // get current user's VIP membership
  // 为避免未开通会员时出现 404（/users/me/vip），此处增加守卫：
  // 1) 若 state.vip_level <= 0，则尝试刷新 getInfo；
  // 2) 仍无会员则直接返回 null，不请求 /me/vip；
  // 3) 有会员再请求 /me/vip 获取完整会员详情。
  getVipMe({ state, dispatch }) {
    return new Promise((resolve, reject) => {
      const run = async () => {
        // 读取当前已知的会员等级（来自 /users/me 的 vip_level）
        let level = Number(state.vip_level || 0)

        // 若未知或非会员，尝试刷新一次用户信息以获取最新 vip_level
        if (!Number.isFinite(level) || level <= 0) {
          try {
            const info = await dispatch('getInfo').catch(() => null)
            level = Number((info && info.vip_level) != null ? info.vip_level : (state.vip_level || 0))
          } catch (_) {
            // 忽略刷新失败，继续按非会员处理
          }
        }

        // 非会员：不触发 /me/vip，避免网络层 404 噪音
        if (!Number.isFinite(level) || level <= 0) {
          return resolve(null)
        }

        // 会员：请求具体会员信息
        try {
          const resp = await getMyVip()
          resolve(resp)
        } catch (error) {
          reject(error)
        }
      }

      run()
    })
  },

  // upgrade current user's VIP membership
  upgradeVip(_, plan) {
    return new Promise((resolve, reject) => {
      upgradeMyVip(plan).then(response => {
        resolve(response)
      }).catch(error => reject(error))
    })
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        removeToken() // must remove  token  first
        resetRouter()
        commit('RESET_STATE')
        localStorage.removeItem('name')
        localStorage.removeItem('avatar')
        localStorage.removeItem('user_status')
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      removeToken() // must remove  token  first
      commit('RESET_STATE')
      localStorage.removeItem('name')
      localStorage.removeItem('avatar')
      localStorage.removeItem('user_status')
      resolve()
    })
  },

  updateUserStatus({ commit }, status) {
    commit('SET_STATUS', status)
  }
  ,
  // update profile
  updateProfile({ commit }, data) {
    return new Promise((resolve, reject) => {
      updateMe(data).then(response => {
        if (response && response.username) {
          commit('SET_NAME', response.username)
        }
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // payments: get current user balance
  getBalance() {
    return new Promise((resolve, reject) => {
      getUserBalance().then(response => {
        resolve(response)
      }).catch(error => reject(error))
    })
  },

  // payments: recharge balance
  recharge(_, payload) {
    const amount = Number(payload?.amount || 0)
    const method = payload?.method || payload?.payment_method || 'balance'
    return new Promise((resolve, reject) => {
      rechargeBalance({ amount, payment_method: method }).then(response => {
        resolve(response)
      }).catch(error => reject(error))
    })
  },

  // payments: withdraw balance
  withdraw(_, payload) {
    const amount = Number(payload?.amount || 0)
    const account = payload?.account || payload?.bank_account || ''
    return new Promise((resolve, reject) => {
      withdrawBalance({ amount, bank_account: account }).then(response => {
        resolve(response)
      }).catch(error => reject(error))
    })
  },

  // payments: get transactions
  getTransactions(_, params) {
    return new Promise((resolve, reject) => {
      getUserTransactions(params || { skip: 0, limit: 20 }).then(response => {
        resolve(response)
      }).catch(error => reject(error))
    })
  },

  // payments: get payment methods
  getPaymentMethods() {
    return new Promise((resolve, reject) => {
      apiGetPaymentMethods().then(response => resolve(response)).catch(error => reject(error))
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}