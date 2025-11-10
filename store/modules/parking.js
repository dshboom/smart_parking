import { getParkingStatus } from '@/api/vehicle'

export default {
  namespaced: true,
  actions: {
    async getStatus() {
      try {
        const resp = await getParkingStatus()
        const totalVehicles = resp?.total_vehicles ?? 0
        const totalInParking = resp?.total_in_parking ?? 0
        const availableSpots = Math.max(totalVehicles - totalInParking, 0)
        return { data: { totalVehicles, availableSpots } }
      } catch (e) {
        return Promise.reject(e)
      }
    }
  }
}