import { vehicleEntry, getVehicles } from '@/api/vehicle'

export default {
  namespaced: true,
  actions: {
    // 车辆入场
    entry(_, payload) {
      const license_plate = payload?.license_plate || payload?.plate_number
      return vehicleEntry({ license_plate })
    },

    // 最近入场记录（客户端排序，取前5条）
    async getRecentEntries() {
      try {
        const resp = await getVehicles()
        const list = Array.isArray(resp) ? resp : (resp?.items || resp?.data?.items || resp?.data || [])
        const sorted = list
          .filter(v => v && v.entry_time)
          .sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time))
        return { data: sorted.slice(0, 5) }
      } catch (e) {
        return Promise.reject(e)
      }
    }
  }
}