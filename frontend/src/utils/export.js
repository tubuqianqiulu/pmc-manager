// 通用工具：ID / 编号生成、CSV / JSON 导出导入

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

const pad = (n) => String(n).padStart(2, '0')

// 默认编号前缀（按模块分组）
const GROUP_PREFIX = {
  sales: 'SO', production: 'WO', material: 'MR', purchase: 'PO',
  inventory: 'ST', quality: 'QC', outsource: 'OS', warning: 'WA',
  report: 'RP', todo: 'TD'
}

export function defaultPrefix(key) {
  for (const g in GROUP_PREFIX) if (key.startsWith(g)) return GROUP_PREFIX[g]
  return 'PMC'
}

// 生成业务单号：前缀 + yyyyMMdd + 4 位流水（流水由设置中的编号规则维护）
export function genNo(key, numberRules) {
  const seq = (numberRules.seq && numberRules.seq[key]) || 0
  const prefix = (numberRules.prefix && numberRules.prefix[key]) || defaultPrefix(key)
  const next = seq + 1
  numberRules.seq[key] = next
  const d = new Date()
  return `${prefix}${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${String(next).padStart(4, '0')}`
}

// ---------- 导出 ----------
function csvEscape(v) {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function toCSV(fields, rows) {
  const header = fields.map((f) => csvEscape(f.label)).join(',')
  const body = rows.map((r) => fields.map((f) => csvEscape(r[f.key])).join(',')).join('\r\n')
  return '\uFEFF' + header + '\r\n' + body // BOM 保证 Excel 中文不乱码
}

export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportCSV(filename, fields, rows) {
  download(filename, toCSV(fields, rows), 'text/csv;charset=utf-8')
}

export function exportJSON(filename, data) {
  download(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8')
}

// ---------- 导入 ----------
// 解析 CSV（支持引号包裹、逗号、换行）
export function parseCSV(text) {
  const rows = []
  let row = []
  let cur = ''
  let inQ = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++ } else inQ = false
      } else cur += c
    } else if (c === '"') {
      inQ = true
    } else if (c === ',') {
      row.push(cur); cur = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(cur); cur = ''
      if (row.some((x) => x !== '')) rows.push(row)
      row = []
    } else cur += c
  }
  row.push(cur)
  if (row.some((x) => x !== '')) rows.push(row)
  return rows
}

// 按模块字段映射导入行：首行为表头（字段标签）
export function mapImportRows(header, dataRows, fields) {
  const byLabel = {}
  fields.forEach((f, idx) => { byLabel[f.label] = f })
  return dataRows.map((r) => {
    const obj = {}
    header.forEach((h, idx) => {
      const f = byLabel[h]
      if (f) obj[f.key] = r[idx]
    })
    return obj
  })
}
