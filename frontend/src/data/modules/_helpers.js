// 字段定义简写工具，供各模块配置文件使用
// 字段 key 默认取“标签”（中文），保证导出表头/导入映射一致；也可显式传入 key 覆盖
const mk = (type, label, w, o = {}, extra = {}) => ({
  type,
  label,
  key: o.key || label,
  width: w,
  ...o,
  ...extra
})

export const text = (label, w = 130, o = {}) => mk('text', label, w, o)
export const num = (label, w = 110, o = {}) => mk('number', label, w, o)
export const money = (label, w = 120, o = {}) => mk('money', label, w, o)
export const date = (label, w = 120, o = {}) => mk('date', label, w, o)
export const datetime = (label, w = 165, o = {}) => mk('datetime', label, w, o)
export const sel = (label, options, w = 120, o = {}) => mk('select', label, w, { ...o, options })
export const area = (label, o = {}) => mk('textarea', label, 200, o)
export const pct = (label, w = 90, o = {}) => mk('percent', label, w, o)
export const tag = (label, w = 110, o = {}) => mk('tag', label, w, o)
export const bool = (label, w = 80, o = {}) => mk('boolean', label, w, o)

// 常用状态集合
export const ST = {
  common: ['待处理', '进行中', '已完成', '已逾期'],
  order: ['草稿', '已评审', '已承诺', '已下达', '已完工', '已取消'],
  wo: ['未下达', '已下达', '开工中', '已完工', '已结案'],
  po: ['草稿', '已下达', '部分到货', '已到货', '已关闭'],
  appr: ['待审批', '已通过', '已驳回'],
  quality: ['待处理', '处理中', '已关闭'],
  warn: ['待处理', '处理中', '已消除']
}

// 通用状态字段（key 固定为 status，与记录内置状态字段一致）
export const statusField = (options = ST.common) => ({
  type: 'status',
  label: '状态',
  key: 'status',
  options,
  width: 100
})
