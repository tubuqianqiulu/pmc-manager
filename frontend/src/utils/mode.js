// 运行模式：local = 纯本地 localStorage；server = 连接 FastAPI 后端（需登录）
export const isServer = () => import.meta.env.VITE_MODE === 'server'

// 当前登录用户信息（server 模式登录后写入 localStorage）
export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('pmc_user') || 'null')
  } catch (e) {
    return null
  }
}

export function isAdmin() {
  const u = currentUser()
  return !!(u && u.role === 'admin')
}

export function getToken() {
  return localStorage.getItem('pmc_token') || ''
}

export function setAuth(token, user) {
  if (token) localStorage.setItem('pmc_token', token)
  if (user) localStorage.setItem('pmc_user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('pmc_token')
  localStorage.removeItem('pmc_user')
}
