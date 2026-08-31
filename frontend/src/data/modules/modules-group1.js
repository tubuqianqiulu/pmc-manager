// 模块配置 - 第一组：预警中心 / 销售订单 / 生产计划
import { text, num, money, date, datetime, sel, area, pct, ST, statusField } from './_helpers.js'

const G1 = '预警中心'
const G2 = '销售订单管理'
const G3 = '生产计划管理'

export const modulesGroup1 = [
  /* ================= 预警中心 ================= */
  { key: 'warn_missing', label: '缺料预警看板', group: G1, fields: [
    text('物料编码', 130), text('物料名称', 150), text('需求单号', 140), num('需求量', 100),
    num('可用库存', 100), num('缺料数量', 100), date('需求日期'), sel('预警级别', ['高', '中', '低'], 90),
    area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_delivery', label: '订单交期预警', group: G1, fields: [
    text('订单号', 150), text('客户', 140), text('产品名称', 150), date('承诺交期'), num('剩余天数', 100),
    sel('预警级别', ['高', '中', '低'], 90), area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_purchase', label: '采购到货延期预警', group: G1, fields: [
    text('采购单号', 150), text('供应商', 140), text('物料', 140), date('计划到货日'), num('延期天数', 100),
    sel('预警级别', ['高', '中', '低'], 90), area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_inventory', label: '库存预警（超储/低储）', group: G1, fields: [
    text('物料编码', 130), text('物料名称', 150), num('当前库存', 100), num('安全库存', 100),
    sel('预警类型', ['超储', '低储'], 100), sel('预警级别', ['高', '中', '低'], 90), area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_slow', label: '呆滞料预警', group: G1, fields: [
    text('物料编码', 130), text('物料名称', 150), num('库龄天数', 100), sel('呆滞档位', ['90天', '180天', '365天'], 110),
    num('库存数量', 100), money('金额'), sel('预警级别', ['高', '中', '低'], 90), statusField(ST.warn)
  ] },
  { key: 'warn_capacity', label: '产能过载预警', group: G1, fields: [
    text('工序/设备', 140), date('日期'), num('需求工时', 100), num('可用工时', 100), pct('负荷率'),
    sel('预警级别', ['高', '中', '低'], 90), area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_wo', label: '工单延期预警', group: G1, fields: [
    text('工单号', 150), text('产品名称', 150), date('计划完成日'), num('延期天数', 100),
    sel('预警级别', ['高', '中', '低'], 90), area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_quality', label: '品质异常预警', group: G1, fields: [
    text('异常单号', 150), sel('异常类型', ['来料', '制程', '成品'], 100), text('批次/工单', 140),
    sel('异常等级', ['严重', '一般', '轻微'], 100), area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_loss', label: '物料损耗超标预警', group: G1, fields: [
    text('物料编码', 130), text('物料名称', 150), text('BOM版本', 100), pct('标准损耗率'), pct('实际损耗率'),
    sel('预警级别', ['高', '中', '低'], 90), statusField(ST.warn)
  ] },
  { key: 'warn_equip', label: '设备维保到期预警', group: G1, fields: [
    text('设备编码', 130), text('设备名称', 150), date('上次维保'), date('下次维保'), num('剩余天数', 100),
    sel('预警级别', ['高', '中', '低'], 90), statusField(ST.warn)
  ] },
  { key: 'warn_ecn', label: 'ECN 生效预警', group: G1, fields: [
    text('ECN编号', 150), text('涉及物料', 150), date('生效日期'), num('剩余天数', 100),
    area('变更说明'), statusField(ST.warn)
  ] },
  { key: 'warn_stocktake', label: '盘点到期提醒', group: G1, fields: [
    text('仓库/物料', 150), date('上次盘点日'), num('距下次天数', 100),
    sel('预警级别', ['高', '中', '低'], 90), area('说明'), statusField(ST.warn)
  ] },
  { key: 'warn_handle', label: '预警处理记录', group: G1, fields: [
    text('预警编号', 150), text('预警类型', 140), text('预警对象', 140), sel('预警级别', ['高', '中', '低'], 90),
    text('处理方式', 140), text('处理人', 100), datetime('处理时间', 165), area('处理结果'), statusField(ST.warn)
  ] },

  /* ================= 销售订单管理 ================= */
  { key: 'sales_order', label: '销售订单台账', group: G2, fields: [
    text('订单号', 150), text('客户', 140), text('产品名称', 150), num('数量', 100), money('单价'), money('金额'),
    date('订单日期'), date('承诺交期'), sel('优先级', ['普通', '加急', '特急'], 90), statusField(ST.order)
  ] },
  { key: 'order_review', label: '订单评审记录', group: G2, fields: [
    text('订单号', 150), date('评审日期'), sel('评审结论', ['通过', '有条件通过', '不通过'], 140), area('风险点'),
    text('评审人', 100), statusField(ST.appr)
  ] },
  { key: 'delivery_commit', label: '交期承诺管理', group: G2, fields: [
    text('订单号', 150), text('客户', 140), date('首次承诺交期'), date('最终承诺交期'), text('承诺人', 100), area('备注'), statusField()
  ] },
  { key: 'order_change', label: '订单变更记录', group: G2, fields: [
    text('订单号', 150), sel('变更类型', ['数量变更', '交期变更', '产品变更', '取消'], 120), area('变更内容'),
    date('变更日期'), text('申请人', 100), statusField()
  ] },
  { key: 'rush_order', label: '插单急单管理', group: G2, fields: [
    text('单号', 150), text('客户', 140), text('产品名称', 150), num('数量', 100), area('插单原因'),
    sel('优先级', ['加急', '特急'], 90), date('期望交期'), statusField()
  ] },
  { key: 'delivery_track', label: '完工交付跟踪', group: G2, fields: [
    text('订单号', 150), text('客户', 140), date('完工日期'), date('发货日期'), sel('交付状态', ['未交付', '部分交付', '已交付'], 110),
    area('备注'), statusField()
  ] },
  { key: 'order_cancel', label: '订单取消归档', group: G2, fields: [
    text('订单号', 150), text('客户', 140), text('产品名称', 150), area('取消原因'), date('取消日期'), statusField()
  ] },

  /* ================= 生产计划管理 ================= */
  { key: 'mps', label: '主生产计划 MPS 台账', group: G3, fields: [
    text('MPS编号', 150), text('产品名称', 150), num('计划数量', 100), date('计划开工'), date('计划完工'),
    sel('状态', ST.wo, 100), area('备注')
  ] },
  { key: 'month_plan', label: '月度生产计划', group: G3, fields: [
    text('计划月份', 100), text('产品名称', 150), num('计划数量', 100), num('实际数量', 100), pct('达成率'),
    area('备注'), statusField()
  ] },
  { key: 'week_schedule', label: '周生产排程', group: G3, fields: [
    text('周次', 100), text('产线', 110), text('产品名称', 150), num('排程数量', 100), date('排程日期'), area('备注'), statusField()
  ] },
  { key: 'day_plan', label: '日生产作业计划', group: G3, fields: [
    date('日期'), text('产线', 110), text('产品名称', 150), num('计划数量', 100), area('备注'), statusField()
  ] },
  { key: 'work_order', label: '生产工单管理台账', group: G3, fields: [
    text('工单号', 150), text('产品名称', 150), num('数量', 100), date('计划开工'), date('计划完工'), sel('状态', ST.wo, 100), area('备注')
  ] },
  { key: 'wo_progress', label: '工单下达开工完工记录', group: G3, fields: [
    text('工单号', 150), date('下达日期'), date('开工日期'), date('完工日期'), num('数量', 100), area('备注'), statusField(ST.wo)
  ] },
  { key: 'plan_change', label: '计划变更记录', group: G3, fields: [
    text('变更单号', 150), area('变更内容'), area('变更原因'), text('变更人', 100), date('变更日期'), statusField()
  ] },
  { key: 'plan_achieve', label: '计划达成统计', group: G3, fields: [
    text('统计周期', 110), num('计划数量', 100), num('达成数量', 100), pct('达成率'), area('备注'), statusField()
  ] }
]
