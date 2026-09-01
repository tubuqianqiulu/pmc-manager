import { createRouter, createWebHashHistory } from 'vue-router'
import { isServer, getToken } from '../utils/mode'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginPage.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/auth/RegisterPage.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: 'PMC 总览' } },
      // 通用 CRUD 页面：/m/:key 根据模块配置渲染
      { path: 'm/:key', name: 'module', component: () => import('../components/CrudPage.vue'), props: (route) => ({ moduleKey: route.params.key }), meta: { title: '模块' } },
      // 辅助工具
      { path: 'tools', name: 'tools', component: () => import('../views/tools/CalcTools.vue'), meta: { title: '辅助工具' } },
      { path: 'utils', name: 'utils', component: () => import('../views/tools/UtilityTools.vue'), meta: { title: '工具' } },
      // 系统设置
      { path: 'settings', name: 'settings', component: () => import('../views/settings/SettingsPage.vue'), meta: { title: '系统设置' } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 登录守卫：server 模式必须登录后才能进入工作台
router.beforeEach((to) => {
  if (!isServer()) return true
  const token = getToken()
  const isAuthPage = to.path === '/login' || to.path === '/register'
  if (!token && !isAuthPage) return '/login'
  if (token && isAuthPage) return '/'
  return true
})

router.afterEach((to) => {
  const t = to.meta && to.meta.title
  if (t) document.title = t + ' - 大师哥的 PMC 管理工作台'
})

export default router
