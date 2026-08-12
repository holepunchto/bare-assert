const getEnumerableKeys = require('./get-enumerable-keys')

module.exports = class Memoization {
  constructor() {
    this._aNodes = new Set()
    this._bNodes = new Set()

    this._aCycleSize = 0
    this._bCycleSize = 0
  }

  add(a, b) {
    const hasA = this._aNodes.has(a)
    const hasB = this._bNodes.has(b)

    const newCycleFound = hasA || hasB

    if (hasA) {
      this._aCycleSize = getEnumerableKeys(a).length
    } else {
      this._aNodes.add(a)
    }

    if (hasB) {
      this._bCycleSize = getEnumerableKeys(b).length
    } else {
      this._bNodes.add(b)
    }

    return newCycleFound
  }

  remove(a, b) {
    this._aNodes.delete(a)
    this._bNodes.delete(b)

    const sameCycleSize = this._aCycleSize === this._bCycleSize

    this._aCycleSize = 0
    this._bCycleSize = 0

    return sameCycleSize
  }
}
