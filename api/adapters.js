// API数据适配器 - 将后端数据格式转换为前端期望的格式

/**
 * 用户数据适配器
 */
export function adaptUserData(backendUser) {
  return {
    id: backendUser.id,
    username: backendUser.username || backendUser.phone_number,
    phone: backendUser.phone_number,
    email: backendUser.email,
    nickname: backendUser.nickname,
    role: backendUser.role,
    status: backendUser.status,
    phone_verified: backendUser.phone_verified,
    email_verified: backendUser.email_verified,
    created_at: backendUser.created_at,
    updated_at: backendUser.updated_at,
    last_login_at: backendUser.last_login_at
  }
}

/**
 * 车辆数据适配器
 */
export function adaptVehicleData(backendVehicle) {
  return {
    id: backendVehicle.id,
    license_plate: backendVehicle.license_plate,
    is_default: backendVehicle.is_default,
    status: backendVehicle.status,
    created_at: backendVehicle.created_at,
    updated_at: backendVehicle.updated_at,
    user_id: backendVehicle.user_id
  }
}

/**
 * 停车记录数据适配器
 */
export function adaptParkingRecord(backendRecord) {
  return {
    id: backendRecord.id,
    license_plate: backendRecord.license_plate_snapshot,
    vehicle_id: backendRecord.vehicle_id,
    parking_lot_id: backendRecord.parking_lot_id,
    entry_time: backendRecord.entry_time,
    exit_time: backendRecord.exit_time,
    fee: backendRecord.fee,
    status: backendRecord.status,
    created_at: backendRecord.created_at
  }
}

/**
 * 停车场数据适配器
 */
export function adaptParkingLot(backendLot) {
  return {
    id: backendLot.id,
    name: backendLot.name,
    address: backendLot.address,
    total_capacity: backendLot.total_capacity,
    available_spots: backendLot.available_spots,
    status: backendLot.status,
    created_at: backendLot.created_at,
    updated_at: backendLot.updated_at
  }
}

/**
 * 适配分页响应数据
 */
export function adaptPaginatedResponse(backendResponse) {
  return {
    items: backendResponse.items || backendResponse,
    total: backendResponse.total || backendResponse.length,
    skip: backendResponse.skip || 0,
    limit: backendResponse.limit || 20
  }
}