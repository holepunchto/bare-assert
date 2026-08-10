const pendingSymbol = Symbol('pending')

class Node {
  constructor(depth) {
    this._depth = depth
    this._count = 1
  }

  get depth() {
    return this._depth
  }

  get count() {
    return this._count
  }

  update(depth) {
    this._depth = depth
    this._count++
  }

  equals(node) {
    return this._depth === node.depth && this._count === node.count
  }
}

module.exports = class MemoizeMap {
  constructor() {
    this._pairs = new Map()
    this._nodes = new Map()
  }

  has(a, b) {
    const pairs = this._pairs.get(a)

    if (pairs === undefined) return false

    return pairs.has(b)
  }

  get(a, b) {
    const pairs = this._pairs.get(a)

    const result = pairs.get(b)

    if (result === pendingSymbol) {
      const nodeA = this._nodes.get(a)
      const nodeB = this._nodes.get(b)

      const newResult = nodeA.equals(nodeB)

      pairs.set(b, newResult)

      return newResult
    }

    return result
  }

  set(a, b, depth, result = pendingSymbol) {
    this._updateNodes(a, b, depth)

    let pairs = this._pairs.get(a)

    if (pairs === undefined) {
      pairs = new Map()
      this._pairs.set(a, pairs)
    }

    pairs.set(b, result)
  }

  _updateNodes(a, b, depth) {
    if (this._nodes.has(a)) this._nodes.get(a).update(depth)
    else this._nodes.set(a, new Node(depth))

    if (this._nodes.has(b)) this._nodes.get(b).update(depth)
    else this._nodes.set(b, new Node(depth))
  }
}
