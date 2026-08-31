<template>
  <div class="tool-tabs">
    <el-tabs v-model="tab" @tab-change="onTab">
      <!-- 个人信息修改 -->
      <el-tab-pane label="个人信息修改" name="profile">
        <el-form :model="profileForm" label-width="110px" style="max-width: 560px">
          <el-form-item label="姓名"><el-input v-model="profileForm.name" /></el-form-item>
          <el-form-item label="部门"><el-input v-model="profileForm.dept" /></el-form-item>
          <el-form-item label="职务"><el-input v-model="profileForm.role" /></el-form-item>
          <el-form-item label="联系电话"><el-input v-model="profileForm.phone" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="profileForm.email" /></el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveProfile">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 密码修改设置 -->
      <el-tab-pane label="密码修改设置" name="password">
        <el-form :model="pwdForm" label-width="110px" style="max-width: 480px">
          <el-form-item label="新密码"><el-input v-model="pwdForm.pwd" type="password" show-password placeholder="设置工作台访问密码（本地模式为演示功能）" /></el-form-item>
          <el-form-item label="确认密码"><el-input v-model="pwdForm.confirm" type="password" show-password /></el-form-item>
          <el-form-item>
            <el-button type="primary" @click="savePwd">保存</el-button>
          </el-form-item>
        </el-form>
        <el-alert
          type="info"
          :closable="false"
          title="纯本地模式（localStorage）下没有真实鉴权，此密码仅作演示；部署「服务端模式」后由后端 JWT 完成真实认证。"
        />
      </el-tab-pane>

      <!-- 所有数据导出 -->
      <el-tab-pane label="所有数据导出功能" name="export">
        <el-form inline label-width="90px">
          <el-form-item label="选择模块">
            <el-select v-model="expModule" filterable style="width: 280px">
              <el-option v-for="m in allModules" :key="m.key" :label="m.group + ' / ' + m.label" :value="m.key" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="exportModule">导出该模块 CSV</el-button>
          </el-form-item>
        </el-form>
        <el-divider>全量导出</el-divider>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
          <el-button @click="exportAllJSON">导出全部数据 JSON（含设置与日志）</el-button>
          <el-button @click="exportAllCSV">导出全部模块 CSV（逐个下载）</el-button>
        </div>
      </el-tab-pane>

      <!-- 工作台基础参数配置 -->
      <el-tab-pane label="工作台基础参数配置" name="params">
        <el-form label-width="150px" style="max-width: 640px">
          <el-divider content-position="left">工厂信息</el-divider>
          <el-form-item label="工厂名称"><el-input v-model="settings.params.factoryName" /></el-form-item>
          <el-divider content-position="left">班次配置</el-divider>
          <el-form-item label="班次数">
            <el-input-number v-model="settings.params.shiftCount" :min="1" :max="4" />
          </el-form-item>
          <el-form-item label="每班工时(小时)">
            <el-input-number v-model="settings.params.shiftHours" :min="1" :max="24" />
          </el-form-item>
          <el-divider content-position="left">工厂日历</el-divider>
          <el-form-item label="工作周（勾选=上班）">
            <el-checkbox-group v-model="settings.params.workdays">
              <el-checkbox v-for="(d, i) in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="d" :label="String(i + 1)">{{ d }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="节假日（逗号分隔）">
            <el-input v-model="holidaysText" type="textarea" :rows="3" placeholder="2026-10-01,2026-10-02" />
          </el-form-item>
          <el-divider content-position="left">计划参数</el-divider>
          <el-form-item label="采购提前期(天)">
            <el-input-number v-model="settings.params.leadDays" :min="0" />
          </el-form-item>
          <el-form-item label="计划冻结期(天)">
            <el-input-number v-model="settings.params.freezeDays" :min="0" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveParams">保存参数</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 预警规则参数配置 -->
      <el-tab-pane label="预警规则参数配置" name="warn">
        <el-form label-width="190px" style="max-width: 640px">
          <el-form-item label="交期预警窗口(天, 逗号分隔)">
            <el-input v-model="warnText.deliveryDays" placeholder="7,15,30" />
          </el-form-item>
          <el-form-item label="低储触发系数(×安全库存)">
            <el-input-number v-model="settings.warnRules.stockLowRatio" :min="0.05" :max="1" :step="0.05" />
          </el-form-item>
          <el-form-item label="呆滞料档位(天, 逗号分隔)">
            <el-input v-model="warnText.slowDays" placeholder="90,180,365" />
          </el-form-item>
          <el-form-item label="产能负荷阈值(%)">
            <el-input-number v-model="settings.warnRules.capacityLoad" :min="50" :max="200" />
          </el-form-item>
          <el-form-item label="物料损耗阈值(%)">
            <el-input-number v-model="settings.warnRules.lossRate" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="设备维保提前提醒(天)">
            <el-input-number v-model="settings.warnRules.maintDays" :min="0" />
          </el-form-item>
          <el-form-item label="ECN 生效提前提醒(天)">
            <el-input-number v-model="settings.warnRules.ecnDays" :min="0" />
          </el-form-item>
          <el-form-item label="盘点周期(天)">
            <el-input-number v-model="settings.warnRules.stocktakeCycle" :min="1" />
          </el-form-item>
          <el-form-item label="采购延期判定(天)">
            <el-input-number v-model="settings.warnRules.purchaseLateDays" :min="0" />
          </el-form-item>
          <el-form-item label="工单延期判定(天)">
            <el-input-number v-model="settings.warnRules.woLateDays" :min="0" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveWarnRules">保存规则并重算预警</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 编号规则配置 -->
      <el-tab-pane label="编号规则配置" name="numbering">
        <el-table :data="numberRows" border size="small" max-height="460">
          <el-table-column prop="group" label="所属板块" width="180" />
          <el-table-column prop="label" label="模块" width="200" />
          <el-table-column label="前缀">
            <template #default="{ row }">
              <el-input v-model="row.prefix" size="small" style="width: 130px" />
            </template>
          </el-table-column>
          <el-table-column prop="seq" label="当前流水" width="110" />
        </el-table>
        <div style="margin-top: 12px">
          <el-button type="primary" @click="saveNumbering">保存编号规则</el-button>
          <span class="muted" style="margin-left: 10px">编号格式：前缀 + 年月日 + 4 位流水，如 SO202608310001</span>
        </div>
      </el-tab-pane>

      <!-- 数据备份与恢复 -->
      <el-tab-pane label="数据备份与恢复" name="backup">
        <el-alert
          type="warning"
          :closable="false"
          title="所有数据保存在浏览器 localStorage，清理浏览器缓存/更换设备前请务必先备份。建议定期导出 JSON 备份文件。"
          style="margin-bottom: 16px"
        />
        <div style="display: flex; gap: 12px; flex-wrap: wrap">
          <el-button type="primary" @click="exportAllJSON">立即备份（导出 JSON）</el-button>
          <el-button @click="restoreInput.click()">从备份恢复</el-button>
          <input ref="restoreInput" type="file" accept=".json" style="display: none" @change="restoreJSON" />
        </div>
        <div style="margin-top: 16px">
          <h4>备份记录</h4>
          <p class="muted">本地环境无法自动联网备份；建议把备份文件同步到云盘/公司服务器，满足“不上传云端、纯本地运行”要求。</p>
        </div>
      </el-tab-pane>

      <!-- 数据清空与重置 -->
      <el-tab-pane label="数据清空与重置" name="reset">
        <el-alert type="error" :closable="false" title="以下操作不可恢复，请先备份数据！" style="margin-bottom: 16px" />
        <div style="display: flex; gap: 12px; flex-wrap: wrap">
          <el-button type="danger" @click="clearAll">清空全部业务数据</el-button>
          <el-button type="danger" plain @click="resetSettings">恢复默认设置</el-button>
          <el-button type="danger" plain @click="factoryReset">恢复出厂（数据 + 设置）</el-button>
        </div>
        <p class="muted" style="margin-top: 12px">
          清空全部业务数据：删除所有模块的录入数据；恢复默认设置：重置参数/规则/编号；恢复出厂：两者都重置。
        </p>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { modules } from '../../data/modules/index.js'
import { useData, useSettings, useLogs } from '../../store/index.js'
import { exportCSV, exportJSON, parseCSV } from '../../utils/export.js'
import { runWarningEngine } from '../../utils/warning.js'

const route = useRoute()
const router = useRouter()
const dataStore = useData()
const settingsStore = useSettings()
const logsStore = useLogs()
const settings = settingsStore.settings

const allModules = modules
const tab = ref('profile')
watch(
  () => route.query.tab,
  (v) => {
    if (v && ['profile', 'password', 'export', 'params', 'warn', 'numbering', 'backup', 'reset'].includes(v)) tab.value = v
  },
  { immediate: true }
)
function onTab() {
  router.replace({ path: '/settings', query: { tab: tab.value } })
}

/* 个人信息 */
const profileForm = ref({ ...(settings.profile || {}) })
function saveProfile() {
  settingsStore.patch('profile', { ...profileForm.value })
  logsStore.add('修改', '个人信息', profileForm.value.name)
  ElMessage.success('个人信息已保存')
}

/* 密码 */
const pwdForm = ref({ pwd: '', confirm: '' })
function savePwd() {
  if (!pwdForm.value.pwd) return ElMessage.warning('请输入密码')
  if (pwdForm.value.pwd !== pwdForm.value.confirm) return ElMessage.warning('两次输入的密码不一致')
  settingsStore.patch('password', { pwd: pwdForm.value.pwd })
  logsStore.add('修改', '密码设置', '已更新')
  ElMessage.success('密码已保存（本地模式为演示）')
  pwdForm.value = { pwd: '', confirm: '' }
}

/* 导出 */
const expModule = ref('sales_order')
function exportModule() {
  const m = modules.find((x) => x.key === expModule.value)
  if (!m) return
  exportCSV(`${m.label}.csv`, m.fields, dataStore.records(m.key))
  logsStore.add('导出', m.label, `${dataStore.records(m.key).length} 条`)
  ElMessage.success('已导出')
}
function exportAllJSON() {
  const data = { version: 1, exportedAt: new Date().toISOString(), data: dataStore.data, settings: settingsStore.settings, logs: logsStore.logs }
  exportJSON(`PMC_全量备份_${new Date().toISOString().slice(0, 10)}.json`, data)
  logsStore.add('备份', '全部数据', 'JSON 全量导出')
}
function exportAllCSV() {
  for (const m of modules) {
    const rows = dataStore.records(m.key)
    if (rows.length) exportCSV(`${m.label}.csv`, m.fields, rows)
  }
  ElMessage.success('已逐个导出所有非空模块 CSV')
}

/* 基础参数 */
const holidaysText = ref((settings.params.holidays || []).join(','))
function saveParams() {
  settings.params.holidays = holidaysText.value.split(/[,，\s]+/).filter(Boolean)
  settingsStore._persist()
  logsStore.add('修改', '基础参数', '已保存')
  ElMessage.success('基础参数已保存')
}

/* 预警规则 */
const warnText = ref({ deliveryDays: (settings.warnRules.deliveryDays || []).join(','), slowDays: (settings.warnRules.slowDays || []).join(',') })
function saveWarnRules() {
  settings.warnRules.deliveryDays = warnText.value.deliveryDays.split(/[,，\s]+/).map(Number).filter((n) => !isNaN(n) && n > 0)
  settings.warnRules.slowDays = warnText.value.slowDays.split(/[,，\s]+/).map(Number).filter((n) => !isNaN(n) && n > 0)
  settingsStore._persist()
  runWarningEngine(dataStore, settings)
  logsStore.add('修改', '预警规则', '已保存并重算')
  ElMessage.success('预警规则已保存，已重新计算预警')
}

/* 编号规则 */
const numberRows = computed(() =>
  modules.map((m) => ({
    key: m.key,
    group: m.group,
    label: m.label,
    prefix: settings.numberRules.prefix[m.key] || '',
    seq: settings.numberRules.seq[m.key] || 0
  }))
)
function saveNumbering() {
  for (const r of numberRows.value) {
    if (r.prefix) settings.numberRules.prefix[r.key] = r.prefix
  }
  settingsStore._persist()
  logsStore.add('修改', '编号规则', '已保存')
  ElMessage.success('编号规则已保存')
}

/* 备份恢复 */
const restoreInput = ref(null)
function restoreJSON(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result))
      if (!obj || !obj.data) throw new Error('无效备份文件')
      ElMessageBox.confirm('恢复将覆盖当前全部数据，确定继续？', '恢复确认', { type: 'warning' })
        .then(() => {
          dataStore.setAll(obj.data)
          if (obj.settings) settingsStore.patchDeep(obj.settings)
          if (obj.logs) logsStore.logs = obj.logs
          ElMessage.success('恢复成功')
          logsStore.add('恢复', '全部数据', '从备份恢复')
        })
        .catch(() => {})
    } catch (err) {
      ElMessage.error('恢复失败：' + err.message)
    }
  }
  reader.readAsText(file, 'utf-8')
}

/* 重置 */
function clearAll() {
  ElMessageBox.prompt('请输入「清空」确认清空全部业务数据：', '危险操作', {
    type: 'warning',
    inputPattern: /^清空$/,
    inputErrorMessage: '请输入「清空」'
  })
    .then(({ value }) => {
      if (value === '清空') {
        dataStore.resetAll()
        logsStore.add('重置', '全部业务数据', '已清空')
        ElMessage.success('已清空全部业务数据')
      }
    })
    .catch(() => {})
}
function resetSettings() {
  ElMessageBox.confirm('确定恢复默认设置吗？（不影响业务数据）', '确认', { type: 'warning' })
    .then(() => {
      settingsStore.reset()
      ElMessage.success('已恢复默认设置')
    })
    .catch(() => {})
}
function factoryReset() {
  ElMessageBox.prompt('请输入「重置」恢复出厂（清空数据+设置）：', '危险操作', {
    type: 'warning',
    inputPattern: /^重置$/,
    inputErrorMessage: '请输入「重置」'
  })
    .then(({ value }) => {
      if (value === '重置') {
        dataStore.resetAll()
        settingsStore.reset()
        logsStore.clear()
        ElMessage.success('已恢复出厂设置')
      }
    })
    .catch(() => {})
}
</script>

<style scoped>
.muted {
  font-size: 12px;
  color: #909399;
}
h4 {
  margin: 0 0 8px;
}
</style>
