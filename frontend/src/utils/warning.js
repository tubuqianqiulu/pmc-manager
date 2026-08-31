// 预警引擎：扫描各业务模块数据，按预警规则自动生成预警记录（写入 warn_* 模块）
// 幂等：同一签名且未“已消除”的记录不会重复生成；用户可手工删除/处理。

const DAY = 86400000

function parseDay(s) {
  if (!s) return NaN
  return new Date(s).getTime()
}
const diffDays = (t, d) => Math.round((d - t) / DAY)

export function runWarningEngine(store, settings) {
  const rules = (settings && settings.warnRules) || {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const t = today.getTime()

  const has = (key, sig) =>
    (store.records(key) || []).some((r) => r._sig === sig && r.status !== '已消除')
  const emit = (key, sig, rec) => {
    if (!has(key, sig)) store.add(key, { status: '待处理', ...rec, _sig: sig, auto: true })
  }

  /* 1. 订单交期预警（7/15/30 天窗口 + 已逾期） */
  const windows = rules.deliveryDays || [7, 15, 30]
  for (const s of store.records('sales_order')) {
    const d = parseDay(s['承诺交期'])
    if (!isFinite(d) || s['状态'] === '已取消') continue
    const days = diffDays(t, d)
    if (days < 0)
      emit('warn_delivery', `del|${s['订单号']}`, {
        订单号: s['订单号'], 客户: s['客户'], 产品名称: s['产品名称'], 承诺交期: s['承诺交期'],
        剩余天数: days, 预警级别: '高', 说明: '交期已逾期，请尽快处理'
      })
    else if (days <= Math.min(...windows))
      emit('warn_delivery', `del|${s['订单号']}|${days}`, {
        订单号: s['订单号'], 客户: s['客户'], 产品名称: s['产品名称'], 承诺交期: s['承诺交期'],
        剩余天数: days, 预警级别: days <= 7 ? '高' : '中', 说明: `距交期 ${days} 天`
      })
  }

  /* 2. 采购到货延期预警 */
  const lateDays = rules.purchaseLateDays || 1
  for (const p of store.records('purchase_order')) {
    const d = parseDay(p['计划到货'])
    if (!isFinite(d)) continue
    if (['已到货', '已关闭'].includes(p['状态'])) continue
    const days = diffDays(t, d)
    if (days < -lateDays)
      emit('warn_purchase', `po|${p['采购单号']}`, {
        采购单号: p['采购单号'], 供应商: p['供应商'], 物料: p['物料名称'], 计划到货日: p['计划到货'],
        延期天数: -days, 预警级别: '高', 说明: '计划到货已逾期'
      })
  }

  /* 3. 库存预警（超储/低储） */
  for (const m of store.records('minmax_stock')) {
    const cur = Number(m['当前库存'] || 0)
    const sig = `inv|${m['物料编码'] || m['物料名称']}`
    if (m['最高库存'] && cur > Number(m['最高库存']))
      emit('warn_inventory', sig + '|hi', {
        物料编码: m['物料编码'], 物料名称: m['物料名称'], 当前库存: cur, 安全库存: m['最低库存'],
        预警类型: '超储', 预警级别: '中', 说明: '超过最高库存上限'
      })
    if (m['最低库存'] && cur < Number(m['最低库存']))
      emit('warn_inventory', sig + '|lo', {
        物料编码: m['物料编码'], 物料名称: m['物料名称'], 当前库存: cur, 安全库存: m['最低库存'],
        预警类型: '低储', 预警级别: '高', 说明: '低于最低库存'
      })
  }
  for (const s of store.records('safety_stock')) {
    const cur = Number(s['当前库存'] || 0)
    if (s['安全库存'] && cur < Number(s['安全库存']) * (rules.stockLowRatio || 0.3))
      emit('warn_inventory', `saf|${s['物料编码'] || s['物料名称']}`, {
        物料编码: s['物料编码'], 物料名称: s['物料名称'], 当前库存: cur, 安全库存: s['安全库存'],
        预警类型: '低储', 预警级别: '高', 说明: '低于安全库存'
      })
  }

  /* 4. 工单延期预警 */
  for (const w of store.records('work_order')) {
    const d = parseDay(w['计划完工'])
    if (!isFinite(d)) continue
    if (['已完工', '已结案'].includes(w['状态'])) continue
    const days = diffDays(t, d)
    if (days < -(rules.woLateDays || 1))
      emit('warn_wo', `wo|${w['工单号']}`, {
        工单号: w['工单号'], 产品名称: w['产品名称'], 计划完成日: w['计划完工'],
        延期天数: -days, 预警级别: '高', 说明: '工单计划完工已逾期'
      })
  }

  /* 5. 设备维保到期预警 */
  for (const e of store.records('equipment')) {
    const d = parseDay(e['下次维保'])
    if (!isFinite(d)) continue
    const days = diffDays(t, d)
    if (days >= 0 && days <= (rules.maintDays || 7))
      emit('warn_equip', `eq|${e['设备编码'] || e['设备名称']}`, {
        设备编码: e['设备编码'], 设备名称: e['设备名称'], 上次维保: e['上次维保'], 下次维保: e['下次维保'],
        剩余天数: days, 预警级别: days <= 2 ? '高' : '中', 说明: '设备维保即将到期'
      })
    else if (days < 0)
      emit('warn_equip', `eq|${e['设备编码'] || e['设备名称']}|late`, {
        设备编码: e['设备编码'], 设备名称: e['设备名称'], 上次维保: e['上次维保'], 下次维保: e['下次维保'],
        剩余天数: days, 预警级别: '高', 说明: '设备维保已逾期'
      })
  }

  /* 6. 呆滞料预警（90/180/365） */
  for (const s of store.records('slow_stock')) {
    const age = Number(s['库龄天数'] || 0)
    const tiers = (rules.slowDays || [90, 180, 365]).slice().sort((a, b) => a - b)
    const tier = tiers.filter((x) => age >= x).pop()
    if (tier)
      emit('warn_slow', `slow|${s['物料编码'] || s['物料名称']}|${tier}`, {
        物料编码: s['物料编码'], 物料名称: s['物料名称'], 库龄天数: age, 呆滞档位: `${tier}天`,
        库存数量: s['数量'], 金额: s['金额'], 预警级别: tier >= 365 ? '高' : '中', 说明: `库龄超过 ${tier} 天`
      })
  }

  /* 7. 品质异常预警 */
  for (const q of [...store.records('iqc_quality'), ...store.records('process_quality'), ...store.records('finished_quality')]) {
    if (q['状态'] === '已关闭') continue
    const type = q['供应商'] ? '来料' : q['工单号'] ? '制程' : '成品'
    emit('warn_quality', `q|${q['异常单号']}`, {
      异常单号: q['异常单号'], 异常类型: type, '批次/工单': q['批次/来料单'] || q['工单号'] || q['批次'],
      异常等级: q['异常等级'], 说明: q['异常描述'], 预警级别: q['异常等级'] === '严重' ? '高' : '中'
    })
  }

  /* 8. 缺料预警 */
  for (const m of store.records('mrp')) {
    const need = Number(m['净需求'] || 0)
    if (need > 0)
      emit('warn_missing', `miss|${m['物料编码']}|${m['运算批次']}`, {
        物料编码: m['物料编码'], 物料名称: m['物料名称'], 需求单号: m['运算批次'], 需求量: need,
        可用库存: m['已有库存'], 缺料数量: need - Number(m['已有库存'] || 0), 需求日期: m['运算日期'],
        预警级别: '高', 说明: 'MRP 运算存在净需求'
      })
  }

  /* 9. 产能过载预警 */
  for (const c of store.records('report_capacity')) {
    const rate = Number(c['利用率'])
    if (rate >= (rules.capacityLoad || 100))
      emit('warn_capacity', `cap|${c['设备/工序']}|${c['统计周期']}`, {
        '工序/设备': c['设备/工序'], 日期: c['统计周期'], 需求工时: c['实际工时'], 可用工时: c['可用工时'],
        负荷率: rate, 预警级别: rate >= 120 ? '高' : '中', 说明: '产能负荷超过阈值'
      })
  }

  /* 10. 物料损耗超标预警 */
  for (const b of store.records('bom_loss')) {
    const rate = Number(b['损耗率'] || 0)
    if (rate > (rules.lossRate || 5))
      emit('warn_loss', `loss|${b['物料名称']}|${b['版本']}`, {
        物料编码: b['物料编码'] || '', 物料名称: b['物料名称'], BOM版本: b['版本'],
        标准损耗率: b['标准用量'], 实际损耗率: rate, 预警级别: '中', 说明: '损耗率超过阈值'
      })
  }

  /* 11. ECN 生效预警 */
  for (const e of store.records('ecn')) {
    const d = parseDay(e['生效日期'])
    if (!isFinite(d)) continue
    const days = diffDays(t, d)
    if (days >= 0 && days <= (rules.ecnDays || 7))
      emit('warn_ecn', `ecn|${e['ECN编号']}`, {
        ECN编号: e['ECN编号'], 涉及物料: e['涉及产品'], 生效日期: e['生效日期'], 剩余天数: days,
        变更说明: e['变更内容'], 预警级别: '中'
      })
  }

  /* 12. 盘点到期提醒 */
  for (const s of store.records('stocktake')) {
    const d = parseDay(s['盘点日期'])
    if (!isFinite(d)) continue
    const days = diffDays(t, d)
    const cycle = rules.stocktakeCycle || 30
    const remaining = cycle - days
    if (remaining <= 0)
      emit('warn_stocktake', `stk|${s['仓库']}|${s['盘点单号']}`, {
        '仓库/物料': s['仓库'], 上次盘点日: s['盘点日期'], 距下次天数: -remaining, 预警级别: '高', 说明: '已超过盘点周期'
      })
    else if (remaining <= 7)
      emit('warn_stocktake', `stk|${s['仓库']}|${s['盘点单号']}`, {
        '仓库/物料': s['仓库'], 上次盘点日: s['盘点日期'], 距下次天数: remaining, 预警级别: '中', 说明: '即将到期盘点'
      })
  }
}
