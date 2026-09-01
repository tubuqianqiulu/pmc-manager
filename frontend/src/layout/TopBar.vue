<template>
  <header class="pmc-topbar">
    <div class="tb-left">
      <el-icon class="tb-btn" @click="$emit('toggle')"><Expand v-if="collapsed" /><Fold v-else /></el-icon>
      <span class="tb-app-title">大师哥的 PMC 管理工作台</span>
    </div>
    <div class="tb-right">
      <span class="tb-mode" :class="mode">{{ mode === 'server' ? '服务端模式' : '纯本地模式' }}</span>
      <span class="tb-save" v-if="savedAt">已自动保存 {{ savedAt }}</span>
      <span class="tb-date">{{ today }}</span>
      <template v-if="isServer">
        <el-avatar :size="28" class="tb-avatar">{{ (user && (user.name || user.username) || '师').slice(0, 1) }}</el-avatar>
        <span class="tb-user">{{ (user && (user.name || user.username)) || '' }}</span>
        <el-tag v-if="user && user.role === 'admin'" size="small" type="danger" effect="plain">超级用户</el-tag>
        <el-tag v-else size="small" type="info" effect="plain">普通用户</el-tag>
        <el-button link type="danger" size="small" @click="logout">退出</el-button>
      </template>
      <template v-else>
        <el-avatar :size="28" class="tb-avatar">{{ (profile.name || '师').slice(0, 1) }}</el-avatar>
        <span class="tb-user">{{ profile.name || '大师哥' }}</span>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { useData, useSettings } from '../store/index.js'
import { isServer, currentUser, clearAuth } from '../utils/mode.js'

defineProps({
  collapsed: { type: Boolean, default: false }
})
defineEmits(['toggle'])

const router = useRouter()
const dataStore = useData()
const settingsStore = useSettings()
const { settings } = storeToRefs(settingsStore)
const savedAt = computed(() => dataStore.savedAt)
const profile = computed(() => settings.value.profile || {})
const mode = import.meta.env.VITE_MODE || 'local'
const user = computed(() => currentUser())

function logout() {
  ElMessageBox.confirm('确定退出登录吗？', '退出确认', { type: 'warning' })
    .then(() => {
      clearAuth()
      router.push('/login')
    })
    .catch(() => {})
}

const today = ref(
  new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
)
</script>

<style scoped>
.pmc-topbar {
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}
.tb-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tb-btn {
  font-size: 20px;
  cursor: pointer;
  color: #4a5568;
  padding: 6px;
  border-radius: 6px;
}
.tb-btn:hover {
  background: #f0f2f5;
}
.tb-app-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f2d3d;
  letter-spacing: 0.5px;
}
.tb-right {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: #606266;
}
.tb-mode {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}
.tb-mode.local {
  background: #e8f5e9;
  color: #2e7d32;
}
.tb-mode.server {
  background: #e3f2fd;
  color: #1565c0;
}
.tb-save {
  color: #67c23a;
  font-size: 12px;
}
.tb-date {
  color: #909399;
}
.tb-avatar {
  background: linear-gradient(135deg, #4d7cfe, #2f54eb);
  color: #fff;
}
@media (max-width: 900px) {
  .tb-app-title {
    font-size: 15px;
  }
  .tb-save,
  .tb-date,
  .tb-user {
    display: none;
  }
}
</style>
