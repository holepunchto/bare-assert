module.exports = class MemoizeMap {
  constructor() {
    this._map = new Map()
  }

  get(a, b) {
    const map = this._map.get(a)

    if (map === undefined) return

    return map.get(b)
  }

  set(a, b, result) {
    let map = this._map.get(a)

    if (map === undefined) {
      map = new Map()
      this._map.set(a, map)
    }

    map.set(b, result)
  }
}
