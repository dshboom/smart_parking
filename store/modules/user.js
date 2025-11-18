import { login, logout, getInfo, register, updateMe, getMyStats } from '@/api/user'
import { getUserBalance, rechargeBalance, withdrawBalance, getUserTransactions, getPaymentMethods as apiGetPaymentMethods } from '@/api/payments'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

const getDefaultState = () => {
  return {
    id: Number(localStorage.getItem('user_id') || 0),
    token: getToken(),
    name: localStorage.getItem('name') || '',
    avatar: localStorage.getItem('avatar') || '',
    status: localStorage.getItem('user_status') || '',
    // 移除VIP相关状态
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_ID: (state, id) => {
    state.id = Number(id || 0)
    localStorage.setItem('user_id', String(state.id))
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
  // 移除VIP等级 mutation
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

        const { id, username, role } = response
        commit('SET_ID', id)
        commit('SET_NAME', username)
        commit('SET_STATUS', role)
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

  // 移除VIP相关动作

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