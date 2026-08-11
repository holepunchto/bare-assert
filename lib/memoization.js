const getEnumerableKeys = require('./get-enumerable-keys')

module.exports = class Memoization {
  constructor() {
    this._aNodes = new Set()
    this._bNodes = new Set()

    this._aCycleSizes = []
    this._bCycleSizes = []
  }

  register(a, b, allowDuplicates = false) {
    const hasA = this._aNodes.has(a)
    const hasB = this._bNodes.has(b)

    const newCycleFound = hasA || hasB

    if (hasA && !allowDuplicates) {
      this._aCycleSizes.push(getEnumerableKeys(a).length)

      this._aNodes.delete(a)
    } else {
      this._aNodes.add(a)
    }

    if (hasB && !allowDuplicates) {
      this._bCycleSizes.push(getEnumerableKeys(b).length)

      this._bNodes.delete(b)
    } else {
      this._bNodes.add(b)
    }

    return newCycleFound
  }

  cycles() {
    return [this._aCycleSizes, this._bCycleSizes]
  }
}
