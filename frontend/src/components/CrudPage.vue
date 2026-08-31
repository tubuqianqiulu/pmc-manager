<template>
  <div class="crud-page">
    <!-- 页头 -->
    <div class="page-head">
      <h3>
        {{ config.label }}
        <span class="muted">{{ filtered.length }} 条</span>
      </h3>
      <span class="save-tip"><el-icon><CircleCheckFilled /></el-icon> 数据自动保存已开启</span>
      <div class="spacer"></div>
      <el-input
        v-model="keyword"
        placeholder="搜索"
        clearable
        style="width: 180px"
        :prefix-icon="Search"
        @keyup.enter="page = 1"
      />
      <el-select v-model="statusFilter" style="width: 110px">
        <el-option label="全部" value="all" />
        <el-option label="正常" value="active" />
        <el-option label="已归档" value="archived" />
      </el-select>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;新增
      </el-button>
      <el-button @click="batchArchive">
        <el-icon><FolderAdd /></el-icon>&nbsp;归档
      </el-button>
      <el-button type="danger" plain @click="batchDelete">删除</el-button>
      <el-button @click="doExport">
        <el-icon><Download /></el-icon>&nbsp;导出
      </el-button>
      <el-dropdown trigger="click" @command="onMore">
        <el-button>
          更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="import">批量导入 CSV</el-dropdown-item>
            <el-dropdown-item command="clear" divided>清空本模块数据</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <input ref="fileInput" type="file" accept=".csv,.txt,.xlsx" style="display: none" @change="onImport" />
    </div>

    <!-- 表格 -->
    <div class="pmc-card">
      <el-table
        :data="pageRows"
        border
        stripe
        :row-key="(r) => r.id"
        @selection-change="(s) => (selection = s)"
        style="width: 100%"
      >
        <el-table-column type="selection" width="42" reserve-selection />
        <el-table-column v-for="f in config.fields" :key="f.key" :prop="f.key" :label="f.label" :width="f.width" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-if="f.type === 'status'" :type="statusTagType(row[f.key])" size="small" disable-transitions>
              {{ row[f.key] || '—' }}
            </el-tag>
            <el-tag v-else-if="f.type === 'tag'" :type="tagType(row[f.key])" size="small" disable-transitions>
              {{ row[f.key] || '—' }}
            </el-tag>
            <span v-else-if="f.type === 'money'">{{ fmtMoney(row[f.key]) }}</span>
            <span v-else-if="f.type === 'percent'">{{ row[f.key] != null ? row[f.key] + '%' : '—' }}</span>
            <span v-else-if="f.type === 'boolean'">{{ row[f.key] ? '是' : '否' }}</span>
            <span v-else>{{ row[f.key] ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="归档" width="74" align="center">
          <template #default="{ row }">
            <el-tag :type="row.archived ? 'info' : 'success'" size="small">{{ row.archived ? '已归档' : '正常' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="206" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.archived ? 'success' : 'warning'" @click="toggleArchive(row)">
              {{ row.archived ? '恢复' : '归档' }}
            </el-button>
            <el-button link type="danger" @click="delOne(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="page-foot">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="filtered.length"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </div>

    <!-- 新增/编辑 对话框 -->
    <el-dialog v-model="dialog" :title="(editing ? '编辑' : '新增') + ' - ' + config.label" width="680px" destroy-on-close>
      <el-form :model="form" label-width="112px" label-position="right">
        <el-row :gutter="14">
          <el-col v-for="f in config.fields" :key="f.key" :span="f.type === 'textarea' ? 24 : 12">
            <el-form-item :label="f.label">
              <el-input v-if="f.type === 'text'" v-model="form[f.key]" :placeholder="f.placeholder || '请输入'" clearable />
              <el-input-number v-else-if="f.type === 'number'" v-model="form[f.key]" :controls="false" style="width: 100%" placeholder="请输入" />
              <el-input-number v-else-if="f.type === 'money'" v-model="form[f.key]" :controls="false" :precision="2" :min="0" style="width: 100%" />
              <el-date-picker v-else-if="f.type === 'date'" v-model="form[f.key]" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="选择日期" />
              <el-date-picker v-else-if="f.type === 'datetime'" v-model="form[f.key]" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" placeholder="选择时间" />
              <el-select v-else-if="f.type === 'select' || f.type === 'status'" v-model="form[f.key]" style="width: 100%" placeholder="请选择">
                <el-option v-for="op in f.options || []" :key="op" :label="op" :value="op" />
              </el-select>
              <el-input v-else-if="f.type === 'textarea'" v-model="form[f.key]" type="textarea" :rows="3" :placeholder="f.placeholder || '请输入'" />
              <el-switch v-else-if="f.type === 'boolean'" v-model="form[f.key]" />
              <el-input-number v-else-if="f.type === 'percent'" v-model="form[f.key]" :min="0" :max="1000" style="width: 100%">
                <template #suffix>%</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, FolderAdd, Download, ArrowDown, CircleCheckFilled } from '@element-plus/icons-vue'
import { getModule } from '../data/modules/index.js'
import { useData, useLogs, useSettings } from '../store/index.js'
import { genNo } from '../utils/export.js'
import { exportCSV, parseCSV, mapImportRows } from '../utils/export.js'

const props = defineProps({ moduleKey: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const dataStore = useData()
const logs = useLogs()
const settingsStore = useSettings()

const config = computed(() => getModule(props.moduleKey) || { label: '未知模块', fields: [] })

const keyword = ref('')
const statusFilter = ref('all')
const page = ref(1)
const pageSize = ref(20)
const selection = ref([])
const dialog = ref(false)
const editing = ref(false)
const editId = ref(null)
const form = ref({})
const fileInput = ref(null)

// 支持从其他页面跳转携带查询：?kw=xx 或 ?status=active
watch(
  () => route.query,
  (q) => {
    if (q.kw) keyword.value = q.kw
    if (q.status && ['all', 'active', 'archived'].includes(q.status)) statusFilter.value = q.status
  },
  { immediate: true }
)

const allRows = computed(() => dataStore.records(props.moduleKey) || [])
const filtered = computed(() => {
  let list = allRows.value
  if (statusFilter.value === 'active') list = list.filter((r) => !r.archived)
  else if (statusFilter.value === 'archived') list = list.filter((r) => r.archived)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    const fields = config.value.fields
    list = list.filter((r) => fields.some((f) => String(r[f.key] ?? '').toLowerCase().includes(kw)))
  }
  return list
})
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function defaultForm() {
  const f = {}
  for (const field of config.value.fields) {
    if (field.type === 'status') f[field.key] = (field.options && field.options[0]) || '进行中'
    else if (field.type === 'select') f[field.key] = (field.options && field.options[0]) || ''
    else if (field.type === 'boolean') f[field.key] = false
    else if (['number', 'money', 'percent'].includes(field.type)) f[field.key] = null
    else f[field.key] = ''
  }
  // 首个“单号/编号/批次”类字段自动生成业务单号
  const first = config.value.fields.find((x) => x.type === 'text')
  if (first && /号|编号|批次/.test(first.label)) {
    f[first.key] = genNo(props.moduleKey, settingsStore.settings.numberRules)
  }
  return f
}

function openCreate() {
  editing.value = false
  editId.value = null
  form.value = defaultForm()
  dialog.value = true
}
function openEdit(row) {
  editing.value = true
  editId.value = row.id
  form.value = { ...row }
  dialog.value = true
}

function save() {
  const payload = { ...form.value }
  // 去掉空串的日期/数字避免脏数据
  for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null
  if (editing.value) {
    dataStore.update(props.moduleKey, editId.value, payload)
    logs.add('编辑', config.value.label, payload[config.value.fields[0]?.key] || '')
  } else {
    dataStore.add(props.moduleKey, payload)
    logs.add('新增', config.value.label, payload[config.value.fields[0]?.key] || '')
  }
  dialog.value = false
  ElMessage.success('已保存（自动写入本地存储）')
}

function toggleArchive(row) {
  dataStore.setArchived(props.moduleKey, [row.id], !row.archived)
  logs.add(row.archived ? '恢复' : '归档', config.value.label, row[config.value.fields[0]?.key] || '')
  ElMessage.success(row.archived ? '已恢复' : '已归档')
}
function batchArchive() {
  if (!selection.value.length) return ElMessage.warning('请先勾选数据')
  dataStore.setArchived(props.moduleKey, selection.value.map((r) => r.id), true)
  logs.add('批量归档', config.value.label, `${selection.value.length} 条`)
  ElMessage.success(`已归档 ${selection.value.length} 条`)
}
function delOne(row) {
  ElMessageBox.confirm(`确定删除该条记录吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
    .then(() => {
      dataStore.remove(props.moduleKey, [row.id])
      logs.add('删除', config.value.label, row[config.value.fields[0]?.key] || '')
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
function batchDelete() {
  if (!selection.value.length) return ElMessage.warning('请先勾选数据')
  ElMessageBox.confirm(`确定删除勾选的 ${selection.value.length} 条记录吗？删除后不可恢复。`, '删除确认', {
    type: 'warning'
  })
    .then(() => {
      dataStore.remove(props.moduleKey, selection.value.map((r) => r.id))
      logs.add('批量删除', config.value.label, `${selection.value.length} 条`)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}

function doExport() {
  exportCSV(`${config.value.label}_${Date.now()}.csv`, config.value.fields, filtered.value)
  logs.add('导出', config.value.label, `${filtered.value.length} 条`)
  ElMessage.success(`已导出 ${filtered.value.length} 条数据`)
}

function onMore(cmd) {
  if (cmd === 'import') fileInput.value && fileInput.value.click()
  else if (cmd === 'clear') {
    ElMessageBox.confirm(`确定清空「${config.value.label}」全部 ${allRows.value.length} 条数据吗？建议先导出备份。`, '清空确认', {
      type: 'warning'
    })
      .then(() => {
        dataStore.resetModule(props.moduleKey)
        logs.add('清空模块', config.value.label)
        ElMessage.success('已清空')
      })
      .catch(() => {})
  }
}
function onImport(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const rows = parseCSV(String(reader.result))
      if (!rows.length) return ElMessage.warning('文件为空或格式不正确')
      const header = rows[0]
      const mapped = mapImportRows(header, rows.slice(1), config.value.fields)
      const n = dataStore.importRows(props.moduleKey, mapped)
      logs.add('导入', config.value.label, `${n} 条`)
      ElMessage.success(`成功导入 ${n} 条数据`)
    } catch (err) {
      ElMessage.error('导入失败：' + err.message)
    }
  }
  reader.readAsText(file, 'utf-8')
}

function statusTagType(s) {
  const map = { 已完成: 'success', 已结案: 'success', 已到货: 'success', 已关闭: 'info', 已消除: 'success', 已归档: 'info', 已取消: 'info', 已完工: 'success', 已通过: 'success', 已下达: 'primary', 已评审: 'primary', 已承诺: 'primary', 已逾期: 'danger', 未下达: 'info', 部分到货: 'warning', 开工中: 'primary', 处理中: 'warning', 进行中: 'primary', 待处理: 'warning', 待审批: 'warning', 草稿: 'info', 已驳回: 'danger', 不合格: 'danger' }
  return map[s] || 'primary'
}
function tagType(v) {
  const high = ['高', '严重', '特急']
  const mid = ['中', '一般', '加急']
  if (high.includes(v)) return 'danger'
  if (mid.includes(v)) return 'warning'
  if (v === '低' || v === '轻微') return 'info'
  if (v === '合格' || v === '正常' || v === '已闭环') return 'success'
  return 'primary'
}
function fmtMoney(v) {
  if (v == null || v === '') return '—'
  return '¥' + Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 清空路由携带的临时查询，避免影响下次进入
function clearRouteQuery() {
  if (route.query.kw || route.query.status) router.replace({ path: route.path })
}
watch(() => props.moduleKey, clearRouteQuery, { immediate: true })
</script>

<style scoped>
.muted {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}
.page-foot {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>
