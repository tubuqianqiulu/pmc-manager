// localStorage 读写封装（所有操作带容错，保证数据不因异常丢失）
export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[storage] 读取失败，使用默认值', key, e)
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error('[storage] 保存失败', key, e)
    return false
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) { /* ignore */ }
}
