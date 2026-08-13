const getEnumerableKeys = require('./get-enumerable-keys')
const getType = require('bare-type')

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
    const aCycleSize = this._nodes.has(a) ? this._countNodes(a) : 0
    const bCycleSize = this._nodes.has(b) ? this._countNodes(b) : 0

    return aCycleSize === bCycleSize
  }

  _countNodes(obj) {
    const nodes = new Set()

    function walk(rootNode) {
      const keys = getEnumerableKeys(rootNode)

      for (const key of keys) {
        const node = obj[key]

        if (nodes.has(node)) continue

        nodes.add(node)

        if (getType(node).isObject()) walk(node)
      }
    }

    walk(obj)

    return nodes.size
  }
}
