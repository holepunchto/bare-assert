const getEnumerableKeys = require('./get-enumerable-keys')

module.exports = class Memoization {
  constructor() {
    this._aNodes = new Set()
    this._bNodes = new Set()
  }

  add(a, b) {
    const hasA = this._aNodes.has(a)
    const hasB = this._bNodes.has(b)

    if (hasA || hasB) {
      const aSize = hasA ? getEnumerableKeys(a).length : 0
      const bSize = hasB ? getEnumerableKeys(b).length : 0

      return { isCircular: true, isEqual: aSize === bSize }
    }

    this._aNodes.add(a)
    this._bNodes.add(b)

    return { isCircular: false }
  }

  remove(a, b) {
    this._aNodes.delete(a)
    this._bNodes.delete(b)
  }
}
