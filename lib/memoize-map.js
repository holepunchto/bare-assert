module.exports = class MemoizeMap {
  constructor() {
    this._map = new WeakMap()
  }

  get(a, b) {
    const map = this._map.get(a)
    if (map === undefined) return null

    const result = map.get(b)
    if (result === undefined) return null

    return result
  }

  set(a, b, result) {
    let map = this._map.get(a)

    if (map === undefined) {
      map = new WeakMap()
      this._map.set(a, map)
    }

    map.set(b, result)
  }
}
