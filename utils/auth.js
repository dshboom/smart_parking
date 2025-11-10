const TokenKey = 'vue_admin_template_token'

export function getToken() {
  return sessionStorage.getItem(TokenKey) || localStorage.getItem(TokenKey)
}

export function setToken(token, remember) {
  if (remember) {
    return localStorage.setItem(TokenKey, token)
  } else {
    return sessionStorage.setItem(TokenKey, token)
  }
}

export function removeToken() {
  sessionStorage.removeItem(TokenKey)
  localStorage.removeItem(TokenKey)
}