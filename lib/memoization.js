// Tracks the values currently being compared so that a comparison which
// revisits a pair can be settled without recursing forever.
//
// Reaching a pair where both values are already being compared means the two
// structures have looped back in step, so they agree. Reaching a pair where
// only one of them has looped means one structure repeated where the other did
// not, so they differ.
module.exports = class Memoization {
  constructor() {
    this._nodes = new Set()
  }

  has(a, b) {
    return this._nodes.has(a) || this._nodes.has(b)
  }

  compare(a, b) {
    return this._nodes.has(a) && this._nodes.has(b)
  }

  add(a, b) {
    this._nodes.add(a).add(b)
  }

  remove(a, b) {
    this._nodes.delete(a)
    this._nodes.delete(b)
  }
}
