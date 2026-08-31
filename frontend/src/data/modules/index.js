// 汇总所有模块配置，并提供按 key 查询
import { modulesGroup1 } from './modules-group1.js'
import { modulesGroup2 } from './modules-group2.js'
import { modulesGroup3 } from './modules-group3.js'
import { modulesGroup4 } from './modules-group4.js'

export const modules = [...modulesGroup1, ...modulesGroup2, ...modulesGroup3, ...modulesGroup4]

export const moduleMap = Object.fromEntries(modules.map((m) => [m.key, m]))

export function getModule(key) {
  return moduleMap[key] || null
}
