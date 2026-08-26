const inspect = require('bare-inspect')
const getType = require('bare-type')
const Memoization = require('./lib/memoization')

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

function assertError(actual, expected) {
  if (expected === undefined) return true

  const type = getType(expected)

  if (type.isRegExp()) {
    if (expected.test(actual)) return true
  } else if (type.isFunction()) {
    if (expected(actual) === true) return true
    if (expected.prototype !== undefined && actual instanceof expected) return true
  } else if (type.isError()) {
    if (deepStrictEqualError(actual, expected)) return true
  } else if (type.isObject()) {
    if (assertErrorObject(actual, expected)) return true
  }

  return false
}

function assertErrorObject(actual, expected, memo = new Memoization()) {
  const actualKeys = ['name', 'message', ...getEnumerableKeys(actual)]
  const expectedKeys = getEnumerableKeys(expected)

  for (const key of expectedKeys) {
    if (!actualKeys.includes(key)) return false

    const actualValue = actual[key]
    const expectedValue = expected[key]

    if (getType(actualValue).isString() && getType(expectedValue).isRegExp()) {
      if (!expectedValue.test(actualValue)) return false
    } else {
      if (!deepStrictEqualValue(actualValue, expectedValue, memo)) return false
    }
  }

  return true
}

exports.throws = function throws(fn, error, message) {
  if (typeof error === 'string') {
    message = error
    error = undefined
  }

  const noException = Symbol()
  let actual = noException

  try {
    fn()
  } catch (err) {
    actual = err
  }

  if (actual === noException) {
    if (message === undefined) message = 'Executed'

    assertFail({ message, operator: 'throws' }, throws)
  }

  if (assertError(actual, error)) return

  assertFail({ message, actual, expected: error, operator: 'throws' }, throws)
}

exports.doesNotThrow = function doesNotThrow(fn, error, message) {
  if (typeof error === 'string') {
    message = error
    error = undefined
  }

  const noException = Symbol()
  let actual = noException

  try {
    fn()
  } catch (err) {
    actual = err
  }

  if (actual === noException) return

  if (!assertError(actual, error)) throw actual

  assertFail({ message, actual, expected: error, operator: 'doesNotThrow' }, doesNotThrow)
}

exports.rejects = async function rejects(fn, error, message) {
  if (typeof error === 'string') {
    message = error
    error = undefined
  }

  const noException = Symbol()
  let actual = noException

  // Normalize to Promise if async, and throw immediately if a synchronous error occurs
  if (getType(fn).isFunction()) fn = fn()

  try {
    await fn
  } catch (err) {
    actual = err
  }

  if (actual === noException) {
    if (message === undefined) message = 'Executed'

    assertFail({ message, operator: 'rejects' }, rejects)
  }

  if (assertError(actual, error)) return

  assertFail({ message, actual, expected: error, operator: 'rejects' }, rejects)
}

exports.doesNotReject = async function doesNotReject(fn, error, message) {
  if (typeof error === 'string') {
    message = error
    error = undefined
  }

  const noException = Symbol()
  let actual = noException

  // Normalize to Promise if async, and throw immediately if a synchronous error occurs
  if (getType(fn).isFunction()) fn = fn()

  try {
    await fn
  } catch (err) {
    actual = err
  }

  if (actual === noException) return

  if (!assertError(actual, error)) throw actual

  assertFail({ message, actual, expected: error, operator: 'doesNotReject' }, doesNotReject)
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

function deepStrictEqualValue(a, b, memo = new Memoization()) {
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

  // Anything that can be settled without descending into the values is settled
  // first. A pair that already differs in its own right is unequal whatever the
  // surrounding structures do.
  if (!deepStrictEqualShallow(a, b, type, prototype)) return false

  if (memo.has(a, b)) {
    return memo.compare(a, b)
  } else {
    memo.add(a, b)
  }

  let result

  if (type.isError()) result = deepStrictEqualError(a, b, memo)
  else if (type.isMap()) result = deepStrictEqualMap(a, b, memo)
  else if (type.isSet()) result = deepStrictEqualSet(a, b, memo)
  else result = deepStrictEqualObject(a, b, memo)

  memo.remove(a, b)

  return result
}

// Compares everything about a pair that can be decided on the spot, leaving
// only the values reachable from it for the caller to walk.
function deepStrictEqualShallow(a, b, type, prototype) {
  if (
    prototype === BigInt.prototype ||
    prototype === Boolean.prototype ||
    prototype === Number.prototype ||
    prototype === String.prototype ||
    prototype === Symbol.prototype
  ) {
    if (!Object.is(a.valueOf(), b.valueOf())) return false
  } else if (type.isRegExp()) {
    if (a.lastIndex !== b.lastIndex || a.flags !== b.flags || a.source !== b.source) return false
  } else if (type.isTypedArray()) {
    if (!deepStrictEqualBuffer(a, b)) return false
  } else if (type.isDate()) {
    if (!Object.is(a.getTime(), b.getTime())) return false
  } else if (type.isArguments() || type.isArray()) {
    if (a.length !== b.length) return false
  } else if (type.isMap() || type.isSet()) {
    if (a.size !== b.size) return false
  }

  return getEnumerableKeys(a).length === getEnumerableKeys(b).length
}

function deepStrictEqualBuffer(a, b) {
  return a.byteLength === b.byteLength && Buffer.compare(a, b) === 0
}

function deepStrictEqualError(a, b, memo) {
  return (
    deepStrictEqualValue(a.name, b.name, memo) &&
    deepStrictEqualValue(a.message, b.message, memo) &&
    deepStrictEqualObjectKeys(a, b, ['cause', 'errors'], memo) &&
    deepStrictEqualObject(a, b, memo)
  )
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
  if (!deepStrictEqualObject(a, b, memo)) return false

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
  if (!deepStrictEqualObject(a, b, memo)) return false

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

// The key counts have already been compared, so only the values are left.
function deepStrictEqualObject(a, b, memo) {
  for (const key of getEnumerableKeys(a)) {
    if (!(key in b) || !deepStrictEqualValue(a[key], b[key], memo)) return false
  }

  return true
}

function getEnumerableKeys(obj) {
  const keys = Object.keys(obj)

  for (const symbolKey of Object.getOwnPropertySymbols(obj)) {
    const { enumerable } = Object.getOwnPropertyDescriptor(obj, symbolKey)
    if (enumerable) keys.push(symbolKey)
  }

  return keys
}
