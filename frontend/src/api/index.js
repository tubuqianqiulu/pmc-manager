// 服务端模式 API 客户端（VITE_MODE=server 时使用）
// 说明：默认纯本地模式（localStorage）不使用本文件；切换服务端模式后，
// 各页面可调用此处封装的接口完成登录与模块 CRUD。
import axios from 'axios'

const base = import.meta.env.VITE_API_BASE || '/api'

const http = axios.create({ baseURL: base, timeout: 30000 })

// 请求拦截：自动附带 JWT
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('pmc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截：401 统一提示
http.interceptors.response.use(
  (r) => r.data,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('pmc_token')
      // 可在此跳转登录页
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (username, password) => http.post('/auth/login', { username, password }),
  me: () => http.get('/auth/me')
}

export const pmcApi = {
  list: (module, params = {}) => http.get(`/pmc/${module}`, { params }),
  create: (module, data) => http.post(`/pmc/${module}`, { data }),
  update: (module, id, data) => http.put(`/pmc/${module}/${id}`, { data }),
  remove: (module, id) => http.delete(`/pmc/${module}/${id}`),
  archive: (module, id) => http.patch(`/pmc/${module}/${id}/archive`),
  exportCsv: (module) => http.get(`/pmc/export/${module}`, { responseType: 'blob' })
}

export const warningApi = {
  list: (params = {}) => http.get('/warnings', { params }),
  recalc: () => http.post('/warnings/recalc'),
  handle: (id, status) => http.patch(`/warnings/${id}/handle`, { status })
}

export const reportApi = {
  overview: () => http.get('/reports/overview'),
  moduleSummary: (module) => http.get(`/reports/module/${module}/summary`)
}

export default http
