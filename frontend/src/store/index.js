import { defineStore } from 'pinia'
import { loadJSON, saveJSON } from '../utils/storage'
import { genId } from '../utils/export'
import { pmcApi } from '../api'
import { isServer } from '../utils/mode'

const DATA_KEY = 'pmc_data_v1'
const SETTINGS_KEY = 'pmc_settings_v1'
const LOG_KEY = 'pmc_logs_v1'

const now = () => new Date().toISOString()

/* ---------------- 业务数据 store（所有模块的数据） ----------------
 * local 模式：数据存 localStorage
 * server 模式：数据从后端 API 加载（内存缓存），增删改走后端，按登录用户归属隔离
 */
export const useData = defineStore('data', {
  state: () => ({
    data: loadJSON(DATA_KEY, {}),
    savedAt: '',
    loaded: {} // server 模式：已加载的模块集合
  }),
  actions: {
    records(key) {
      return this.data[key] || []
    },
    _persist() {
      if (isServer()) return // server 模式以服务端为准，不落 localStorage
      saveJSON(DATA_KEY, this.data)
      this.savedAt = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    },
    /* ---- server 模式：从后端加载一个模块（含已归档） ---- */
    async load(key) {
      if (!isServer()) return
      try {
        const [a, b] = await Promise.all([
          pmcApi.list(key, { archived: 0, size: 200 }),
          pmcApi.list(key, { archived: 1, size: 200 })
        ])
        const items = [...(a.items || []), ...(b.items || [])]
        this.data[key] = items
        this.loaded[key] = true
        this.savedAt = new Date().toLocaleTimeString('zh-CN', { hour12: false })
      } catch (e) {
        console.error('加载模块失败', key, e)
        this.loaded[key] = true
      }
    },
    async loadAll(keys) {
      if (!isServer()) return
      await Promise.all(keys.map((k) => this.load(k)))
    },
    /* ---- 增删改（server 模式走后端，local 模式走本地） ---- */
    async add(key, rec) {
      if (isServer()) {
        await pmcApi.create(key, rec)
        await this.load(key)
        return rec
      }
      const row = { id: genId(), status: rec.status || '进行中', archived: false, createdAt: now(), updatedAt: now(), ...rec }
      if (!this.data[key]) this.data[key] = []
      this.data[key].unshift(row)
      this._persist()
      return row
    },
    async update(key, id, patch) {
      if (isServer()) {
        await pmcApi.update(key, id, patch)
        await this.load(key)
        return
      }
      const list = this.data[key] || []
      const i = list.findIndex((r) => r.id === id)
      if (i > -1) {
        list[i] = { ...list[i], ...patch, updatedAt: now() }
        this._persist()
      }
    },
    async remove(key, ids) {
      if (isServer()) {
        for (const id of ids) await pmcApi.remove(key, id)
        await this.load(key)
        return
      }
      const set = new Set(ids)
      this.data[key] = (this.data[key] || []).filter((r) => !set.has(r.id))
      this._persist()
    },
    async setArchived(key, ids, val) {
      if (isServer()) {
        // 后端 archive 接口是翻转：根据当前状态决定是否调用
        const list = this.data[key] || []
        for (const id of ids) {
          const row = list.find((r) => r.id === id)
          if (row && Boolean(row.archived) !== val) await pmcApi.archive(key, id)
        }
        await this.load(key)
        return
      }
      const set = new Set(ids)
      this.data[key] = (this.data[key] || []).map((r) =>
        set.has(r.id) ? { ...r, archived: val, updatedAt: now() } : r
      )
      this._persist()
    },
    async importRows(key, rows) {
      if (isServer()) {
        let n = 0
        for (const r of rows) {
          await pmcApi.create(key, r)
          n++
        }
        await this.load(key)
        return n
      }
      if (!this.data[key]) this.data[key] = []
      const t = now()
      const mapped = rows.map((r) => ({ id: genId(), status: r.status || '进行中', archived: false, createdAt: t, updatedAt: t, ...r }))
      this.data[key].unshift(...mapped)
      this._persist()
      return mapped.length
    },
    setAll(data) {
      this.data = data || {}
      this._persist()
    },
    async resetModule(key) {
      if (isServer()) {
        const list = this.data[key] || []
        for (const r of list) {
          try {
            await pmcApi.remove(key, r.id)
          } catch (e) { /* 跳过无权限的 */ }
        }
        await this.load(key)
        return
      }
      delete this.data[key]
      this._persist()
    },
    resetAll() {
      this.data = {}
      this._persist()
    }
  }
})

/* ---------------- 设置 store（个人资料/参数/预警规则/编号规则） ---------------- */
const defaultSettings = () => ({
  profile: { name: '大师哥', dept: 'PMC 部', role: 'PMC 主管', phone: '', email: '' },
  password: { pwd: '' },
  params: {
    factoryName: '大师哥工厂',
    workdays: ['1', '2', '3', '4', '5'], // 1=周一 ... 7=周日
    holidays: [], // 节假日 yyyy-MM-dd
    shiftCount: 2, // 班次数
    shiftHours: 8, // 每班工时
    leadDays: 3, // 采购提前期(天)
    freezeDays: 7 // 计划冻结期(天)
  },
  warnRules: {
    deliveryDays: [7, 15, 30], // 交期预警窗口(天)
    stockOverRatio: 1.3, // 超储 = 库存 > 最高库存×?  (1.3 表示超过安全库存30%)
    stockLowRatio: 0.3, // 低储 = 库存 < 安全库存×0.3
    slowDays: [90, 180, 365], // 呆滞料天数档位
    capacityLoad: 100, // 产能负荷率阈值%
    lossRate: 5, // 损耗率阈值%
    maintDays: 7, // 设备维保提前提醒天数
    ecnDays: 7, // ECN 生效提前提醒天数
    stocktakeCycle: 30, // 盘点周期(天)
    purchaseLateDays: 1, // 采购到货逾期判定(天)
    woLateDays: 1 // 工单延期判定(天)
  },
  numberRules: {
    prefix: {},
    seq: {}
  }
})

export const useSettings = defineStore('settings', {
  state: () => ({
    settings: Object.assign(defaultSettings(), loadJSON(SETTINGS_KEY, {}))
  }),
  actions: {
    _persist() {
      saveJSON(SETTINGS_KEY, this.settings)
    },
    patch(path, value) {
      // path: 'profile.name' 形式
      const keys = path.split('.')
      let cur = this.settings
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] || (cur[keys[i]] = {})
      cur[keys[keys.length - 1]] = value
      this._persist()
    },
    patchDeep(patchObj) {
      Object.assign(this.settings, patchObj)
      this._persist()
    },
    reset() {
      this.settings = defaultSettings()
      this._persist()
    }
  }
})

/* ---------------- 操作日志 store ---------------- */
export const useLogs = defineStore('logs', {
  state: () => ({
    logs: loadJSON(LOG_KEY, [])
  }),
  actions: {
    add(op, target, detail = '') {
      this.logs.unshift({
        id: genId(),
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        op,
        target,
        detail
      })
      if (this.logs.length > 3000) this.logs.length = 3000
      saveJSON(LOG_KEY, this.logs)
    },
    clear() {
      this.logs = []
      saveJSON(LOG_KEY, [])
    }
  }
})
