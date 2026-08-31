<template>
  <aside class="pmc-sidebar" :class="{ collapsed, 'mobile-open': mobileOpen }">
    <!-- Logo -->
    <div class="sidebar-logo" @click="$router.push('/')">
      <span class="logo-badge">P</span>
      <span v-show="!collapsed" class="logo-text">大师哥 · PMC</span>
    </div>

    <!-- 主菜单 -->
    <div class="sidebar-scroll">
      <el-menu
        :default-active="activePath"
        :collapse="collapsed"
        :collapse-transition="false"
        class="pmc-menu"
        @select="onSelect"
      >
        <template v-for="g in topGroups" :key="g.title">
          <!-- 一级直达项（如 PMC 总览） -->
          <el-menu-item v-if="g.path" :index="g.path">
            <el-icon><component :is="g.icon || 'Odometer'" /></el-icon>
            <template #title><span>{{ g.title }}</span></template>
          </el-menu-item>
          <!-- 可折叠分组 -->
          <el-sub-menu v-else :index="g.title">
            <template #title>
              <el-icon><component :is="g.icon || 'Folder'" /></el-icon>
              <span>{{ g.title }}</span>
            </template>
            <el-menu-item v-for="it in g.items" :key="it.title" :index="resolve(it)">
              <span class="sub-title">{{ it.title }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </div>

    <!-- 底部固定：系统设置 -->
    <div class="sidebar-foot">
      <el-menu
        :default-active="activePath"
        :collapse="collapsed"
        :collapse-transition="false"
        class="pmc-menu pmc-menu-foot"
        @select="onSelect"
      >
        <el-sub-menu v-for="g in footGroups" :key="g.title" :index="g.title">
          <template #title>
            <el-icon><component :is="g.icon || 'Setting'" /></el-icon>
            <span>{{ g.title }}</span>
          </template>
          <el-menu-item v-for="it in g.items" :key="it.title" :index="resolve(it)">
            <span class="sub-title">{{ it.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { menuTree } from '../data/menu.js'

defineProps({
  collapsed: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false }
})
const emit = defineEmits(['select', 'close-mobile'])
const route = useRoute()
const router = useRouter()

const topGroups = computed(() => menuTree.filter((g) => !g.fixedBottom))
const footGroups = computed(() => menuTree.filter((g) => g.fixedBottom))

// 高亮当前页：菜单 index 与路由完整路径一致
const activePath = computed(() => route.fullPath)

function resolve(it) {
  if (it.path) return it.tab ? `${it.path}?tab=${it.tab}` : it.path
  return `/m/${it.key}`
}

function onSelect(index) {
  router.push(index)
  emit('close-mobile')
}
</script>

<style scoped>
.pmc-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 224px;
  background: linear-gradient(180deg, #101a33 0%, #16224a 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 3px 0 16px rgba(0, 10, 40, 0.35);
  transition: width 0.25s ease;
}
.pmc-sidebar.collapsed {
  width: 64px;
}
.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;
}
.logo-badge {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4d7cfe, #2f54eb);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
}
.logo-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}
.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.sidebar-foot {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}
/* 深色菜单 + 深蓝高亮 */
.pmc-menu {
  border-right: none;
  background: transparent !important;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(255, 255, 255, 0.82);
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.08);
  --el-menu-active-color: #ffffff;
  --el-menu-item-height: 44px;
}
.pmc-menu :deep(.el-menu-item),
.pmc-menu :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
}
.pmc-menu :deep(.el-menu-item:hover),
.pmc-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.pmc-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #2f54eb, #1d4ed8);
  color: #fff;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}
.pmc-menu :deep(.el-sub-menu .el-menu) {
  background: rgba(0, 0, 0, 0.22) !important;
}
.pmc-menu :deep(.el-menu-item .el-icon),
.pmc-menu :deep(.el-sub-menu__title .el-icon) {
  color: rgba(255, 255, 255, 0.85);
}
.pmc-menu-foot :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #2f54eb, #1d4ed8);
}
.sub-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 移动端：覆盖式抽屉 */
@media (max-width: 900px) {
  .pmc-sidebar {
    width: 224px;
    transform: translateX(-110%);
  }
  .pmc-sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>
