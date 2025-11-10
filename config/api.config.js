// API配置 - 根据当前域名自动选择后端地址
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  
  // 如果是本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost:8000`;
  }
  
  // 如果是前端穿透域名，使用后端的穿透域名
  if (hostname === 'mypc.hyan5216.pics') {
    return `${protocol}//mypcapi.hyan5216.pics`;
  }
  
  // 默认返回本地地址
  return `${protocol}//localhost:8000`;
};

const getWebSocketUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // 如果是本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost:8000/ws`;
  }
  
  // 如果是前端穿透域名，使用后端的穿透域名
  if (hostname === 'mypc.hyan5216.pics') {
    return `${protocol}//mypcapi.hyan5216.pics/ws`;
  }
  
  // 默认返回本地地址
  return `${protocol}//localhost:8000/ws`;
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  wsUrl: getWebSocketUrl()
};