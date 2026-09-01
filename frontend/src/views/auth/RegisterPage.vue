<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo">P</div>
      <h1 class="auth-title">注册账号</h1>
      <p class="auth-sub">注册后即可登录使用共享工作台</p>
      <el-form :model="form" @keyup.enter="doRegister" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="3-20 位字母/数字/下划线" :prefix-icon="User" size="large" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="至少 6 位" :prefix-icon="Lock" size="large" autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="form.confirm" type="password" show-password placeholder="再次输入密码" :prefix-icon="Lock" size="large" autocomplete="new-password" />
        </el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="doRegister">
          注 册
        </el-button>
      </el-form>
      <div class="auth-foot">
        已有账号？
        <router-link to="/login" class="auth-link">返回登录</router-link>
      </div>
      <p class="auth-tip">注册后仅能查看和管理自己添加的数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '../../api'
import { setAuth } from '../../utils/mode'

const router = useRouter()
const form = ref({ username: '', password: '', confirm: '' })
const loading = ref(false)

async function doRegister() {
  const u = form.value.username.trim()
  if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) return ElMessage.warning('用户名需为 3-20 位字母/数字/下划线')
  if (form.value.password.length < 6) return ElMessage.warning('密码至少 6 位')
  if (form.value.password !== form.value.confirm) return ElMessage.warning('两次输入的密码不一致')
  loading.value = true
  try {
    await authApi.register(u, form.value.password)
    // 注册成功自动登录
    const res = await authApi.login(u, form.value.password)
    setAuth(res.access_token, res.user)
    ElMessage.success(`注册成功，欢迎 ${u}`)
    router.push('/')
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.detail) || '注册失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #101a33 0%, #1b2a5a 55%, #24437f 100%);
  padding: 16px;
}
.auth-card {
  width: 400px;
  max-width: 100%;
  background: #fff;
  border-radius: 14px;
  padding: 36px 34px 28px;
  box-shadow: 0 16px 48px rgba(0, 10, 40, 0.4);
}
.auth-logo {
  width: 58px;
  height: 58px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4d7cfe, #2f54eb);
  color: #fff;
  font-size: 30px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.auth-title {
  text-align: center;
  font-size: 18px;
  color: #1f2d3d;
  margin: 0 0 4px;
}
.auth-sub {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin: 0 0 24px;
}
.auth-foot {
  text-align: center;
  margin-top: 18px;
  font-size: 13px;
  color: #606266;
}
.auth-link {
  color: #2f54eb;
  font-weight: 600;
  text-decoration: none;
}
.auth-tip {
  text-align: center;
  margin: 16px 0 0;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
