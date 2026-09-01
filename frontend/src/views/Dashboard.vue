<template>
  <div class="dashboard">
    <!-- KPI 行 -->
    <el-row :gutter="14">
      <el-col v-for="k in kpis" :key="k.label" :xs="12" :sm="8" :md="4">
        <div class="kpi-card">
          <div class="kpi-title">{{ k.label }}</div>
          <div class="kpi-value">{{ k.value }}<span v-if="k.unit" class="kpi-unit">{{ k.unit }}</span></div>
          <div class="kpi-sub">{{ k.sub }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 趋势图 + 交期倒计时 -->
    <el-row :gutter="14" style="margin-top: 14px">
      <el-col :xs="24" :md="16">
        <div class="pmc-card">
          <div class="card-title">关键指标趋势（计划达成率）</div>
          <BaseChart :option="trendOption" :height="280" />
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="pmc-card">
          <div class="card-title">订单交期到期倒计时</div>
          <div class="deadline-list">
            <div v-for="it in deadlines" :key="it.id" class="deadline-item" @click="go('/m/sales_order')">
              <div class="dl-left">
                <div class="dl-no">{{ it['订单号'] }}</div>
                <div class="dl-prod">{{ it['客户'] }} / {{ it['产品名称'] }}</div>
              </div>
              <el-tag :type="it.days < 0 ? 'danger' : it.days <= 7 ? 'warning' : 'success'" size="small">
                {{ it.days < 0 ? '已逾期 ' + -it.days + ' 天' : '剩 ' + it.days + ' 天' }}
              </el-tag>
            </div>
            <el-empty v-if="!deadlines.length" description="暂无交期数据" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 预警看板 -->
    <div class="pmc-card" style="margin-top: 14px">
      <div class="card-title">
        预警看板
        <el-button size="small" style="float: right" @click="refreshWarn">
          <el-icon><Refresh /></el-icon>&nbsp;重新计算预警
        </el-button>
      </div>
      <el-row :gutter="12">
        <el-col v-for="w in warnBoard" :key="w.key" :xs="12" :sm="8" :md="4" :lg="3">
          <div class="warn-card" :style="{ borderTopColor: w.color }" @click="go('/m/' + w.key)">
            <div class="warn-count" :style="{ color: w.color }">{{ w.count }}</div>
            <div class="warn-label">{{ w.label }}</div>
            <div class="warn-status">{{ w.pending > 0 ? w.pending + ' 条待处理' : '无' }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 今日待办 + 库存结构 -->
    <el-row :gutter="14" style="margin-top: 14px">
      <el-col :xs="24" :md="12">
        <div class="pmc-card">
          <div class="card-title">今日待办看板</div>
          <div v-for="t in todayTodos" :key="t.id" class="todo-item">
            <el-checkbox :model-value="t.status === '已完成'" @change="(v) => toggleTodo(t, v)" />
            <span :class="{ done: t.status === '已完成' }">{{ t['事项内容'] }}</span>
            <el-tag size="small" :type="t['优先级'] === '高' ? 'danger' : t['优先级'] === '中' ? 'warning' : 'info'">
              {{ t['优先级'] }}
            </el-tag>
          </div>
          <el-empty v-if="!todayTodos.length" description="今天暂无待办" :image-size="60" />
          <el-button link type="primary" style="margin-top: 8px" @click="go('/m/todo')">去待办清单 →</el-button>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="pmc-card">
          <div class="card-title">库存金额概览</div>
          <BaseChart :option="stockOption" :height="300" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import BaseChart from '../components/BaseChart.vue'
import { useData, useSettings, useLogs } from '../store/index.js'
import { runWarningEngine } from '../utils/warning.js'
import { warningApi } from '../api'
import { isServer } from '../utils/mode.js'

const router = useRouter()
const dataStore = useData()
const settingsStore = useSettings()
const logs = useLogs()

// 服务端模式：后端返回的预警数据（按模块分组）
const warnData = ref([])

const go = (p) => router.push(p)

/* ---------- KPI ---------- */
const fmtNum = (n) => (n == null || isNaN(n) ? '—' : Number(n).toLocaleString('zh-CN'))
const pctOf = (n) => (n == null || isNaN(n) ? '—' : Number(n).toFixed(1) + '%')

const planRate = computed(() => {
  const rows = dataStore.records('plan_achieve')
  if (rows.length) return pctOf(rows[rows.length - 1]['达成率'])
  const wo = dataStore.records('work_order')
  if (wo.length) {
    const done = wo.filter((r) => ['已完工', '已结案'].includes(r['状态'])).length
    return pctOf((done / wo.length) * 100)
  }
  return '—'
})

const kittingRate = computed(() => {
  const mrp = dataStore.records('mrp')
  if (mrp.length) {
    const ok = mrp.filter((r) => Number(r['已有库存'] || 0) >= Number(r['毛需求'] || 0)).length
    return pctOf((ok / mrp.length) * 100)
  }
  return '—'
})

const capacityRate = computed(() => {
  const rows = dataStore.records('report_capacity')
  if (rows.length) {
    const avg = rows.reduce((s, r) => s + Number(r['利用率'] || 0), 0) / rows.length
    return pctOf(avg)
  }
  return '—'
})

const wipCount = computed(() => {
  const wo = dataStore.records('work_order')
  return wo.filter((r) => !['已完工', '已结案', '已取消'].includes(r['状态'])).length
})

const stockAmount = computed(() => {
  const sum = (k) => dataStore.records(k).reduce((s, r) => s + Number(r['金额'] || 0), 0)
  return '¥' + fmtNum(sum('raw_inventory') + sum('finished_inventory'))
})

const todayTodos = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  const list = dataStore.records('todo').filter((r) => r['日期'] === today || !r['日期'])
  return list.slice(0, 8)
})

const kpis = computed(() => [
  { label: '生产计划达成率', value: planRate.value, sub: '最近周期' },
  { label: '物料齐套率', value: kittingRate.value, sub: 'MRP 运算' },
  { label: '产能利用率', value: capacityRate.value, sub: '产能统计' },
  { label: '在制工单', value: wipCount.value, sub: '工单台账' },
  { label: '库存金额', value: stockAmount.value, sub: '原材料+成品' },
  { label: '今日待办', value: todayTodos.value.length, sub: '未完成' }
])

/* ---------- 交期倒计时 ---------- */
const deadlines = computed(() => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return dataStore
    .records('sales_order')
    .filter((r) => r['承诺交期'] && r['状态'] !== '已取消')
    .map((r) => ({ ...r, days: Math.round((new Date(r['承诺交期']).getTime() - t.getTime()) / 86400000) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8)
})

/* ---------- 预警看板 ---------- */
const WARN_MODULES = [
  { key: 'warn_missing', label: '缺料', color: '#f56c6c' },
  { key: 'warn_delivery', label: '交期', color: '#e6a23c' },
  { key: 'warn_purchase', label: '采购延期', color: '#f56c6c' },
  { key: 'warn_inventory', label: '库存', color: '#409eff' },
  { key: 'warn_slow', label: '呆滞料', color: '#909399' },
  { key: 'warn_capacity', label: '产能过载', color: '#e6a23c' },
  { key: 'warn_wo', label: '工单延期', color: '#f56c6c' },
  { key: 'warn_quality', label: '品质异常', color: '#e6a23c' },
  { key: 'warn_loss', label: '损耗超标', color: '#409eff' },
  { key: 'warn_equip', label: '维保到期', color: '#67c23a' },
  { key: 'warn_ecn', label: 'ECN 生效', color: '#67c23a' },
  { key: 'warn_stocktake', label: '盘点到期', color: '#409eff' }
]

const warnBoard = computed(() => {
  if (isServer()) {
    return WARN_MODULES.map((w) => {
      const rows = warnData.value.filter((r) => (r.module || '').endsWith(w.key) || (r.module || '').startsWith(w.key))
      return {
        ...w,
        count: rows.length,
        pending: rows.filter((r) => r.status !== '已消除' && r.status !== '已完成').length
      }
    })
  }
  return WARN_MODULES.map((w) => {
    const rows = dataStore.records(w.key).filter((r) => !r.archived)
    return {
      ...w,
      count: rows.length,
      pending: rows.filter((r) => r['状态'] !== '已消除' && r['状态'] !== '已完成').length
    }
  })
})

async function refreshWarn() {
  if (isServer()) {
    try {
      await warningApi.recalc()
      await loadWarnings()
      ElMessage.success('已重新计算预警')
    } catch (e) {
      ElMessage.error('重新计算失败')
    }
    return
  }
  runWarningEngine(dataStore, settingsStore.settings)
  logs.add('操作', '预警看板', '手动重新计算预警')
}

/* ---------- 图表 ---------- */
const trendOption = computed(() => {
  const rows = dataStore.records('plan_achieve').slice(-12)
  return {
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: rows.map((r) => r['统计周期'] || '—') || ['暂无数据'], axisLabel: { color: '#606266' } },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: '#909399' } },
    series: [
      {
        name: '达成率',
        type: 'line',
        smooth: true,
        data: rows.map((r) => r['达成率']),
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#2f54eb' },
        lineStyle: { color: '#2f54eb', width: 3 }
      }
    ]
  }
})

const stockOption = computed(() => {
  const sum = (k) => dataStore.records(k).reduce((s, r) => s + Number(r['金额'] || 0), 0)
  const raw = sum('raw_inventory')
  const fin = sum('finished_inventory')
  const wip = sum('wip_inventory')
  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    color: ['#2f54eb', '#67c23a', '#e6a23c'],
    series: [
      {
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '44%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n¥{c}' },
        data: [
          { name: '原材料', value: raw },
          { name: '成品', value: fin },
          { name: '半成品 WIP', value: wip }
        ]
      }
    ]
  }
})

/* ---------- 待办勾选 ---------- */
function toggleTodo(t, v) {
  dataStore.update('todo', t.id, { status: v ? '已完成' : '进行中' })
}

// 服务端模式：加载后端预警
async function loadWarnings() {
  try {
    const res = await warningApi.list({ limit: 300 })
    warnData.value = res.items || []
  } catch (e) { /* 忽略 */ }
}

const DASHBOARD_MODULES = [
  'plan_achieve', 'work_order', 'mrp', 'report_capacity',
  'raw_inventory', 'finished_inventory', 'wip_inventory', 'todo', 'sales_order'
]

onMounted(async () => {
  if (isServer()) {
    await dataStore.loadAll(DASHBOARD_MODULES)
    await loadWarnings()
    return
  }
  runWarningEngine(dataStore, settingsStore.settings)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
}
.kpi-unit {
  font-size: 14px;
  font-weight: 400;
  margin-left: 4px;
  opacity: 0.8;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 10px;
}
.deadline-list {
  max-height: 280px;
  overflow: auto;
}
.deadline-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 6px;
  border-bottom: 1px dashed #ebeef5;
  cursor: pointer;
  border-radius: 4px;
}
.deadline-item:hover {
  background: #f5f7fa;
}
.dl-no {
  font-weight: 600;
  font-size: 13px;
}
.dl-prod {
  font-size: 12px;
  color: #909399;
}
.warn-card {
  border: 1px solid #ebeef5;
  border-top: 3px solid #409eff;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  background: #fafbfc;
}
.warn-card:hover {
  box-shadow: 0 4px 12px rgba(0, 21, 41, 0.12);
}
.warn-count {
  font-size: 24px;
  font-weight: 800;
}
.warn-label {
  font-size: 13px;
  color: #303133;
  margin-top: 2px;
}
.warn-status {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px dashed #ebeef5;
}
.todo-item .done {
  text-decoration: line-through;
  color: #c0c4cc;
}
</style>
