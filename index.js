const inspect = require('bare-inspect')
const getType = require('bare-type')

class AssertionError extends Error {
  constructor(opts = {}) {
    let { message = null, actual, expected, operator } = opts

    if (message === null) {
      message = `${inspect(actual)} ${operator} ${inspect(expected)}`
    }

    super(message)

    this.actual = actual
    this.expected = expected
    this.operator = operator
  }

  get name() {
    return 'AssertionError'
  }

  get code() {
    'ASSERTION'
  }
}

function assertFail(opts, fn) {
  if (opts.message instanceof Error) throw opts.message

  const err = new AssertionError(opts)

  if (Error.captureStackTrace) Error.captureStackTrace(err, fn)

  throw err
}

module.exports = exports = function assert(actual, message) {
  if (actual) return

  assertFail({ message, actual, expected: true, operator: '==' }, assert)
}

exports.AssertionError = AssertionError

exports.fail = function fail(message) {
  if (message === undefined) message = 'Failed'

  assertFail({ message, operator: 'fail' }, fail)
}

exports.ok = function ok(actual, message) {
  if (actual) return

  assertFail({ message, actual, expected: true, operator: '==' }, ok)
}

exports.notOk = function ok(actual, message) {
  if (!actual) return

  assertFail({ message, actual, expected: false, operator: '==' }, ok)
}

exports.equal = function equal(actual, expected, message) {
  if (actual == expected || (actual !== actual && expected !== expected)) {
    return
  }

  assertFail({ message, actual, expected, operator: '==' }, equal)
}

exports.notEqual = function notEqual(actual, expected, message) {
  if (actual != expected && (actual === actual || expected === expected)) {
    return
  }

  assertFail({ message, actual, expected, operator: '!=' }, notEqual)
}

exports.strictEqual = function strictEqual(actual, expected, message) {
  if (Object.is(actual, expected)) return

  assertFail({ message, actual, expected, operator: 'strictEqual' }, strictEqual)
}

exports.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (!Object.is(actual, expected)) return

  assertFail({ message, actual, expected, operator: 'notStrictEqual' }, notStrictEqual)
}

exports.match = function match(actual, regexp, message) {
  if (typeof actual === 'string' && actual.match(regexp) !== null) return

  assertFail({ message, actual, expected: regexp, operator: 'match' }, match)
}

exports.doesNotMatch = function doesNotMatch(actual, regexp, message) {
  if (typeof actual === 'string' && actual.match(regexp) === null) return

  assertFail({ message, actual, expected: regexp, operator: 'doesNotMatch' }, doesNotMatch)
}

exports.ifError = function ifError(actual) {
  if (actual === null || actual === undefined) return

  const message = `ifError got ${inspect(actual)}`

  assertFail({ message, actual, operator: 'ifError' }, ifError)
}

exports.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (deepStrictEqualValue(actual, expected)) return

  assertFail({ message, actual, expected, operator: 'deepStrictEqual' }, deepStrictEqual)
}

exports.notDeepStrictEqual = function notDeepStrictEqual(actual, expected, message) {
  if (!deepStrictEqualValue(actual, expected)) return

  assertFail({ message, actual, expected, operator: 'notDeepStrictEqual' }, notDeepStrictEqual)
}

function deepStrictEqualValue(a, b) {
  const type = getType(a)

  if (!type.isObject() || !getType(b).isObject()) return Object.is(a, b)

  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false

  const isWrapped = [
    String.prototype,
    Number.prototype,
    Boolean.prototype,
    Date.prototype
  ].includes(Object.getPrototypeOf(a))

  if (isWrapped) return deepStrictEqualValue(a.valueOf(), b.valueOf())

  if (type.isWeakMap() || type.isWeakSet() || type.isPromise()) return a === b

  if (type.isArray()) return deepStrictEqualArray(a, b)
  if (type.isMap()) return deepStrictEqualMap(a, b)
  if (type.isSet()) return deepStrictEqualSet(a, b)
  if (type.isRegExp()) return deepStrictEqualRegexp(a, b)
  if (type.isError()) return deepStrictEqualError(a, b)

  return deepStrictEqualObject(a, b)
}

function deepStrictEqualArray(a, b) {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (!deepStrictEqualValue(a[i], b[i])) return false
  }

  return true
}

function deepStrictEqualMap(a, b) {
  if (a.size !== b.size) return false

  const nonPrimitiveKeysEntriesFromA = []

  for (const [key, value] of a) {
    if (getType(key).isObject()) nonPrimitiveKeysEntriesFromA.push([key, value])
    else if (!b.has(key) || !deepStrictEqualValue(value, b.get(key))) return false
  }

  if (nonPrimitiveKeysEntriesFromA.length > 0) {
    const nonPrimitiveKeysEntriesFromB = []

    for (const [key, value] of b) {
      if (getType(key).isObject()) nonPrimitiveKeysEntriesFromB.push([key, value])
    }

    if (nonPrimitiveKeysEntriesFromA.length !== nonPrimitiveKeysEntriesFromB.length) {
      return false
    }

    for (const [keyA, valueA] of nonPrimitiveKeysEntriesFromA) {
      let found = false

      for (let i = 0; i < nonPrimitiveKeysEntriesFromB.length; i++) {
        const [keyB, valueB] = nonPrimitiveKeysEntriesFromB[i]

        if (deepStrictEqualValue(keyA, keyB) && deepStrictEqualValue(valueA, valueB)) {
          nonPrimitiveKeysEntriesFromB.splice(i, 1)
          found = true
          break
        }
      }

      if (found === false) return false
    }
  }

  return true
}

function deepStrictEqualSet(a, b) {
  if (a.size !== b.size) return false

  const nonPrimitiveItemsFromA = []

  for (const item of a) {
    if (getType(item).isObject()) nonPrimitiveItemsFromA.push(item)
    else if (!b.has(item)) return false
  }

  if (nonPrimitiveItemsFromA.length > 0) {
    const nonPrimitiveItemsFromB = []

    for (const item of b) {
      if (getType(item).isObject()) nonPrimitiveItemsFromB.push(item)
    }

    if (nonPrimitiveItemsFromA.length !== nonPrimitiveItemsFromB.length) return false

    for (const itemA of nonPrimitiveItemsFromA) {
      let found = false

      for (let i = 0; i < nonPrimitiveItemsFromB.length; i++) {
        const itemB = nonPrimitiveItemsFromB[i]

        if (deepStrictEqualValue(itemA, itemB)) {
          nonPrimitiveItemsFromB.splice(i, 1)
          found = true
          break
        }
      }

      if (found === false) return false
    }

    return nonPrimitiveItemsFromB.length === 0
  }

  return true
}

function deepStrictEqualRegexp(a, b) {
  return a.lastIndex === b.lastIndex && a.flags === b.flags && a.source === b.source
}

function deepStrictEqualError(a, b) {
  return deepStrictEqualValue(a.name, b.name) && deepStrictEqualValue(a.message, b.message)
}

function deepStrictEqualObject(a, b) {
  const aKeys = [...Object.keys(a), ...Object.getOwnPropertySymbols(a)]
  const bKeys = [...Object.keys(b), ...Object.getOwnPropertySymbols(b)]

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!deepStrictEqualValue(a[key], b[key])) return false
  }

  return true
}
