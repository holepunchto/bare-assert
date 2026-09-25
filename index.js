const inspect = require('bare-inspect')
const type = require('bare-type')
const CycleDetection = require('./lib/cycle-detection')
const hopcroftKarp = require('./lib/hopcroft-karp')

const {
  ARGUMENTS,
  ARRAY,
  BIGINT_OBJECT,
  BOOLEAN_OBJECT,
  MAP,
  NUMBER_OBJECT,
  OBJECT,
  SET,
  SHAREDARRAYBUFFER,
  STRING_OBJECT,
  SYMBOL_OBJECT
} = type.constants

function defaultDeepStrictOptions() {
  return { partial: false, cycleDetection: new CycleDetection() }
}

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
    return 'ASSERTION'
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

function assertError(actual, expected, opts = defaultDeepStrictOptions()) {
  if (expected === undefined) return [true, undefined]

  const t = type(expected)

  if (t.isRegExp()) {
    if (expected.test(actual)) return [true, undefined]
  } else if (t.isFunction()) {
    if (expected.prototype !== undefined && actual instanceof expected) return [true, undefined]

    try {
      if (expected(actual) === true) return [true, null]
    } catch (err) {
      return [false, err.message]
    }
  } else if (t.isError() || expected instanceof Error) {
    if (deepStrictEqualError(actual, expected, opts)) return [true, undefined]
  } else if (t.isObject()) {
    if (assertErrorObject(actual, expected, opts)) return [true, undefined]
  }

  return [false, undefined]
}

function assertErrorObject(actual, expected, opts) {
  const actualKeys = ['name', 'message', ...getEnumerableKeys(actual)]
  const expectedKeys = getEnumerableKeys(expected)

  for (const key of expectedKeys) {
    if (!actualKeys.includes(key)) return false

    const actualValue = actual[key]
    const expectedValue = expected[key]

    if (typeof actualValue === 'string' && type(expectedValue).isRegExp()) {
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

  const [result, errorMessage] = assertError(actual, error)

  if (result === true) return

  if (errorMessage && message === undefined) message = errorMessage

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

  const [result, errorMessage] = assertError(actual, error)

  if (result === false && message === undefined) {
    if (errorMessage) message = errorMessage
    else throw actual
  }

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

  const [result, errorMessage] = assertError(actual, error)

  if (result === true) return

  if (errorMessage && message === undefined) message = errorMessage

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

  const [result, errorMessage] = assertError(actual, error)

  if (result === false) {
    if (errorMessage && message === undefined) message = errorMessage
    else throw actual
  }

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
  if (deepStrictEqualValue(actual, expected, { ...defaultDeepStrictOptions(), partial: true })) {
    return
  }

  assertFail(
    { message, actual, expected, operator: 'partialDeepStrictEqual' },
    partialDeepStrictEqual
  )
}

function deepStrictEqualValue(actual, expected, opts = defaultDeepStrictOptions()) {
  const { partial, cycleDetection } = opts

  const actualType = type(actual)
  const expectedType = type(expected)

  if (!actualType.isObject() || !expectedType.isObject()) return Object.is(actual, expected)
  else if (actual === expected) return true

  // Anything that can be settled without descending into the values is settled
  // first. A pair that already differs in its own right is unequal whatever the
  // surrounding structures do.
  if (!deepStrictEqualShallow(actual, expected, actualType, expectedType, opts)) return false

  if (actualType.isWeakMap() || actualType.isWeakSet() || actualType.isPromise()) {
    return actual === expected
  }

  if (Buffer.isBuffer(actual)) return deepStrictEqualBuffer(actual, expected, opts)

  if (actualType.isArrayBuffer() || actualType.isSharedArrayBuffer()) {
    return deepStrictEqualBuffer(new Uint8Array(actual), new Uint8Array(expected), opts)
  }

  if (actualType.isDataView()) {
    return deepStrictEqualBuffer(
      new Uint8Array(actual.buffer, actual.byteOffset, actual.byteLength),
      new Uint8Array(expected.buffer, expected.byteOffset, expected.byteLength),
      opts
    )
  }

  if (actualType.isTypedArray()) {
    const ignoreList = []

    return (
      partialDeepStrictEqualArray(
        new Uint8Array(actual.buffer, actual.byteOffset, actual.byteLength),
        new Uint8Array(expected.buffer, expected.byteOffset, expected.byteLength),
        opts,
        ignoreList
      ) && deepStrictEqualObject(actual, expected, opts, ignoreList)
    )
  }

  if (cycleDetection.has(actual, expected)) {
    return cycleDetection.compare(actual, expected)
  } else {
    cycleDetection.add(actual, expected)
  }

  let result

  if (partial === true && actualType.isArray()) {
    const ignoreList = []

    result =
      partialDeepStrictEqualArray(actual, expected, opts, ignoreList) &&
      deepStrictEqualObject(actual, expected, opts, ignoreList)
  } else if (actualType.isError()) result = deepStrictEqualError(actual, expected, opts)
  else if (actualType.isMap()) result = deepStrictEqualMap(actual, expected, opts)
  else if (actualType.isSet()) result = deepStrictEqualSet(actual, expected, opts)
  else result = deepStrictEqualObject(actual, expected, opts)

  cycleDetection.remove(actual, expected)

  return result
}

// Compares everything about a pair that can be decided on the spot, leaving
// only the values reachable from it for the caller to walk.
function deepStrictEqualShallow(actual, expected, actualType, expectedType, opts) {
  const { partial } = opts

  if (partial === true) {
    if (Symbol.toStringTag in actual || Symbol.toStringTag in expected) {
      if (actual[Symbol.toStringTag] !== expected[Symbol.toStringTag]) return false
    }

    if (actualType.isArguments() !== expectedType.isArguments()) return false
    if (actualType.isArray() !== expectedType.isArray()) return false
    if (actualType.isDate() !== expectedType.isDate()) return false
    if (actualType.isError() !== expectedType.isError()) return false
    if (actualType.isMap() !== expectedType.isMap()) return false
    if (actualType.isRegExp() !== expectedType.isRegExp()) return false
    if (actualType.isSet() !== expectedType.isSet()) return false
  } else {
    if (Object.getPrototypeOf(actual) !== Object.getPrototypeOf(expected)) return false
  }

  if (isBoxedValue(actual) !== isBoxedValue(expected)) return false

  if (isBoxedValue(expected)) {
    if (!Object.is(parseBoxedValue(actual), parseBoxedValue(expected))) return false
  }

  if (actualType.isProxy() || expectedType.isProxy()) {
    if (
      (actualType.isProxy() || isPlainObject(actual)) !==
      (expectedType.isProxy() || isPlainObject(expected))
    ) {
      return false
    }
  }

  if (expectedType.isTypedArray()) {
    if (type.of(actual) !== type.of(expected)) return false
  }

  if (expectedType.isRegExp()) {
    if (
      actual.lastIndex !== expected.lastIndex ||
      actual.flags !== expected.flags ||
      actual.source !== expected.source
    ) {
      return false
    }
  } else if (expectedType.isDate()) {
    if (!Object.is(actual.getTime(), expected.getTime())) return false
  }

  if (partial === true) return partialDeepStrictEqualLength(actual, expected)
  else return deepStrictEqualLength(actual, expected)
}

function deepStrictEqualLength(actual, expected) {
  switch (type.of(expected)) {
    case ARGUMENTS:
    case ARRAY:
      if (actual.length !== expected.length) return false
      break
    case MAP:
    case SET:
      if (actual.size !== expected.size) return false
      break
    case SHAREDARRAYBUFFER:
      if (actual.byteLength !== expected.byteLength) return false
      break
  }

  return getEnumerableKeys(actual).length === getEnumerableKeys(expected).length
}

function partialDeepStrictEqualLength(actual, expected) {
  switch (type.of(expected)) {
    case ARGUMENTS:
    case ARRAY:
      if (expected.length > actual.length) return false
      break
    case MAP:
    case SET:
      if (expected.size > actual.size) return false
      break
    case SHAREDARRAYBUFFER:
      if (expected.byteLength > actual.byteLength) return false
      break
  }

  return getEnumerableKeys(actual).length >= getEnumerableKeys(expected).length
}

function deepStrictEqualBuffer(actual, expected, opts) {
  if (opts.partial === true) return partialDeepStrictEqualBuffer(actual, expected)

  return actual.byteLength === expected.byteLength && Buffer.compare(actual, expected) === 0
}

function deepStrictEqualError(actual, expected, opts) {
  const { partial } = opts

  if (partial === true) {
    if (!('cause' in actual) && 'cause' in expected) return false
  } else {
    if ('cause' in actual !== 'cause' in expected) return false
  }

  const keys = ['name', 'message', 'cause', 'errors']

  for (const key of keys) {
    if (partial === true) {
      if (key === 'message' && expected[key] === '') continue
      if (!(key in expected) || expected[key] === undefined) continue
    }

    if (!deepStrictEqualValue(actual[key], expected[key], opts)) return false
  }

  return deepStrictEqualObject(actual, expected, opts, keys)
}

function deepStrictEqualArrayUnordered(actual, expected, opts) {
  for (let i = 0; i < expected.length; i++) {
    let found = false
    const itemExpected = expected[i]

    for (let j = 0; j < actual.length; j++) {
      const itemActual = actual[j]

      if (deepStrictEqualValue(itemActual, itemExpected, opts)) {
        found = true

        actual.splice(j, 1)

        break
      }
    }

    if (found === false) return false
  }

  return true
}

function partialDeepStrictEqualArrayUnordered(actual, expected, opts) {
  if (expected.length === 0) return true

  const graph = new Array(expected.length)

  for (let i = 0; i < expected.length; i++) {
    let found = false
    graph[i] = []

    const itemExpected = expected[i]

    for (let j = 0; j < actual.length; j++) {
      const itemActual = actual[j]

      if (deepStrictEqualValue(itemActual, itemExpected, opts)) {
        found = true

        graph[i].push(j)
      }
    }

    if (found === false) return false
  }

  return hopcroftKarp(graph)
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

function deepStrictEqualMap(actual, expected, opts) {
  if (!deepStrictEqualObject(actual, expected, opts)) return false

  // Match entries with primitive keys directly through `b` in linear time and
  // leave only the object-keyed entries for the quadratic fallback.
  const restActual = []
  const restExpected = []

  for (const [key, value] of expected) {
    if (requiresDeepKeyMatch(key)) {
      restExpected.push({ key, value })
    } else if (!actual.has(key) || !deepStrictEqualValue(actual.get(key), value, opts)) {
      return false
    }
  }

  for (const [key, value] of actual) {
    if (requiresDeepKeyMatch(key)) restActual.push({ key, value })
  }

  if (opts.partial === true) {
    return partialDeepStrictEqualArrayUnordered(restActual, restExpected, opts)
  } else {
    return deepStrictEqualArrayUnordered(restActual, restExpected, opts)
  }
}

function deepStrictEqualSet(actual, expected, opts) {
  if (!deepStrictEqualObject(actual, expected, opts)) return false

  // Match primitive members directly through `b` in linear time and leave only
  // the object members for the quadratic fallback.
  const restActual = []
  const restExpected = []

  for (const value of expected) {
    if (requiresDeepKeyMatch(value)) restExpected.push(value)
    else if (!actual.has(value)) return false
  }

  for (const value of actual) {
    if (requiresDeepKeyMatch(value)) restActual.push(value)
  }

  if (opts.partial === true) {
    return partialDeepStrictEqualArrayUnordered(restActual, restExpected, opts)
  } else {
    return deepStrictEqualArrayUnordered(restActual, restExpected, opts)
  }
}

// The key counts have already been compared, so only the values are left.
function deepStrictEqualObject(actual, expected, opts, ignoreList = []) {
  const actualKeys = getEnumerableKeys(actual)
  const expectedKeys = getEnumerableKeys(expected)

  const hasIgnoreList = ignoreList.length > 0

  for (const key of expectedKeys) {
    // Skip already compared keys
    if (hasIgnoreList && ignoreList.includes(key)) continue

    if (!actualKeys.includes(key)) return false
    if (!deepStrictEqualValue(actual[key], expected[key], opts)) return false
  }

  return true
}

function partialDeepStrictEqualArray(actual, expected, opts, ignoreList = []) {
  const actualKeys = Object.keys(actual).filter((key) => isArrayIndex(key))
  const expectedKeys = Object.keys(expected).filter((key) => isArrayIndex(key))

  let j = -1

  for (const expectedKey of expectedKeys) {
    const expectedItem = expected[expectedKey]

    let found = false

    while (++j < actualKeys.length) {
      const actualKey = actualKeys[j]
      const actualItem = actual[actualKey]

      if (deepStrictEqualValue(actualItem, expectedItem, opts)) {
        found = true

        break
      }
    }

    if (found === false) return false
  }

  ignoreList.push(...expectedKeys)

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

function isBoxedValue(value) {
  switch (type.of(value)) {
    case BIGINT_OBJECT:
    case BOOLEAN_OBJECT:
    case NUMBER_OBJECT:
    case STRING_OBJECT:
    case SYMBOL_OBJECT:
      return true
    default:
      return false
  }
}

function parseBoxedValue(value) {
  switch (type.of(value)) {
    case BIGINT_OBJECT:
      return BigInt.prototype.valueOf.call(value)
    case BOOLEAN_OBJECT:
      return Boolean.prototype.valueOf.call(value)
    case NUMBER_OBJECT:
      return Number.prototype.valueOf.call(value)
    case STRING_OBJECT:
      return String.prototype.valueOf.call(value)
    default:
      return Symbol.prototype.valueOf.call(value)
  }
}

function getEnumerableKeys(obj) {
  const keys = Object.keys(obj)

  for (const symbolKey of Object.getOwnPropertySymbols(obj)) {
    const { enumerable } = Object.getOwnPropertyDescriptor(obj, symbolKey)
    if (enumerable) keys.push(symbolKey)
  }

  return keys
}

function isPlainObject(value) {
  return type.of(value) === OBJECT
}

function isArrayIndex(str) {
  if (!/^\d+$/.test(str)) return false
  if (str.startsWith('0') && str !== '0') return false
  if (Number(str) > 2 ** 32 - 2) return false

  return true
}
