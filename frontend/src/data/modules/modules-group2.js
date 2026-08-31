// 模块配置 - 第二组：物料需求与 BOM / 采购与供应商
import { text, num, money, date, datetime, sel, area, pct, ST, statusField } from './_helpers.js'

const G4 = '物料需求与 BOM 管理'
const G5 = '采购与供应商管理'

export const modulesGroup2 = [
  /* ================= 物料需求与 BOM ================= */
  { key: 'mrp', label: 'MRP 运算结果台账', group: G4, fields: [
    text('运算批次', 120), text('物料编码', 130), text('物料名称', 150), num('毛需求', 100), num('已有库存', 100),
    num('净需求', 100), date('运算日期'), area('备注'), statusField()
  ] },
  { key: 'material_demand', label: '物料需求汇总表', group: G4, fields: [
    text('物料编码', 130), text('物料名称', 150), num('需求数量', 100), date('需求日期'), text('来源订单', 140),
    sel('需求类型', ['生产需求', '安全库存', '备品备件'], 130), statusField()
  ] },
  { key: 'material_request', label: '物料请购申请台账', group: G4, fields: [
    text('请购单号', 150), text('物料名称', 150), num('请购数量', 100), date('需求日期'), text('申请人', 100), area('用途说明'), statusField(ST.appr)
  ] },
  { key: 'request_approval', label: '请购审批记录', group: G4, fields: [
    text('请购单号', 150), text('审批人', 100), sel('审批结论', ['通过', '驳回'], 90), area('审批意见'), datetime('审批时间', 165), statusField()
  ] },
  { key: 'purchase_suggest', label: '采购建议生成', group: G4, fields: [
    text('建议单号', 150), text('物料名称', 150), num('建议数量', 100), text('供应商', 140), date('建议到货日'), area('建议说明'), statusField()
  ] },
  { key: 'bom', label: '产品 BOM 明细台账', group: G4, fields: [
    text('BOM编号', 150), text('产品名称', 150), text('物料编码', 130), text('物料名称', 150), num('用量', 100),
    text('单位', 80), text('版本', 80), statusField()
  ] },
  { key: 'bom_version', label: 'BOM 版本管理', group: G4, fields: [
    text('BOM编号', 150), text('版本', 80), date('生效日期'), area('变更说明'), text('创建人', 100), statusField()
  ] },
  { key: 'bom_loss', label: 'BOM 用量损耗率维护', group: G4, fields: [
    text('产品名称', 150), text('物料名称', 150), num('标准用量', 100), pct('损耗率'), text('版本', 80), area('备注'), statusField()
  ] },
  { key: 'ecn', label: '工程变更 ECN 存档', group: G4, fields: [
    text('ECN编号', 150), text('涉及产品', 150), area('变更内容'), date('生效日期'), text('申请人', 100), statusField()
  ] },
  { key: 'alt_material', label: '替代料管理清单', group: G4, fields: [
    text('主料编码', 130), text('主料名称', 150), text('替代料编码', 130), text('替代料名称', 150),
    text('替代规则', 120), num('优先级', 90), statusField()
  ] },
  { key: 'process_route', label: '产品工艺路线档案', group: G4, fields: [
    text('产品名称', 150), num('工序号', 90), text('工序名称', 120), text('设备', 120), num('标准工时', 100), area('工艺要求'), statusField()
  ] },

  /* ================= 采购与供应商管理 ================= */
  { key: 'supplier', label: '供应商花名册', group: G5, fields: [
    text('供应商编码', 130), text('供应商名称', 180), text('联系人', 100), text('联系电话', 130), text('供应类别', 110),
    text('地址', 180), statusField()
  ] },
  { key: 'supplier_grade', label: '供应商分级分类台账', group: G5, fields: [
    text('供应商名称', 180), sel('分类', ['原材料', '委外加工', '辅料', '服务'], 130), sel('等级', ['A', 'B', 'C', 'D'], 90),
    num('评分', 90), date('评级日期'), area('备注'), statusField()
  ] },
  { key: 'purchase_order', label: '采购订单跟踪台账', group: G5, fields: [
    text('采购单号', 150), text('供应商', 150), text('物料名称', 150), num('数量', 100), money('单价'),
    date('下单日期'), date('计划到货'), statusField(ST.po)
  ] },
  { key: 'purchase_arrival', label: '采购到货跟进记录', group: G5, fields: [
    text('采购单号', 150), text('物料名称', 150), num('到货数量', 100), date('到货日期'),
    sel('检验结果', ['合格', '不合格', '待检'], 110), area('备注'), statusField()
  ] },
  { key: 'iqc', label: '来料检验 IQC 记录', group: G5, fields: [
    text('检验单号', 150), text('采购单号', 150), text('物料名称', 150), num('检验数量', 100), num('合格数', 100),
    sel('检验结果', ['合格', '不合格', '让步接收'], 120), statusField(ST.quality)
  ] },
  { key: 'supplier_perf', label: '供应商交付绩效统计', group: G5, fields: [
    text('供应商名称', 180), text('统计周期', 110), pct('准时率'), pct('合格率'), num('综合评分', 100), area('备注'), statusField()
  ] },
  { key: 'purchase_exception', label: '采购异常处理记录', group: G5, fields: [
    text('单号', 150), sel('异常类型', ['延期', '品质', '数量短缺', '价格', '其他'], 130), area('异常描述'),
    area('处理措施'), text('处理人', 100), statusField(ST.quality)
  ] },
  { key: 'purchase_price', label: '采购价格台账', group: G5, fields: [
    text('物料名称', 150), text('供应商', 150), money('单价'), sel('币种', ['CNY', 'USD', 'EUR'], 100),
    date('生效日期'), date('失效日期'), statusField()
  ] }
]
