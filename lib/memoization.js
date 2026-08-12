const getEnumerableKeys = require('./get-enumerable-keys')

module.exports = class Memoization {
  constructor() {
    this._aNodes = new Set()
    this._bNodes = new Set()
  }

  has(a, b) {
    return this._aNodes.has(a) || this._bNodes.has(b)
  }

  add(a, b) {
    this._aNodes.add(a)
    this._bNodes.add(b)
  }

  remove(a, b) {
    this._aNodes.delete(a)
    this._bNodes.delete(b)
  }

  compareCycles(a, b) {
    const aCycleSize = this._aNodes.has(a) ? getEnumerableKeys(a).length : 0
    const bCycleSize = this._bNodes.has(b) ? getEnumerableKeys(b).length : 0

    return aCycleSize === bCycleSize
  }
}
