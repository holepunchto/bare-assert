const inspect = require('bare-inspect')
const getType = require('bare-type')
const Memoization = require('./lib/memoization')

const defaultDeepStrictOptions = { partial: false, memo: new Memoization() }

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

function assertError(actual, expected, opts = defaultDeepStrictOptions) {
  if (expected === undefined) return true

  const type = getType(expected)

  if (type.isRegExp()) {
    if (expected.test(actual)) return true
  } else if (type.isFunction()) {
    if (expected(actual) === true) return true
    if (expected.prototype !== undefined && actual instanceof expected) return true
  } else if (type.isError()) {
    if (deepStrictEqualError(actual, expected, type, opts)) return true
  } else if (type.isObject()) {
    if (assertErrorObject(actual, expected, opts)) return true
  }

  return false
}

function assertErrorObject(actual, expected, opts) {
  const actualKeys = ['name', 'message', ...getEnumerableKeys(actual)]
  const expectedKeys = getEnumerableKeys(expected)

  for (const key of expectedKeys) {
    if (!actualKeys.includes(key)) return false

    const actualValue = actual[key]
    const expectedValue = expected[key]

    if (typeof actualValue === 'string' && getType(expectedValue).isRegExp()) {
      if (!expectedValue.test(actualValue)) return false
    } else {
      if (!deepStrictEqualValue(actualValue, expectedValue, opts)) return false
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
  if (typeof fn === 'function') fn = fn()

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
  if (typeof fn === 'function') fn = fn()

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

exports.partialDeepStrictEqual = function partialDeepStrictEqual(actual, expected, message) {
  if (deepStrictEqualValue(actual, expected, { ...defaultDeepStrictOptions, partial: true })) return

  assertFail(
    { message, actual, expected, operator: 'partialDeepStrictEqual' },
    partialDeepStrictEqual
  )
}

function deepStrictEqualValue(actual, expected, opts = defaultDeepStrictOptions) {
  const { partial, memo } = opts

  const type = getType(actual)

  if (!type.isObject() || !getType(expected).isObject()) return Object.is(actual, expected)

  const prototype = Object.getPrototypeOf(actual)

  if (prototype !== Object.getPrototypeOf(expected)) return false

  if (type.isWeakMap() || type.isWeakSet() || type.isPromise()) return actual === expected

  // Anything that can be settled without descending into the values is settled
  // first. A pair that already differs in its own right is unequal whatever the
  // surrounding structures do.
  if (!deepStrictEqualShallow(actual, expected, type, prototype, opts)) return false

  if (Buffer.isBuffer(actual)) return deepStrictEqualBuffer(actual, expected, opts)

  if (type.isArrayBuffer() || type.isSharedArrayBuffer()) {
    return deepStrictEqualBuffer(new Uint8Array(actual), new Uint8Array(expected), opts)
  }

  if (type.isDataView()) {
    return deepStrictEqualBuffer(
      new Uint8Array(actual.buffer, actual.byteOffset, actual.byteLength),
      new Uint8Array(expected.buffer, expected.byteOffset, expected.byteLength),
      partial
    )
  }

  if (memo.has(actual, expected)) {
    return memo.compare(actual, expected)
  } else {
    memo.add(actual, expected)
  }

  if (partial === true && type.isArray()) {
    if (!partialDeepStrictEqualArray(actual, expected, opts)) {
      memo.remove(actual, expected)
      return false
    }
  }

  let result

  if (type.isError()) result = deepStrictEqualError(actual, expected, type, opts)
  else if (type.isMap()) result = deepStrictEqualMap(actual, expected, type, opts)
  else if (type.isSet()) result = deepStrictEqualSet(actual, expected, type, opts)
  else result = deepStrictEqualObject(actual, expected, type, opts)

  memo.remove(actual, expected)

  return result
}

// Compares everything about a pair that can be decided on the spot, leaving
// only the values reachable from it for the caller to walk.
function deepStrictEqualShallow(actual, expected, type, prototype, opts) {
  const { partial } = opts

  if (
    prototype === BigInt.prototype ||
    prototype === Boolean.prototype ||
    prototype === Number.prototype ||
    prototype === String.prototype ||
    prototype === Symbol.prototype
  ) {
    if (!Object.is(actual.valueOf(), expected.valueOf())) return false
  } else if (type.isRegExp()) {
    if (
      actual.lastIndex !== expected.lastIndex ||
      actual.flags !== expected.flags ||
      actual.source !== expected.source
    ) {
      return false
    }
  } else if (type.isTypedArray()) {
    if (!deepStrictEqualBuffer(actual, expected, opts)) return false
  } else if (type.isDate()) {
    if (!Object.is(actual.getTime(), expected.getTime())) return false
  }

  if (type.isArguments() || type.isArray()) {
    if (partial === true) {
      if (expected.length > actual.length) return false
    } else {
      if (actual.length !== expected.length) return false
    }
  } else if (type.isMap() || type.isSet()) {
    if (partial === true) {
      if (expected.size > actual.size) return false
    } else {
      if (actual.size !== expected.size) return false
    }
  } else if (type.isSharedArrayBuffer()) {
    if (partial === true) {
      if (expected.byteLength > actual.byteLength) return false
    } else {
      if (actual.byteLength !== expected.byteLength) return false
    }
  }

  if (partial === true) {
    return getEnumerableKeys(actual).length >= getEnumerableKeys(expected).length
  } else {
    return getEnumerableKeys(actual).length === getEnumerableKeys(expected).length
  }
}

function deepStrictEqualBuffer(actual, expected, opts) {
  if (opts.partial === true) return partialDeepStrictEqualBuffer(actual, expected)

  return actual.byteLength === expected.byteLength && Buffer.compare(actual, expected) === 0
}

function deepStrictEqualError(actual, expected, type, opts) {
  return (
    deepStrictEqualValue(actual.name, expected.name, opts) &&
    ((opts.partial === true && expected.message === '') ||
      deepStrictEqualValue(actual.message, expected.message, opts)) &&
    deepStrictEqualObjectKeys(actual, expected, ['cause', 'errors'], opts) &&
    deepStrictEqualObject(actual, expected, type, opts)
  )
}

function deepStrictEqualArrayUnordered(actual, expected, opts) {
  const { partial } = opts

  for (let i = 0; i < expected.length; i++) {
    let found = false
    const itemB = expected[i]

    for (let j = 0; j < actual.length; j++) {
      const itemA = actual[j]

      if (deepStrictEqualValue(itemA, itemB, { ...opts, partial: false })) {
        found = true

        actual.splice(j, 1)

        break
      }
    }

    if (partial === true && found === false) {
      for (let j = 0; j < actual.length; j++) {
        const itemA = actual[j]

        if (deepStrictEqualValue(itemA, itemB, opts)) {
          found = true

          actual.splice(j, 1)

          break
        }
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

function deepStrictEqualMap(actual, expected, type, opts) {
  if (!deepStrictEqualObject(actual, expected, type, opts)) return false

  // Match entries with primitive keys directly through `b` in linear time and
  // leave only the object-keyed entries for the quadratic fallback.
  const restB = []
  const restA = []

  for (const [key, value] of expected) {
    if (requiresDeepKeyMatch(key)) {
      restB.push({ key, value })
    } else if (!actual.has(key) || !deepStrictEqualValue(actual.get(key), value, opts)) {
      return false
    }
  }

  for (const [key, value] of actual) {
    if (requiresDeepKeyMatch(key)) restA.push({ key, value })
  }

  return deepStrictEqualArrayUnordered(restA, restB, opts)
}

function deepStrictEqualSet(actual, expected, type, opts) {
  if (!deepStrictEqualObject(actual, expected, type, opts)) return false

  // Match primitive members directly through `b` in linear time and leave only
  // the object members for the quadratic fallback.
  const restB = []
  const restA = []

  for (const value of expected) {
    if (requiresDeepKeyMatch(value)) restB.push(value)
    else if (!actual.has(value)) return false
  }

  for (const value of actual) {
    if (requiresDeepKeyMatch(value)) restA.push(value)
  }

  return deepStrictEqualArrayUnordered(restA, restB, opts)
}

function deepStrictEqualObjectKeys(actual, expected, keys, opts) {
  const { partial } = opts

  for (const key of keys) {
    const hasA = key in actual
    const hasB = key in expected

    if (partial === true && !hasB) continue
    if ((hasA ^ hasB) === 1) return false
    if (hasA && !deepStrictEqualValue(actual[key], expected[key], opts)) return false
  }

  return true
}

// The key counts have already been compared, so only the values are left.
function deepStrictEqualObject(actual, expected, type, opts) {
  const aKeys = getEnumerableKeys(actual)
  const bKeys = getEnumerableKeys(expected)

  const indexedPartial = opts.partial === true && (type.isArray() || type.isTypedArray())

  for (const key of bKeys) {
    // the number indexes of partial objects are tested at
    // partialDeepStrictEqualArray and partialDeepStrictEqualBuffer
    if (indexedPartial && typeof key === 'string' && /^\d+$/.test(key)) continue

    if (!aKeys.includes(key) || !deepStrictEqualValue(actual[key], expected[key], opts)) {
      return false
    }
  }

  return true
}

function partialDeepStrictEqualArray(actual, expected, opts) {
  let j = -1

  for (let i = 0; i < expected.length; i++) {
    let found = false

    if (!(i in expected)) continue // Ignore hole in array

    while (++j < actual.length) {
      if (!(j in actual)) continue // Ignore hole in array

      if (deepStrictEqualValue(actual[j], expected[i], opts)) {
        found = true

        break
      }
    }

    if (found === false) return false
  }

  return true
}

function partialDeepStrictEqualBuffer(actual, expected) {
  let j = -1

  for (let i = 0; i < expected.length; i++) {
    let found = false

    while (++j < actual.length) {
      if (Object.is(actual[j], expected[i])) {
        found = true

        break
      }
    }

    if (found === false) return false
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
