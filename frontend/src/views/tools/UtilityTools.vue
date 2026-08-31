<template>
  <div class="tool-tabs">
    <el-tabs v-model="tab" @tab-change="onTab">
      <!-- 条码单号生成器 -->
      <el-tab-pane label="条码单号生成器" name="barcode">
        <div style="max-width: 680px">
          <el-form inline label-width="90px">
            <el-form-item label="业务类型">
              <el-select v-model="bc.type" style="width: 220px">
                <el-option v-for="t in bcTypes" :key="t.key" :label="t.label" :value="t.key" />
              </el-select>
            </el-form-item>
            <el-form-item label="自定义前缀">
              <el-input v-model="bc.customPrefix" placeholder="留空使用默认前缀" style="width: 180px" />
            </el-form-item>
            <el-form-item label="生成数量">
              <el-input-number v-model="bc.count" :min="1" :max="50" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="genBarcodes">生成</el-button>
              <el-button @click="bc.list = []">清空</el-button>
            </el-form-item>
          </el-form>
          <div class="code-list">
            <div v-for="(c, i) in bc.list" :key="i" class="code-item">
              <span class="code">{{ c }}</span>
              <el-tag size="small" effect="plain">可用</el-tag>
              <el-button link type="primary" size="small" @click="copy(c)">复制</el-button>
            </div>
            <el-empty v-if="!bc.list.length" description="点击“生成”得到业务单号（自动持久化流水）" :image-size="60" />
          </div>
        </div>
      </el-tab-pane>

      <!-- 日历视图 -->
      <el-tab-pane label="日历视图" name="calendar">
        <div class="cal-head">
          <el-button-group>
            <el-button @click="calPrev">‹</el-button>
            <el-button @click="calToday">今天</el-button>
            <el-button @click="calNext">›</el-button>
          </el-button-group>
          <span class="cal-title">{{ calYear }} 年 {{ calMonth + 1 }} 月</span>
          <div class="cal-legend">
            <span v-for="lg in calLegend" :key="lg.label"><i :style="{ background: lg.color }"></i>{{ lg.label }}</span>
          </div>
        </div>
        <div class="cal-grid">
          <div v-for="wd in ['一', '二', '三', '四', '五', '六', '日']" :key="wd" class="cal-wd">{{ wd }}</div>
          <div
            v-for="(cell, i) in calCells"
            :key="i"
            class="cal-cell"
            :class="{ 'is-today': cell.isToday, 'is-other': cell.other }"
            @click="cell.events.length && openDay(cell)"
          >
            <div class="cal-day">{{ cell.day }}</div>
            <div class="cal-events">
              <div v-for="(ev, j) in cell.events.slice(0, 3)" :key="j" class="cal-ev" :style="{ background: ev.color }" :title="ev.text">
                {{ ev.text }}
              </div>
              <span v-if="cell.events.length > 3" class="cal-more">+{{ cell.events.length - 3 }}</span>
            </div>
          </div>
        </div>
        <el-dialog v-model="dayDialog" :title="'当日安排 - ' + selectedDate" width="520px">
          <div v-for="(ev, i) in selectedEvents" :key="i" class="day-event">
            <i :style="{ background: ev.color }"></i>
            <span>{{ ev.text }}</span>
          </div>
        </el-dialog>
      </el-tab-pane>

      <!-- 数据批量导入导出 -->
      <el-tab-pane label="数据批量导入导出" name="import">
        <div style="max-width: 760px">
          <el-form inline label-width="80px">
            <el-form-item label="选择模块">
              <el-select v-model="ie.module" filterable style="width: 260px">
                <el-option v-for="m in allModules" :key="m.key" :label="m.group + ' / ' + m.label" :value="m.key" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="ieExport">导出该模块 CSV</el-button>
              <el-button @click="ieFile.click()">导入该模块 CSV</el-button>
            </el-form-item>
          </el-form>
          <el-input ref="ieFile" type="file" accept=".csv,.txt" style="display: none" @change="ieImport" />
          <el-divider>全局数据</el-divider>
          <div class="ie-global">
            <el-button type="primary" @click="exportAllJSON">导出全部数据(JSON 备份)</el-button>
            <el-button @click="restoreFile.click()">恢复全部数据(JSON)</el-button>
            <input ref="restoreFile" type="file" accept=".json" style="display: none" @change="restoreJSON" />
            <span class="muted">备份/恢复包含所有模块数据与设置，可在“系统设置”中操作。</span>
          </div>
        </div>
      </el-tab-pane>

      <!-- 数据对比工具 -->
      <el-tab-pane label="数据对比工具" name="compare">
        <div style="max-width: 860px">
          <el-form inline>
            <el-form-item label="对比模块">
              <el-select v-model="cp.module" filterable style="width: 240px">
                <el-option v-for="m in allModules" :key="m.key" :label="m.label" :value="m.key" />
              </el-select>
            </el-form-item>
            <el-form-item label="指标 A">
              <el-select v-model="cp.colA" style="width: 160px">
                <el-option v-for="f in cpFields" :key="f.key" :label="f.label" :value="f.key" />
              </el-select>
            </el-form-item>
            <el-form-item label="指标 B">
              <el-select v-model="cp.colB" style="width: 160px">
                <el-option v-for="f in cpFields" :key="f.key" :label="f.label" :value="f.key" />
              </el-select>
            </el-form-item>
            <el-form-item label="标识列">
              <el-select v-model="cp.labelCol" style="width: 160px">
                <el-option v-for="f in cpFields" :key="f.key" :label="f.label" :value="f.key" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-alert
            type="info"
            :closable="false"
            title="可用于“计划 vs 实际”（选择 计划数量/实际数量）、“本期 vs 上期”（选择对应数值列），或任意两列对比。"
            style="margin-bottom: 12px"
          />
          <el-table :data="cpRows" border size="small" max-height="420">
            <el-table-column :prop="cp.labelCol" label="标识" min-width="120" />
            <el-table-column :prop="cp.colA" label="指标 A" width="130" />
            <el-table-column :prop="cp.colB" label="指标 B" width="130" />
            <el-table-column label="差值 (B-A)" width="130">
              <template #default="{ row }">
                <span :style="{ color: row.diff > 0 ? '#67c23a' : row.diff < 0 ? '#f56c6c' : '#909399' }">{{ row.diff }}</span>
              </template>
            </el-table-column>
            <el-table-column label="差异率" width="120">
              <template #default="{ row }">
                {{ row.pct == null ? '—' : (row.pct * 100).toFixed(1) + '%' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 操作日志记录 -->
      <el-tab-pane label="操作日志记录" name="logs">
        <div class="log-head">
          <el-input v-model="logKw" placeholder="搜索操作/对象/详情" clearable style="width: 240px" :prefix-icon="SearchIcon" />
          <el-button type="danger" plain @click="clearLogs">清空日志</el-button>
          <el-button @click="exportLogs">导出日志 CSV</el-button>
        </div>
        <el-table :data="filteredLogs" border size="small" max-height="480">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="op" label="操作" width="120">
            <template #default="{ row }"><el-tag size="small">{{ row.op }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="target" label="对象" width="180" />
          <el-table-column prop="detail" label="详情" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import { modules } from '../../data/modules/index.js'
import { useData, useLogs, useSettings } from '../../store/index.js'
import { genNo, defaultPrefix, exportCSV, exportJSON, parseCSV, mapImportRows, download } from '../../utils/export.js'
import { loadJSON, saveJSON } from '../../utils/storage.js'

const route = useRoute()
const router = useRouter()
const dataStore = useData()
const logsStore = useLogs()
const settingsStore = useSettings()

const tab = ref('barcode')
watch(
  () => route.query.tab,
  (v) => {
    if (v && ['barcode', 'calendar', 'import', 'compare', 'logs'].includes(v)) tab.value = v
  },
  { immediate: true }
)
function onTab() {
  router.replace({ path: '/utils', query: { tab: tab.value } })
}

const allModules = modules

/* ============ 条码生成 ============ */
const bcTypes = [
  { key: 'sales', label: '销售订单 SO' },
  { key: 'work', label: '生产工单 WO' },
  { key: 'purchase', label: '采购订单 PO' },
  { key: 'material', label: '物料需求 MR' },
  { key: 'stocktake', label: '盘点单 ST' },
  { key: 'quality', label: '品质单 QC' },
  { key: 'outsource', label: '委外单 OS' }
]
const bc = ref({ type: 'sales', customPrefix: '', count: 10, list: loadJSON('pmc_codes', []) })
function genBarcodes() {
  const rules = settingsStore.settings.numberRules
  if (bc.value.customPrefix) {
    rules.prefix['__custom'] = bc.value.customPrefix
  }
  const list = []
  for (let i = 0; i < bc.value.count; i++) {
    list.push(genNo(bc.value.type, rules))
  }
  bc.value.list = [...list, ...bc.value.list].slice(0, 200)
  saveJSON('pmc_codes', bc.value.list)
  settingsStore._persist()
  ElMessage.success(`已生成 ${list.length} 个单号`)
}
async function copy(code) {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('已复制：' + code)
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}

/* ============ 日历 ============ */
const now = new Date()
const calYear = ref(now.getFullYear())
const calMonth = ref(now.getMonth())
const dayDialog = ref(false)
const selectedDate = ref('')
const selectedEvents = ref([])
const calLegend = [
  { label: '工单', color: '#2f54eb' },
  { label: '交期', color: '#e6a23c' },
  { label: '维保', color: '#67c23a' },
  { label: '盘点', color: '#909399' },
  { label: '待办/提醒', color: '#f56c6c' }
]

function collectEvents() {
  const evs = []
  const push = (date, text, color, type) => {
    if (date) evs.push({ date: String(date).slice(0, 10), text: `[${type}] ${text}`, color })
  }
  for (const w of dataStore.records('work_order')) {
    push(w['计划开工'], w['工单号'] + ' 开工', '#2f54eb', '工单')
    push(w['计划完工'], w['工单号'] + ' 完工', '#2f54eb', '工单')
  }
  for (const s of dataStore.records('sales_order')) push(s['承诺交期'], s['订单号'] + ' 交期', '#e6a23c', '交期')
  for (const e of dataStore.records('equipment')) push(e['下次维保'], e['设备名称'] + ' 维保', '#67c23a', '维保')
  for (const s of dataStore.records('stocktake')) push(s['盘点日期'], s['盘点单号'] + ' 盘点', '#909399', '盘点')
  for (const t of dataStore.records('todo')) push(t['日期'], t['事项内容'], '#f56c6c', '待办')
  for (const i of dataStore.records('important')) push(i['提醒日期'], i['事项'], '#f56c6c', '提醒')
  return evs
}

const calCells = computed(() => {
  const first = new Date(calYear.value, calMonth.value, 1)
  // 周一为一周开始：getDay() 0=周日 → 前面空 (getDay()+6)%7
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const evs = collectEvents()
  const todayStr = new Date().toISOString().slice(0, 10)
  const cells = []
  for (let i = 0; i < lead; i++) cells.push({ day: '', other: true, events: [] })
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear.value}-${String(calMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date: ds, isToday: ds === todayStr, other: false, events: evs.filter((e) => e.date === ds) })
  }
  return cells
})
function calPrev() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- } else calMonth.value--
}
function calNext() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ } else calMonth.value++
}
function calToday() {
  calYear.value = new Date().getFullYear()
  calMonth.value = new Date().getMonth()
}
function openDay(cell) {
  selectedDate.value = cell.date
  selectedEvents.value = cell.events
  dayDialog.value = true
}

/* ============ 导入导出 ============ */
const ie = ref({ module: 'sales_order' })
const ieFile = ref(null)
const restoreFile = ref(null)
function ieExport() {
  const m = modules.find((x) => x.key === ie.value.module)
  if (!m) return
  exportCSV(`${m.label}.csv`, m.fields, dataStore.records(m.key))
  ElMessage.success('已导出')
}
function ieImport(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const m = modules.find((x) => x.key === ie.value.module)
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const rows = parseCSV(String(reader.result))
      const mapped = mapImportRows(rows[0], rows.slice(1), m.fields)
      const n = dataStore.importRows(m.key, mapped)
      ElMessage.success(`导入 ${n} 条`)
    } catch (err) {
      ElMessage.error('导入失败：' + err.message)
    }
  }
  reader.readAsText(file, 'utf-8')
}
function exportAllJSON() {
  const data = { version: 1, exportedAt: new Date().toISOString(), data: dataStore.data, settings: settingsStore.settings, logs: logsStore.logs }
  exportJSON(`PMC_全量备份_${new Date().toISOString().slice(0, 10)}.json`, data)
  logsStore.add('备份', '全部数据', '导出 JSON 全量备份')
}
function restoreJSON(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result))
      if (!obj || !obj.data) throw new Error('不是有效的备份文件')
      dataStore.setAll(obj.data)
      if (obj.settings) settingsStore.patchDeep(obj.settings)
      if (obj.logs) logsStore.logs = obj.logs
      ElMessage.success('恢复成功！数据已从备份载入')
      logsStore.add('恢复', '全部数据', '从 JSON 备份恢复')
    } catch (err) {
      ElMessage.error('恢复失败：' + err.message)
    }
  }
  reader.readAsText(file, 'utf-8')
}

/* ============ 对比工具 ============ */
const cp = ref({ module: 'month_plan', colA: '', colB: '', labelCol: '' })
const cpFields = computed(() => {
  const m = modules.find((x) => x.key === cp.value.module)
  return m ? m.fields : []
})
watch(
  () => cp.value.module,
  (k) => {
    const f = cpFields.value
    const numCols = f.filter((x) => ['number', 'money', 'percent'].includes(x.type))
    const labelCols = f.filter((x) => ['text', 'date'].includes(x.type))
    cp.value.colA = numCols[0] ? numCols[0].key : f[0] ? f[0].key : ''
    cp.value.colB = numCols[1] ? numCols[1].key : numCols[0] ? numCols[0].key : ''
    cp.value.labelCol = labelCols[0] ? labelCols[0].key : f[0] ? f[0].key : ''
  },
  { immediate: true }
)
const cpRows = computed(() =>
  dataStore.records(cp.value.module).map((r) => {
    const a = Number(r[cp.value.colA]) || 0
    const b = Number(r[cp.value.colB]) || 0
    const diff = b - a
    return { [cp.value.labelCol]: r[cp.value.labelCol] ?? '—', [cp.value.colA]: a, [cp.value.colB]: b, diff, pct: a !== 0 ? diff / a : null }
  })
)

/* ============ 日志 ============ */
const logKw = ref('')
const filteredLogs = computed(() => {
  const kw = logKw.value.trim().toLowerCase()
  if (!kw) return logsStore.logs
  return logsStore.logs.filter((l) => (l.op + l.target + l.detail).toLowerCase().includes(kw))
})
function clearLogs() {
  ElMessageBox.confirm('确定清空全部操作日志吗？', '清空确认', { type: 'warning' })
    .then(() => {
      logsStore.clear()
      ElMessage.success('已清空')
    })
    .catch(() => {})
}
function exportLogs() {
  const fields = [
    { key: 'time', label: '时间' },
    { key: 'op', label: '操作' },
    { key: 'target', label: '对象' },
    { key: 'detail', label: '详情' }
  ]
  exportCSV('操作日志.csv', fields, filteredLogs.value)
}
</script>

<style scoped>
.code-list {
  max-height: 420px;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}
.code-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.code {
  font-family: Consolas, monospace;
  font-weight: 700;
  color: #1d4ed8;
  flex: 1;
}
.cal-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.cal-title {
  font-size: 16px;
  font-weight: 700;
}
.cal-legend {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #606266;
}
.cal-legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 4px;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.cal-wd {
  text-align: center;
  font-weight: 600;
  color: #909399;
  padding: 6px 0;
}
.cal-cell {
  min-height: 84px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  background: #fff;
}
.cal-cell.is-today {
  border-color: #2f54eb;
  box-shadow: inset 0 0 0 1px #2f54eb;
}
.cal-cell.is-other {
  opacity: 0.4;
}
.cal-day {
  font-weight: 600;
  font-size: 13px;
}
.cal-events {
  margin-top: 4px;
}
.cal-ev {
  font-size: 11px;
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
  margin-bottom: 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.cal-more {
  font-size: 11px;
  color: #909399;
}
.day-event {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed #ebeef5;
}
.day-event i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.ie-global {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.muted {
  font-size: 12px;
  color: #909399;
}
.log-head {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}
</style>
