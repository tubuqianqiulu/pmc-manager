<template>
  <div class="pmc-layout">
    <Sidebar :collapsed="collapsed" :mobile-open="mobileOpen" @select="onSidebarSelect" />
    <div v-if="mobileOpen" class="pmc-mask" @click="mobileOpen = false"></div>

    <div class="pmc-main" :class="{ collapsed }">
      <TopBar :collapsed="collapsed" @toggle="toggleSidebar" />
      <main class="pmc-content">
        <router-view v-slot="{ Component }">
          <keep-alive :max="12">
            <component :is="Component" :key="$route.fullPath" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'
import { useData, useSettings } from '../store/index.js'
import { runWarningEngine } from '../utils/warning.js'
import { seedIfEmpty } from '../data/seed.js'
import { loadJSON, saveJSON } from '../utils/storage.js'
import { isServer } from '../utils/mode.js'

const route = useRoute()
const dataStore = useData()
const settingsStore = useSettings()

const collapsed = ref(loadJSON('pmc_ui', {}).collapsed || false)
const mobileOpen = ref(false)

function toggleSidebar() {
  if (window.innerWidth <= 900) {
    mobileOpen.value = !mobileOpen.value
  } else {
    collapsed.value = !collapsed.value
    const ui = loadJSON('pmc_ui', {})
    ui.collapsed = collapsed.value
    saveJSON('pmc_ui', ui)
  }
}
function onSidebarSelect() {
  mobileOpen.value = false
}

onMounted(() => {
  // 服务端模式：数据从后端加载，不走本地播种与本地预警引擎
  if (isServer()) return
  seedIfEmpty(dataStore)
  runWarningEngine(dataStore, settingsStore.settings)
})

// 数据变化后延迟重新计算预警（防抖）—— 仅本地模式
let warnTimer = null
watch(
  () => dataStore.data,
  () => {
    if (isServer()) return
    clearTimeout(warnTimer)
    warnTimer = setTimeout(() => runWarningEngine(dataStore, settingsStore.settings), 1500)
  },
  { deep: true }
)

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  }
)
</script>

<style scoped>
.pmc-main {
  margin-left: 224px;
  transition: margin-left 0.25s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
}
.pmc-main.collapsed {
  margin-left: 64px;
}
.pmc-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
}
@media (max-width: 900px) {
  .pmc-main,
  .pmc-main.collapsed {
    margin-left: 0;
  }
}
</style>
