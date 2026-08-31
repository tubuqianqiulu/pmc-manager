// 左侧菜单树：groups 为一级菜单（可折叠），fixedBottom 组固定显示在底部
export const menuTree = [
  { title: 'PMC 总览', icon: 'Odometer', path: '/' },

  { title: '预警中心', icon: 'BellFilled', collapsible: true, items: [
    { title: '缺料预警看板', key: 'warn_missing' },
    { title: '订单交期预警', key: 'warn_delivery' },
    { title: '采购到货延期预警', key: 'warn_purchase' },
    { title: '库存预警（超储/低储）', key: 'warn_inventory' },
    { title: '呆滞料预警', key: 'warn_slow' },
    { title: '产能过载预警', key: 'warn_capacity' },
    { title: '工单延期预警', key: 'warn_wo' },
    { title: '品质异常预警', key: 'warn_quality' },
    { title: '物料损耗超标预警', key: 'warn_loss' },
    { title: '设备维保到期预警', key: 'warn_equip' },
    { title: 'ECN 生效预警', key: 'warn_ecn' },
    { title: '盘点到期提醒', key: 'warn_stocktake' },
    { title: '预警规则配置', path: '/settings', tab: 'warn' },
    { title: '预警处理记录', key: 'warn_handle' }
  ] },

  { title: '销售订单管理', icon: 'ShoppingCart', items: [
    { title: '销售订单台账', key: 'sales_order' },
    { title: '订单评审记录', key: 'order_review' },
    { title: '交期承诺管理', key: 'delivery_commit' },
    { title: '订单变更记录', key: 'order_change' },
    { title: '插单急单管理', key: 'rush_order' },
    { title: '完工交付跟踪', key: 'delivery_track' },
    { title: '订单取消归档', key: 'order_cancel' }
  ] },

  { title: '生产计划管理', icon: 'Calendar', collapsible: true, items: [
    { title: '主生产计划 MPS 台账', key: 'mps' },
    { title: '月度生产计划', key: 'month_plan' },
    { title: '周生产排程', key: 'week_schedule' },
    { title: '日生产作业计划', key: 'day_plan' },
    { title: '生产工单管理台账', key: 'work_order' },
    { title: '工单下达开工完工记录', key: 'wo_progress' },
    { title: '计划变更记录', key: 'plan_change' },
    { title: '计划达成统计', key: 'plan_achieve' }
  ] },

  { title: '物料需求与 BOM 管理', icon: 'Box', items: [
    { title: 'MRP 运算结果台账', key: 'mrp' },
    { title: '物料需求汇总表', key: 'material_demand' },
    { title: '物料请购申请台账', key: 'material_request' },
    { title: '请购审批记录', key: 'request_approval' },
    { title: '采购建议生成', key: 'purchase_suggest' },
    { title: '产品 BOM 明细台账', key: 'bom' },
    { title: 'BOM 版本管理', key: 'bom_version' },
    { title: 'BOM 用量损耗率维护', key: 'bom_loss' },
    { title: '工程变更 ECN 存档', key: 'ecn' },
    { title: '替代料管理清单', key: 'alt_material' },
    { title: '产品工艺路线档案', key: 'process_route' }
  ] },

  { title: '采购与供应商管理', icon: 'Truck', items: [
    { title: '供应商花名册', key: 'supplier' },
    { title: '供应商分级分类台账', key: 'supplier_grade' },
    { title: '采购订单跟踪台账', key: 'purchase_order' },
    { title: '采购到货跟进记录', key: 'purchase_arrival' },
    { title: '来料检验 IQC 记录', key: 'iqc' },
    { title: '供应商交付绩效统计', key: 'supplier_perf' },
    { title: '采购异常处理记录', key: 'purchase_exception' },
    { title: '采购价格台账', key: 'purchase_price' }
  ] },

  { title: '库存与仓库管理', icon: 'Files', items: [
    { title: '原材料库存台账', key: 'raw_inventory' },
    { title: '半成品 WIP 库存', key: 'wip_inventory' },
    { title: '成品库存管理', key: 'finished_inventory' },
    { title: '辅料耗材库存', key: 'material_inventory' },
    { title: '安全库存设置预警', key: 'safety_stock' },
    { title: '最高最低库存管控', key: 'minmax_stock' },
    { title: '库存盘点记录存档', key: 'stocktake' },
    { title: '盘点差异处理', key: 'stocktake_diff' },
    { title: '呆滞料管理台账', key: 'slow_stock' },
    { title: '库存周转率分析', key: 'turnover' },
    { title: '库龄分析报表', key: 'age_report' },
    { title: '领料退料记录', key: 'material_io' },
    { title: '调拨记录台账', key: 'transfer' }
  ] },

  { title: '生产执行与车间管理', icon: 'Tools', items: [
    { title: '工单进度跟踪', key: 'wo_track' },
    { title: '车间日报产量统计', key: 'workshop_daily' },
    { title: '工序进度报工记录', key: 'op_report' },
    { title: '在制品 WIP 跟踪', key: 'wip_track' },
    { title: '生产异常工单登记', key: 'prod_exception' },
    { title: '设备台账与维保记录', key: 'equipment' },
    { title: '设备故障停机记录', key: 'equipment_down' },
    { title: '返工返修记录存档', key: 'rework' },
    { title: '报废记录与原因分析', key: 'scrap' },
    { title: '生产效率统计', key: 'prod_efficiency' }
  ] },

  { title: '品质与异常管理', icon: 'CircleCheck', items: [
    { title: '来料品质异常记录', key: 'iqc_quality' },
    { title: '制程品质异常记录', key: 'process_quality' },
    { title: '成品品质异常记录', key: 'finished_quality' },
    { title: '品质异常 8D 报告', key: 'quality_8d' },
    { title: '异常处理进度跟踪', key: 'exception_track' },
    { title: '责任归属记录', key: 'responsibility' },
    { title: '纠正预防措施 CAPA', key: 'capa' },
    { title: '品质数据统计分析', key: 'quality_stats' },
    { title: '客诉反馈协同记录', key: 'complaint' }
  ] },

  { title: '委外加工管理', icon: 'Share', items: [
    { title: '委外供应商台账', key: 'outsource_supplier' },
    { title: '委外加工订单', key: 'outsource_order' },
    { title: '委外发料记录', key: 'outsource_send' },
    { title: '委外到货跟踪', key: 'outsource_arrival' },
    { title: '委外质检记录', key: 'outsource_iqc' },
    { title: '委外加工费台账', key: 'outsource_fee' },
    { title: '委外异常处理', key: 'outsource_exception' }
  ] },

  { title: '数据报表中心', icon: 'DataAnalysis', items: [
    { title: '生产计划达成报表', key: 'report_plan' },
    { title: '物料需求汇总表', key: 'report_material' },
    { title: '库存周转分析报表', key: 'report_turnover' },
    { title: '产能利用统计表', key: 'report_capacity' },
    { title: '采购交付绩效表', key: 'report_purchase' },
    { title: '生产异常统计报表', key: 'report_prod_exception' },
    { title: '销售订单交付报表', key: 'report_sales' },
    { title: '品质异常统计报表', key: 'report_quality' },
    { title: '月度 PMC 综合报表', key: 'report_monthly' },
    { title: '报表自定义查询导出', key: 'report_custom' }
  ] },

  { title: '待办与备忘录', icon: 'Notebook', items: [
    { title: 'PMC 每日待办事项', key: 'todo' },
    { title: '工作备忘录笔记', key: 'memo' },
    { title: '重要事项标记提醒', key: 'important' },
    { title: '会议纪要记录', key: 'meeting' },
    { title: '跟进事项闭环管理', key: 'followup' },
    { title: '常用网址收藏', key: 'links' }
  ] },

  { title: '刚需辅助工具', icon: 'MagicStick', items: [
    { title: '交期推算计算器', path: '/tools', tab: 'date-calc' },
    { title: '产能负荷计算器', path: '/tools', tab: 'capacity' },
    { title: '物料需求估算器', path: '/tools', tab: 'material' },
    { title: '库存周转计算器', path: '/tools', tab: 'turnover' },
    { title: '条码单号生成器', path: '/utils', tab: 'barcode' },
    { title: '日历视图', path: '/utils', tab: 'calendar' },
    { title: '数据批量导入导出', path: '/utils', tab: 'import' },
    { title: '数据对比工具', path: '/utils', tab: 'compare' },
    { title: '操作日志记录', path: '/utils', tab: 'logs' }
  ] },

  { title: '系统设置', icon: 'Setting', fixedBottom: true, items: [
    { title: '个人信息修改', path: '/settings', tab: 'profile' },
    { title: '密码修改设置', path: '/settings', tab: 'password' },
    { title: '所有数据导出功能', path: '/settings', tab: 'export' },
    { title: '工作台基础参数配置', path: '/settings', tab: 'params' },
    { title: '预警规则参数配置', path: '/settings', tab: 'warn' },
    { title: '编号规则配置', path: '/settings', tab: 'numbering' },
    { title: '数据备份与恢复', path: '/settings', tab: 'backup' },
    { title: '数据清空与重置', path: '/settings', tab: 'reset' }
  ] }
]
