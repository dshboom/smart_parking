import { ElMessage } from 'element-plus';
import { API_CONFIG } from '@/config/api.config';
import { getToken } from '@/utils/auth';
import store from '@/store';
import router from '@/router';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.messageHandlers = new Map();
    this.eventHandlers = new Map();
    this.connectionUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnected = false;
    this.isConnecting = false;
    this.heartBeatTimeout = 30000;
  }

  async connect(url) {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    // 获取token并添加到WebSocket URL
    const token = getToken();
    if (!token) {
      return;
    }
    // 简易过期校验：解析 JWT payload 的 exp
    const isExpired = (() => {
      try {
        const parts = String(token).split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const exp = Number(payload?.exp || 0);
        if (!exp) return false;
        const now = Math.floor(Date.now() / 1000);
        return exp <= now;
      } catch (_) {
        return false;
      }
    })();
    if (isExpired) {
      console.warn('WebSocket token expired, skip connect');
      this.triggerEvent('auth_expired');
      ElMessage.error('登录已过期，实时连接未建立');
      try {
        await store.dispatch('user/resetToken');
      } catch (_) {}
      try {
        const current = router.currentRoute?.value?.fullPath || '/';
        await router.push(`/login?redirect=${encodeURIComponent(current)}`);
      } catch (_) {}
      return;
    }
    let wsUrl = url || API_CONFIG.wsUrl;
    
    if (token && !/([?&])token=/.test(wsUrl)) {
      const separator = wsUrl.includes('?') ? '&' : '?';
      wsUrl = `${wsUrl}${separator}token=${token}`;
    }

    this.connectionUrl = wsUrl;
    this.isConnecting = true;
    
    try {
      this.socket = new WebSocket(this.connectionUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    this.socket.onopen = () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.triggerEvent('connected');
      ElMessage.success('实时数据连接已建立');
    };

    this.socket.onmessage = (event) => {
      const raw = event?.data;
      let parsed = null;
      // 先尝试直接解析
      try {
        if (typeof raw === 'string') {
          parsed = JSON.parse(raw);
        } else {
          parsed = raw; // 部分环境可能直接传对象
        }
      } catch (error) {
        // 兼容后端 echo 文本：例如 "You wrote: { ... }"
        if (typeof raw === 'string') {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            const jsonStr = raw.slice(start, end + 1);
            try {
              parsed = JSON.parse(jsonStr);
            } catch (innerErr) {
              console.error('Failed to parse WebSocket JSON substring:', innerErr);
              return;
            }
          } else {
            console.error('Unsupported WebSocket message format:', raw);
            return;
          }
        } else {
          console.error('Unsupported WebSocket message type:', typeof raw);
          return;
        }
      }
      // 分发解析后的消息
      try {
        this.handleMessage(parsed);
      } catch (dispatchErr) {
        console.error('Error handling WebSocket message:', dispatchErr);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnected = false;
      this.isConnecting = false;
      this.stopHeartbeat();
      this.triggerEvent('disconnected');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.triggerEvent('error', error);
      ElMessage.error('实时数据连接出错');
    };
  }

  handleMessage(data) {
    // 支持两种消息格式：
    // 1) { type: '...', payload: {...} }
    // 2) { event: '...', ...otherProps }
    if (!data || typeof data !== 'object') {
      this.triggerEvent('message', data)
      return
    }

    let type = data.type
    let payload = data.payload

    // 兼容后端广播的 { event: 'space_occupied', space_id: 123 } 格式
    if (!type && data.event) {
      type = data.event
      payload = { ...data }
      delete payload.event
      delete payload.type
      delete payload.payload
    }

    if (type === 'heartbeat') {
      return
    }

    if (type && this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error('Error in message handler:', error)
        }
      })
    }

    this.triggerEvent('message', data)
  }

  async handleReconnect() {
    const token = getToken();
    const expired = (() => {
      try {
        const parts = String(token || '').split('.');
        if (parts.length !== 3) return !token;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const exp = Number(payload?.exp || 0);
        const now = Math.floor(Date.now() / 1000);
        return !token || (exp && exp <= now);
      } catch (_) {
        return true;
      }
    })();
    if (expired) {
      console.warn('Skip WebSocket reconnect due to missing/expired token');
      this.triggerEvent('auth_expired');
      ElMessage.error('登录已过期，请重新登录以恢复实时连接');
      try {
        await store.dispatch('user/resetToken');
      } catch (_) {}
      try {
        const current = router.currentRoute?.value?.fullPath || '/';
        await router.push(`/login?redirect=${encodeURIComponent(current)}`);
      } catch (_) {}
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      ElMessage.error('实时数据连接失败，请刷新页面重试');
      this.triggerEvent('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.connectionUrl) {
        this.connect(this.connectionUrl);
      }
    }, this.reconnectDelay);
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now()
        });
      }
    }, this.heartBeatTimeout);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(data) {
    if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }

  subscribe(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
    
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // 新增：取消订阅指定类型消息；未传 handler 时清空该类型的所有处理器
  unsubscribe(type, handler = null) {
    if (!this.messageHandlers.has(type)) return;
    if (handler) {
      const handlers = this.messageHandlers.get(type);
      if (!handlers) return;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.messageHandlers.set(type, []);
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // 可选：移除事件监听（与 on 返回的函数作用相同）
  off(event, handler = null) {
    if (!this.eventHandlers.has(event)) return;
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (!handlers) return;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.set(event, []);
    }
  }

  triggerEvent(event, data) {
    if (this.eventHandlers && this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionUrl = null;
    this.reconnectAttempts = 0;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// 创建全局WebSocket管理器实例
const wsManager = new WebSocketManager();

// 常用的消息类型订阅函数
export const subscribeToParkingUpdates = (handler) => {
  // 同时订阅两种车位事件，并在回调中补充 event 字段
  const offOccupied = wsManager.subscribe('space_occupied', (payload) => handler({ event: 'space_occupied', ...payload }))
  const offVacated = wsManager.subscribe('space_vacated', (payload) => handler({ event: 'space_vacated', ...payload }))
  return () => {
    if (typeof offOccupied === 'function') offOccupied()
    if (typeof offVacated === 'function') offVacated()
  }
};

export const subscribeToVehicleEntry = (handler) => {
  return wsManager.subscribe('vehicle_entry', handler);
};

export const subscribeToVehicleExit = (handler) => {
  return wsManager.subscribe('vehicle_exit', handler);
};

export const subscribeToReservationUpdates = (handler) => {
  // 兼容后端当前广播：space_reserved / space_unreserved
  const offReserved = wsManager.subscribe('space_reserved', (payload) => handler({ event: 'space_reserved', ...payload }))
  const offUnreserved = wsManager.subscribe('space_unreserved', (payload) => handler({ event: 'space_unreserved', ...payload }))
  // 若后端未来支持 reservation_update，可在此追加兼容订阅
  // const offReservationUpdate = wsManager.subscribe('reservation_update', handler)
  return () => {
    if (typeof offReserved === 'function') offReserved()
    if (typeof offUnreserved === 'function') offUnreserved()
    // if (typeof offReservationUpdate === 'function') offReservationUpdate()
  }
};

export const subscribeToPaymentUpdates = (handler) => {
  return wsManager.subscribe('payment_update', handler);
};

// 向后兼容的函数
const initWebSocket = (onMessageCallback) => {
  // 返回管理器以保持兼容，同时确保连接已建立
  wsManager.on('message', onMessageCallback);
  wsManager.connect();
  return wsManager;
};

const closeWebSocket = () => {
  wsManager.disconnect();
};

export { initWebSocket, closeWebSocket, wsManager };
