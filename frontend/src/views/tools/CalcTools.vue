<template>
  <div class="tool-tabs">
    <el-tabs v-model="tab" @tab-change="onTab">
      <el-tab-pane label="交期推算计算器" name="date-calc">
        <div class="calc-grid">
          <el-card shadow="never">
            <h4>输入参数</h4>
            <el-form label-width="100px" label-position="left">
              <el-form-item label="订单数量"><el-input-number v-model="dc.qty" :min="1" style="width: 100%" /></el-form-item>
              <el-form-item label="日产能"><el-input-number v-model="dc.dailyCap" :min="1" style="width: 100%" /></el-form-item>
              <el-form-item label="工序周期(天)"><el-input-number v-model="dc.procDays" :min="0" style="width: 100%" /></el-form-item>
              <el-form-item label="物料到货日">
                <el-date-picker v-model="dc.materialArrive" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
              <el-form-item label="计划开工日">
                <el-date-picker v-model="dc.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="never">
            <h4>推算结果</h4>
            <div class="result-line">生产周期：<b>{{ dcResult.prodDays }}</b> 天（含工序 {{ dc.procDays }} 天）</div>
            <div class="result-line">最早可交货日：<b class="big">{{ dcResult.date }}</b></div>
            <div class="result-line" v-if="dcResult.note">说明：{{ dcResult.note }}</div>
            <el-alert type="info" :closable="false" title="原理：生产周期=⌈订单量÷日产能⌉+工序周期；最早交期=计划开工日+生产周期 与 物料到货日 取较晚者。" />
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="产能负荷计算器" name="capacity">
        <div class="calc-grid">
          <el-card shadow="never">
            <h4>产能数据 <el-button size="small" style="float: right" @click="addCapRow">+ 添加工序</el-button></h4>
            <el-form label-width="100px" label-position="left">
              <el-form-item label="每日可用工时(小时)"><el-input-number v-model="cap.avail" :min="1" style="width: 220px" /></el-form-item>
              <el-form-item label="排程天数"><el-input-number v-model="cap.days" :min="1" style="width: 220px" /></el-form-item>
            </el-form>
            <el-table :data="cap.rows" border size="small">
              <el-table-column label="工序/设备">
                <template #default="{ row }"><el-input v-model="row.name" placeholder="工序/设备" /></template>
              </el-table-column>
              <el-table-column label="需求工时">
                <template #default="{ row }"><el-input-number v-model="row.hours" :min="0" :controls="false" style="width: 100%" /></template>
              </el-table-column>
              <el-table-column label="操作" width="60">
                <template #default="{ $index }"><el-button link type="danger" @click="cap.rows.splice($index, 1)">删</el-button></template>
              </el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="never">
            <h4>负荷率结果</h4>
            <div v-for="(r, i) in capResult" :key="i" class="result-line">
              {{ r.name || '工序' + (i + 1) }}：<b :style="{ color: r.rate >= 100 ? '#f56c6c' : '#67c23a' }">{{ r.rate.toFixed(1) }}%</b>
              <el-tag v-if="r.rate >= 100" type="danger" size="small">过载</el-tag>
              <el-tag v-else type="success" size="small">正常</el-tag>
            </div>
            <el-empty v-if="!cap.rows.length" description="请添加工序数据" :image-size="60" />
            <el-alert type="info" :closable="false" title="负荷率 = 需求工时 ÷ (每日可用工时 × 排程天数) × 100%；≥100% 表示产能过载。" />
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="物料需求估算器" name="material">
        <div class="calc-grid">
          <el-card shadow="never">
            <h4>输入参数</h4>
            <el-form label-width="100px" label-position="left">
              <el-form-item label="订单量(件)"><el-input-number v-model="me.qty" :min="1" style="width: 100%" /></el-form-item>
              <el-form-item label="BOM 用量(个/件)"><el-input-number v-model="me.usage" :min="0.01" :precision="2" :step="0.1" style="width: 100%" /></el-form-item>
              <el-form-item label="损耗率(%)"><el-input-number v-model="me.loss" :min="0" :max="100" style="width: 100%" /></el-form-item>
              <el-form-item label="当前库存"><el-input-number v-model="me.stock" :min="0" style="width: 100%" /></el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="never">
            <h4>计算结果</h4>
            <div class="result-line">毛需求 = {{ me.qty }} × {{ me.usage }} × (1+{{ me.loss }}%) = <b>{{ meResult.gross }}</b></div>
            <div class="result-line">可用库存（含损耗） = <b>{{ meResult.avail }}</b></div>
            <div class="result-line big" :style="{ color: meResult.net > 0 ? '#f56c6c' : '#67c23a' }">
              净需求 = <b>{{ meResult.net }}</b> {{ meResult.net > 0 ? '（需采购/请购）' : '（库存充足）' }}
            </div>
            <el-alert type="info" :closable="false" title="净需求 = max(0, 毛需求 − 当前库存)。毛需求=订单量×BOM用量×(1+损耗率)。" />
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="库存周转计算器" name="turnover">
        <div class="calc-grid">
          <el-card shadow="never">
            <h4>输入参数</h4>
            <el-form label-width="110px" label-position="left">
              <el-form-item label="期间出库金额(¥)"><el-input-number v-model="it.out" :min="0" :precision="2" style="width: 100%" /></el-form-item>
              <el-form-item label="期初库存金额(¥)"><el-input-number v-model="it.begin" :min="0" :precision="2" style="width: 100%" /></el-form-item>
              <el-form-item label="期末库存金额(¥)"><el-input-number v-model="it.end" :min="0" :precision="2" style="width: 100%" /></el-form-item>
            </el-form>
          </el-card>
          <el-card shadow="never">
            <h4>计算结果</h4>
            <div class="result-line">平均库存 = ({{ it.begin }} + {{ it.end }}) ÷ 2 = <b>{{ itResult.avg }}</b></div>
            <div class="result-line big">库存周转率 = <b>{{ itResult.rate }}</b> 次</div>
            <div class="result-line" v-if="itResult.rate > 0">周转天数 ≈ <b>{{ itResult.days }}</b> 天/次</div>
            <el-alert type="info" :closable="false" title="周转率 = 出库金额 ÷ 平均库存；周转天数 = 周期天数 ÷ 周转率（按 30 天估算）。" />
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const tab = ref('date-calc')
watch(
  () => route.query.tab,
  (v) => {
    if (v && ['date-calc', 'capacity', 'material', 'turnover'].includes(v)) tab.value = v
  },
  { immediate: true }
)
function onTab() {
  router.replace({ path: '/tools', query: { tab: tab.value } })
}

/* 交期推算 */
const dc = ref({ qty: 100, dailyCap: 20, procDays: 2, materialArrive: '', startDate: '' })
const dcResult = computed(() => {
  const prodDays = Math.ceil((dc.value.qty || 0) / (dc.value.dailyCap || 1)) + (dc.value.procDays || 0)
  let date = '请选择计划开工日'
  let note = ''
  if (dc.value.startDate) {
    const d = new Date(dc.value.startDate)
    d.setDate(d.getDate() + prodDays)
    date = d.toISOString().slice(0, 10)
    if (dc.value.materialArrive && new Date(dc.value.materialArrive) > d) {
      date = dc.value.materialArrive
      note = '物料到货日晚于生产完工，交期受物料到货制约。'
    }
  }
  return { prodDays, date, note }
})

/* 产能负荷 */
const cap = ref({ avail: 16, days: 1, rows: [{ name: '', hours: 0 }] })
function addCapRow() {
  cap.value.rows.push({ name: '', hours: 0 })
}
const capResult = computed(() =>
  cap.value.rows.map((r) => {
    const total = (cap.value.avail || 0) * (cap.value.days || 1)
    const rate = total > 0 ? ((r.hours || 0) / total) * 100 : 0
    return { name: r.name, rate }
  })
)

/* 物料需求估算 */
const me = ref({ qty: 100, usage: 2, loss: 5, stock: 120 })
const meResult = computed(() => {
  const gross = Math.ceil((me.value.qty || 0) * (me.value.usage || 0) * (1 + (me.value.loss || 0) / 100))
  const avail = me.value.stock || 0
  return { gross, avail, net: Math.max(0, gross - avail) }
})

/* 库存周转 */
const it = ref({ out: 100000, begin: 20000, end: 30000 })
const itResult = computed(() => {
  const avg = ((it.value.begin || 0) + (it.value.end || 0)) / 2
  const rate = avg > 0 ? (it.value.out || 0) / avg : 0
  return {
    avg: avg.toFixed(2),
    rate: rate.toFixed(2),
    days: rate > 0 ? (30 / rate).toFixed(1) : '—'
  }
})
</script>

<style scoped>
.calc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
  padding: 8px 4px;
}
h4 {
  margin: 0 0 12px;
  color: #1f2d3d;
}
.result-line {
  padding: 6px 0;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px dashed #ebeef5;
}
.result-line .big {
  font-size: 20px;
  color: #2f54eb;
}
.el-alert {
  margin-top: 12px;
}
</style>
