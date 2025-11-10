import { createStore } from 'vuex'
import user from './modules/user'
import vehicle from './modules/vehicle'
import parking from './modules/parking'
import getters from './getters'

export default createStore({
  modules: {
    user,
    vehicle,
    parking
  },
  getters
})