const inspect = require('bare-inspect')
const getType = require('bare-type')
const Memoization = require('./lib/memoization')
const getEnumerableKeys = require('./lib/get-enumerable-keys')

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
  const memo = new Memoization()

  if (deepStrictEqualValue(actual, expected, memo)) return

  assertFail({ message, actual, expected, operator: 'deepStrictEqual' }, deepStrictEqual)
}

exports.notDeepStrictEqual = function notDeepStrictEqual(actual, expected, message) {
  const memo = new Memoization()

  if (!deepStrictEqualValue(actual, expected, memo)) return

  assertFail({ message, actual, expected, operator: 'notDeepStrictEqual' }, notDeepStrictEqual)
}

function deepStrictEqualValue(a, b, memo) {
  const type = getType(a)

  if (!type.isObject() || !getType(b).isObject()) return Object.is(a, b)

  const prototype = Object.getPrototypeOf(a)

  if (prototype !== Object.getPrototypeOf(b)) return false

  if (type.isWeakMap() || type.isWeakSet() || type.isPromise()) return a === b

  if (Buffer.isBuffer(a)) return deepStrictEqualBuffer(a, b)
  if (type.isArrayBuffer()) return deepStrictEqualBuffer(new Uint8Array(a), new Uint8Array(b))
  if (type.isDataView()) {
    return deepStrictEqualBuffer(
      new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
      new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
    )
  }

  if (memo.has(a, b)) {
    return memo.compareCycles(a, b)
  } else {
    memo.add(a, b)
  }

  let result

  if (
    prototype === BigInt.prototype ||
    prototype === Boolean.prototype ||
    prototype === Number.prototype ||
    prototype === String.prototype ||
    prototype === Symbol.prototype
  ) {
    result = deepStrictEqualBoxedValue(a, b, memo)
  } else if (type.isRegExp()) result = deepStrictEqualRegexp(a, b, memo)
  else if (type.isTypedArray()) result = deepStrictEqualTypedArray(a, b, memo)
  else if (type.isDate()) result = deepStrictEqualDate(a, b, memo)
  else if (type.isError()) result = deepStrictEqualError(a, b, memo)
  else if (type.isArguments() || type.isArray()) result = deepStrictEqualArray(a, b, memo)
  else if (type.isMap()) result = deepStrictEqualMap(a, b, memo)
  else if (type.isSet()) result = deepStrictEqualSet(a, b, memo)
  else result = deepStrictEqualObject(a, b, memo)

  memo.remove(a, b)

  return result
}

function deepStrictEqualBuffer(a, b) {
  return a.byteLength === b.byteLength && Buffer.compare(a, b) === 0
}

function deepStrictEqualBoxedValue(a, b, memo) {
  return deepStrictEqualValue(a.valueOf(), b.valueOf(), memo) && deepStrictEqualObject(a, b, memo)
}

function deepStrictEqualRegexp(a, b, memo) {
  return (
    a.lastIndex === b.lastIndex &&
    a.flags === b.flags &&
    a.source === b.source &&
    deepStrictEqualObject(a, b, memo)
  )
}

function deepStrictEqualDate(a, b, memo) {
  return Object.is(a.getTime(), b.getTime()) && deepStrictEqualObject(a, b, memo)
}

function deepStrictEqualError(a, b, memo) {
  return (
    deepStrictEqualValue(a.name, b.name, memo) &&
    deepStrictEqualValue(a.message, b.message, memo) &&
    deepStrictEqualObjectKeys(a, b, ['cause', 'errors'], memo) &&
    deepStrictEqualObject(a, b, memo)
  )
}

function deepStrictEqualArray(a, b, memo) {
  return a.length === b.length && deepStrictEqualObject(a, b, memo)
}

function deepStrictEqualTypedArray(a, b, memo) {
  return deepStrictEqualBuffer(a, b) && deepStrictEqualObject(a, b, memo)
}

function deepStrictEqualArrayUnordered(a, b, memo) {
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

// A key can be matched through a native `Map`/`Set` lookup only when it is a
// primitive whose deep equality collapses to the `SameValueZero` relation those
// lookups use. Objects and functions must be matched by deep comparison, and so
// must `+0` and `-0`: `SameValueZero` treats them as equal, but
// `deepStrictEqual` keeps their signs distinct.
function requiresDeepKeyMatch(key) {
  if (key === 0) return true // Covers both `+0` and `-0`.

  const type = typeof key

  return (type === 'object' && key !== null) || type === 'function'
}

function deepStrictEqualMap(a, b, memo) {
  if (a.size !== b.size || !deepStrictEqualObject(a, b, memo)) return false

  // Match entries with primitive keys directly through `b` in linear time and
  // leave only the object-keyed entries for the quadratic fallback.
  const restA = []
  const restB = []

  for (const [key, value] of a) {
    if (requiresDeepKeyMatch(key)) {
      restA.push([key, value])
    } else if (!b.has(key) || !deepStrictEqualValue(value, b.get(key), memo)) {
      return false
    }
  }

  for (const entry of b) {
    if (requiresDeepKeyMatch(entry[0])) restB.push(entry)
  }

  return deepStrictEqualArrayUnordered(restA, restB, memo)
}

function deepStrictEqualSet(a, b, memo) {
  if (a.size !== b.size || !deepStrictEqualObject(a, b, memo)) return false

  // Match primitive members directly through `b` in linear time and leave only
  // the object members for the quadratic fallback.
  const restA = []
  const restB = []

  for (const value of a) {
    if (requiresDeepKeyMatch(value)) restA.push(value)
    else if (!b.has(value)) return false
  }

  for (const value of b) {
    if (requiresDeepKeyMatch(value)) restB.push(value)
  }

  return deepStrictEqualArrayUnordered(restA, restB, memo)
}

function deepStrictEqualObjectKeys(a, b, keys, memo) {
  for (const key of keys) {
    const hasA = key in a
    const hasB = key in b

    if ((hasA ^ hasB) === 1) return false
    if (hasA && hasB && !deepStrictEqualValue(a[key], b[key], memo)) return false
  }

  return true
}

function deepStrictEqualObject(a, b, memo) {
  const aKeys = getEnumerableKeys(a)

  if (aKeys.length !== getEnumerableKeys(b).length) return false

  for (const key of aKeys) {
    if (!(key in b) || !deepStrictEqualValue(a[key], b[key], memo)) return false
  }

  return true
}
