const inspect = require('bare-inspect')
const getType = require('bare-type')
const MemoizeMap = require('./lib/memoize-map')

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
  const memo = new MemoizeMap()

  if (deepStrictEqualValue(actual, expected, memo)) return

  assertFail({ message, actual, expected, operator: 'deepStrictEqual' }, deepStrictEqual)
}

exports.notDeepStrictEqual = function notDeepStrictEqual(actual, expected, message) {
  const memo = new MemoizeMap()

  if (!deepStrictEqualValue(actual, expected, memo)) return

  assertFail({ message, actual, expected, operator: 'notDeepStrictEqual' }, notDeepStrictEqual)
}

function deepStrictEqualValue(a, b, memo) {
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

  if (type.isRegExp()) return deepStrictEqualRegexp(a, b)

  const memoizedResultA = memo.get(a, b)
  if (memoizedResultA !== null) return memoizedResultA

  const memoizedResultB = memo.get(b, a)
  if (memoizedResultB !== null) return memoizedResultB

  // Temporary value to break circular recursion
  memo.set(a, b, true)

  let result
  if (type.isError()) result = deepStrictEqualError(a, b, memo)
  else if (type.isArray()) result = deepStrictEqualArray(a, b, memo)
  else if (type.isMap()) result = deepStrictEqualMap(a, b, memo)
  else if (type.isSet()) result = deepStrictEqualSet(a, b, memo)
  else result = deepStrictEqualObject(a, b, memo)

  memo.set(a, b, result)

  return result
}

function deepStrictEqualArray(a, b, memo) {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (!deepStrictEqualValue(a[i], b[i], memo)) return false
  }

  return true
}

function deepStrictEqualMap(a, b, memo) {
  if (a.size !== b.size) return false

  return deepStrictEqualArrayBruteForceSearch(
    Array.from(a.entries()),
    Array.from(b.entries()),
    memo
  )
}

function deepStrictEqualSet(a, b, memo) {
  if (a.size !== b.size) return false

  return deepStrictEqualArrayBruteForceSearch(Array.from(a.keys()), Array.from(b.keys()), memo)
}

function deepStrictEqualArrayBruteForceSearch(a, b, memo) {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    let found = false
    const itemA = a[i]

    for (let j = 0; j < b.length; j++) {
      const itemB = b[j]

      if (deepStrictEqualValue(itemA, itemB, memo)) {
        found = true

        b.splice(j, 1)

        break
      }
    }

    if (found === false) return false
  }

  return true
}

function deepStrictEqualRegexp(a, b) {
  return a.lastIndex === b.lastIndex && a.flags === b.flags && a.source === b.source
}

function deepStrictEqualError(a, b, memo) {
  return (
    deepStrictEqualValue(a.name, b.name, memo) && deepStrictEqualValue(a.message, b.message, memo)
  )
}

function deepStrictEqualObject(a, b, memo) {
  const aKeys = [...Object.keys(a), ...Object.getOwnPropertySymbols(a)]
  const bKeys = [...Object.keys(b), ...Object.getOwnPropertySymbols(b)]

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!deepStrictEqualValue(a[key], b[key], memo)) return false
  }

  return true
}
