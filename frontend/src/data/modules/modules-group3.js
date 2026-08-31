// 模块配置 - 第三组：库存与仓库 / 生产执行与车间管理
import { text, num, money, date, datetime, sel, area, pct, ST, statusField } from './_helpers.js'

const G6 = '库存与仓库管理'
const G7 = '生产执行与车间管理'

export const modulesGroup3 = [
  /* ================= 库存与仓库管理 ================= */
  { key: 'raw_inventory', label: '原材料库存台账', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), text('规格型号', 120), text('单位', 80), num('库存数量', 100),
    money('单价'), money('金额'), text('库位', 100), statusField()
  ] },
  { key: 'wip_inventory', label: '半成品 WIP 库存', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), text('当前工序', 110), num('数量', 100), text('工单号', 150), area('备注'), statusField()
  ] },
  { key: 'finished_inventory', label: '成品库存管理', group: G6, fields: [
    text('产品编码', 130), text('产品名称', 150), num('数量', 100), money('单价'), money('金额'), text('库位', 100), statusField()
  ] },
  { key: 'material_inventory', label: '辅料耗材库存', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), text('规格型号', 120), num('数量', 100), text('单位', 80), text('库位', 100), statusField()
  ] },
  { key: 'safety_stock', label: '安全库存设置预警', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), num('安全库存', 100), num('当前库存', 100),
    sel('预警状态', ['正常', '低于安全库存'], 140), area('备注'), statusField()
  ] },
  { key: 'minmax_stock', label: '最高最低库存管控', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), num('最低库存', 100), num('最高库存', 100), num('当前库存', 100),
    sel('管控状态', ['正常', '超储', '低储'], 110), statusField()
  ] },
  { key: 'stocktake', label: '库存盘点记录存档', group: G6, fields: [
    text('盘点单号', 150), text('仓库', 110), date('盘点日期'), text('盘点人', 100),
    sel('盘点状态', ['进行中', '已完成', '待复盘'], 120), area('备注'), statusField()
  ] },
  { key: 'stocktake_diff', label: '盘点差异处理', group: G6, fields: [
    text('盘点单号', 150), text('物料名称', 150), num('账存数量', 100), num('实存数量', 100), num('差异数量', 100),
    area('差异原因'), statusField(ST.quality)
  ] },
  { key: 'slow_stock', label: '呆滞料管理台账', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), num('库龄天数', 100), num('数量', 100), money('金额'),
    sel('呆滞等级', ['待定', '90天', '180天', '365天'], 110), statusField()
  ] },
  { key: 'turnover', label: '库存周转率分析', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), text('周期', 100), money('出库金额'), money('平均库存'), num('周转率', 100, { suffix: ' 次' }), statusField()
  ] },
  { key: 'age_report', label: '库龄分析报表', group: G6, fields: [
    text('物料编码', 130), text('物料名称', 150), text('批次', 100), date('入库日期'), num('库龄天数', 100), money('金额'), statusField()
  ] },
  { key: 'material_io', label: '领料退料记录', group: G6, fields: [
    text('单号', 150), sel('类型', ['领料', '退料'], 90), text('工单号', 150), text('物料名称', 150),
    num('数量', 100), date('日期'), statusField()
  ] },
  { key: 'transfer', label: '调拨记录台账', group: G6, fields: [
    text('调拨单号', 150), text('物料名称', 150), num('数量', 100), text('调出仓', 110), text('调入仓', 110),
    date('调拨日期'), statusField()
  ] },

  /* ================= 生产执行与车间管理 ================= */
  { key: 'wo_track', label: '工单进度跟踪', group: G7, fields: [
    text('工单号', 150), text('产品名称', 150), text('当前工序', 110), pct('完成进度'), num('完成数量', 100),
    date('预计完成'), statusField(ST.wo)
  ] },
  { key: 'workshop_daily', label: '车间日报产量统计', group: G7, fields: [
    date('日期'), text('产线', 110), text('产品名称', 150), num('计划数量', 100), num('实际数量', 100), pct('完成率'), statusField()
  ] },
  { key: 'op_report', label: '工序进度报工记录', group: G7, fields: [
    text('工单号', 150), text('工序名称', 110), num('报工数量', 100), num('合格数', 100), datetime('报工时间', 165), statusField()
  ] },
  { key: 'wip_track', label: '在制品 WIP 跟踪', group: G7, fields: [
    text('工单号', 150), text('产品名称', 150), text('当前工序', 110), num('在制数量', 100), num('完成进度', 100, { suffix: '%' }), statusField()
  ] },
  { key: 'prod_exception', label: '生产异常工单登记', group: G7, fields: [
    text('工单号', 150), sel('异常类型', ['设备故障', '品质异常', '缺料', '人员不足', '其他'], 130), area('异常描述'),
    datetime('发生时间', 165), statusField(ST.quality)
  ] },
  { key: 'equipment', label: '设备台账与维保记录', group: G7, fields: [
    text('设备编码', 130), text('设备名称', 150), sel('设备类型', ['注塑机', 'CNC', '装配线', '检测设备', '其他'], 130),
    date('上次维保'), date('下次维保'), text('维保周期', 100, { placeholder: '如 90天' }), statusField()
  ] },
  { key: 'equipment_down', label: '设备故障停机记录', group: G7, fields: [
    text('设备名称', 150), area('故障描述'), datetime('停机开始', 165), datetime('停机结束', 165),
    num('停机时长(小时)', 130), statusField(ST.quality)
  ] },
  { key: 'rework', label: '返工返修记录存档', group: G7, fields: [
    text('工单号', 150), text('产品名称', 150), num('返工数量', 100), area('返工原因'), date('返工完成日'), statusField()
  ] },
  { key: 'scrap', label: '报废记录与原因分析', group: G7, fields: [
    text('工单号', 150), text('物料名称', 150), num('报废数量', 100), area('报废原因'), money('金额'), statusField()
  ] },
  { key: 'prod_efficiency', label: '生产效率统计', group: G7, fields: [
    text('统计周期', 110), text('产线', 110), num('标准工时', 100), num('实际工时', 100), pct('效率'), area('备注'), statusField()
  ] }
]
