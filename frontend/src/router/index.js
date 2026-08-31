import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
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

router.afterEach((to) => {
  const t = to.meta && to.meta.title
  if (t) document.title = t + ' - 大师哥的 PMC 管理工作台'
})

export default router
