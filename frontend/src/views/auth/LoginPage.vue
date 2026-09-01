<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo">P</div>
      <h1 class="auth-title">大师哥的 PMC 管理工作台</h1>
      <p class="auth-sub">登录后使用共享工作台</p>
      <el-form :model="form" @keyup.enter="doLogin" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" size="large" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" size="large" autocomplete="current-password" />
        </el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="doLogin">
          登 录
        </el-button>
      </el-form>
      <div class="auth-foot">
        还没有账号？
        <router-link to="/register" class="auth-link">立即注册</router-link>
      </div>
      <p class="auth-tip">管理员账号 admin（超级用户，可管理全部数据）</p>
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
const form = ref({ username: 'admin', password: '' })
const loading = ref(false)

async function doLogin() {
  if (!form.value.username.trim() || !form.value.password) {
    return ElMessage.warning('请输入用户名和密码')
  }
  loading.value = true
  try {
    const res = await authApi.login(form.value.username.trim(), form.value.password)
    setAuth(res.access_token, res.user)
    ElMessage.success(`欢迎回来，${(res.user && res.user.name) || res.user.username}`)
    router.push('/')
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.detail) || '登录失败，请检查用户名和密码'
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
  letter-spacing: 0.5px;
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
