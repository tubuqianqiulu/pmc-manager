// 模块配置 - 第四组：品质与异常 / 委外加工 / 数据报表 / 待办与备忘录
import { text, num, money, date, datetime, sel, area, pct, bool, ST, statusField } from './_helpers.js'

const G8 = '品质与异常管理'
const G9 = '委外加工管理'
const G10 = '数据报表中心'
const G11 = '待办与备忘录'

export const modulesGroup4 = [
  /* ================= 品质与异常管理 ================= */
  { key: 'iqc_quality', label: '来料品质异常记录', group: G8, fields: [
    text('异常单号', 150), text('供应商', 140), text('批次/来料单', 150), area('异常描述'),
    sel('异常等级', ['严重', '一般', '轻微'], 100), statusField(ST.quality)
  ] },
  { key: 'process_quality', label: '制程品质异常记录', group: G8, fields: [
    text('异常单号', 150), text('工单号', 150), text('工序', 100), area('异常描述'),
    sel('异常等级', ['严重', '一般', '轻微'], 100), statusField(ST.quality)
  ] },
  { key: 'finished_quality', label: '成品品质异常记录', group: G8, fields: [
    text('异常单号', 150), text('产品名称', 150), text('批次', 100), area('异常描述'),
    sel('异常等级', ['严重', '一般', '轻微'], 100), statusField(ST.quality)
  ] },
  { key: 'quality_8d', label: '品质异常 8D 报告', group: G8, fields: [
    text('8D编号', 150), text('异常单号', 150), area('问题描述'), area('根本原因'), area('永久措施'),
    text('8D负责人', 110), statusField()
  ] },
  { key: 'exception_track', label: '异常处理进度跟踪', group: G8, fields: [
    text('异常单号', 150), text('处理步骤', 140), text('负责人', 100), date('计划完成'), date('实际完成'), area('进展说明'), statusField()
  ] },
  { key: 'responsibility', label: '责任归属记录', group: G8, fields: [
    text('异常单号', 150), text('责任部门', 130), text('责任人', 100), area('责任分析'), area('改善要求'), statusField()
  ] },
  { key: 'capa', label: '纠正预防措施 CAPA', group: G8, fields: [
    text('CAPA编号', 150), text('异常单号', 150), sel('措施类型', ['纠正措施', '预防措施'], 130), area('措施内容'),
    area('验证结果'), statusField()
  ] },
  { key: 'quality_stats', label: '品质数据统计分析', group: G8, fields: [
    text('统计周期', 110), num('检验总数', 100), num('缺陷数', 100), pct('不良率'), area('分析结论'), statusField()
  ] },
  { key: 'complaint', label: '客诉反馈协同记录', group: G8, fields: [
    text('客诉单号', 150), text('客户', 140), area('反馈内容'), area('处理结果'), text('处理人', 100), datetime('反馈时间', 165), statusField()
  ] },

  /* ================= 委外加工管理 ================= */
  { key: 'outsource_supplier', label: '委外供应商台账', group: G9, fields: [
    text('供应商编码', 130), text('供应商名称', 180), text('加工类型', 120), text('联系人', 100), text('联系电话', 130), statusField()
  ] },
  { key: 'outsource_order', label: '委外加工订单', group: G9, fields: [
    text('委外单号', 150), text('供应商', 150), text('产品名称', 150), num('数量', 100), money('单价'),
    date('交期'), statusField(ST.po)
  ] },
  { key: 'outsource_send', label: '委外发料记录', group: G9, fields: [
    text('发料单号', 150), text('委外单号', 150), text('物料名称', 150), num('发料数量', 100), date('发料日期'), area('备注'), statusField()
  ] },
  { key: 'outsource_arrival', label: '委外到货跟踪', group: G9, fields: [
    text('委外单号', 150), text('产品名称', 150), num('到货数量', 100), date('到货日期'),
    sel('到货状态', ['未到', '部分到', '已到齐'], 110), statusField()
  ] },
  { key: 'outsource_iqc', label: '委外质检记录', group: G9, fields: [
    text('检验单号', 150), text('委外单号', 150), text('产品名称', 150), num('检验数量', 100),
    sel('检验结果', ['合格', '不合格', '让步接收'], 120), statusField(ST.quality)
  ] },
  { key: 'outsource_fee', label: '委外加工费台账', group: G9, fields: [
    text('委外单号', 150), text('供应商', 150), money('加工费'), date('结算日期'), sel('结算状态', ['未结算', '已结算'], 110), statusField()
  ] },
  { key: 'outsource_exception', label: '委外异常处理', group: G9, fields: [
    text('单号', 150), sel('异常类型', ['延期', '品质', '数量', '费用', '其他'], 130), area('异常描述'),
    area('处理措施'), statusField(ST.quality)
  ] },

  /* ================= 数据报表中心 ================= */
  { key: 'report_plan', label: '生产计划达成报表', group: G10, fields: [
    text('统计周期', 110), num('计划数量', 100), num('达成数量', 100), pct('达成率'), area('备注'), statusField()
  ] },
  { key: 'report_material', label: '物料需求汇总表', group: G10, fields: [
    text('统计周期', 110), text('物料编码', 130), text('物料名称', 150), num('需求数量', 100), date('需求日期'), statusField()
  ] },
  { key: 'report_turnover', label: '库存周转分析报表', group: G10, fields: [
    text('统计周期', 110), text('物料编码', 130), text('物料名称', 150), num('周转率', 100, { suffix: ' 次' }), area('分析结论'), statusField()
  ] },
  { key: 'report_capacity', label: '产能利用统计表', group: G10, fields: [
    text('统计周期', 110), text('设备/工序', 130), num('可用工时', 100), num('实际工时', 100), pct('利用率'), statusField()
  ] },
  { key: 'report_purchase', label: '采购交付绩效表', group: G10, fields: [
    text('统计周期', 110), text('供应商', 150), pct('准时率'), pct('合格率'), num('综合评分', 100), statusField()
  ] },
  { key: 'report_prod_exception', label: '生产异常统计报表', group: G10, fields: [
    text('统计周期', 110), num('异常次数', 100), num('停机时长(小时)', 130), area('异常原因分布'), statusField()
  ] },
  { key: 'report_sales', label: '销售订单交付报表', group: G10, fields: [
    text('统计周期', 110), num('订单数量', 100), num('按期交付数', 110), pct('按期交付率'), statusField()
  ] },
  { key: 'report_quality', label: '品质异常统计报表', group: G10, fields: [
    text('统计周期', 110), num('异常次数', 100), pct('不良率'), text('主要类型', 130), statusField()
  ] },
  { key: 'report_monthly', label: '月度 PMC 综合报表', group: G10, fields: [
    text('月份', 100), pct('计划达成率'), pct('物料齐套率'), pct('产能利用率'), money('库存金额'),
    num('工单数', 90), area('综述'), statusField()
  ] },
  { key: 'report_custom', label: '报表自定义查询导出', group: G10, fields: [
    text('报表名称', 150), text('指标', 130), num('数值', 100), text('统计周期', 110), area('备注'), statusField()
  ] },

  /* ================= 待办与备忘录 ================= */
  { key: 'todo', label: 'PMC 每日待办事项', group: G11, fields: [
    date('日期'), text('事项内容', 220), sel('优先级', ['高', '中', '低'], 90), text('负责人', 100), area('备注'), statusField()
  ] },
  { key: 'memo', label: '工作备忘录笔记', group: G11, fields: [
    text('标题', 180), area('内容'), date('创建日期'), text('标签', 100), statusField()
  ] },
  { key: 'important', label: '重要事项标记提醒', group: G11, fields: [
    text('事项', 200), date('提醒日期'), sel('优先级', ['高', '中', '低'], 90), bool('已提醒'), statusField()
  ] },
  { key: 'meeting', label: '会议纪要记录', group: G11, fields: [
    text('会议主题', 200), datetime('会议时间', 165), text('会议地点', 120), area('纪要内容'), area('行动项'), statusField()
  ] },
  { key: 'followup', label: '跟进事项闭环管理', group: G11, fields: [
    text('事项', 200), text('责任人', 100), date('计划完成'), date('实际完成'), sel('闭环状态', ['跟进中', '已闭环', '已关闭'], 110), statusField()
  ] },
  { key: 'links', label: '常用网址收藏', group: G11, fields: [
    text('名称', 160), text('网址', 220), text('分类', 100), area('备注'), statusField()
  ] }
]
