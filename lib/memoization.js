const getEnumerableKeys = require('./get-enumerable-keys')

module.exports = class Memoization {
  constructor() {
    this._nodes = new Set()
  }

  has(a, b) {
    return this._nodes.has(a) || this._nodes.has(b)
  }

  add(a, b) {
    this._nodes.add(a).add(b)
  }

  remove(a, b) {
    this._nodes.delete(a)
    this._nodes.delete(b)
  }

  compareCycles(a, b) {
    const aCycleSize = this._nodes.has(a) ? getEnumerableKeys(a).length : 0
    const bCycleSize = this._nodes.has(b) ? getEnumerableKeys(b).length : 0

    return aCycleSize === bCycleSize
  }
}
