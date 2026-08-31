/**
 * Throw an `AssertionError` if `value` is falsy.
 * @param value - The value to assert is truthy.
 * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
 * directly instead of an `AssertionError`.
 * @throws {AssertionError} thrown if `value` is falsy (unless `message` is an `Error` instance,
 * which is thrown instead).
 */
declare function assert(value: any, message?: string | Error): void

declare namespace assert {
  /**
   * Error thrown when an assertion fails, carrying the `actual`, `expected`, and `operator`
   * involved.
   */
  export class AssertionError extends Error {
    constructor(opts?: { message?: string; actual?: any; expected?: any; operator?: string })

    /** The actual value that failed the assertion. */
    actual?: any
    /** The expected value the assertion was checked against. */
    expected?: any
    /**
     * The comparison operator used by the assertion that failed, for example `'=='` or
     * `'strictEqual'`.
     */
    operator?: string
  }

  /**
   * Throw an `AssertionError` unconditionally.
   * @param message - Custom message for the thrown error, defaulting to `'Failed'`; if an `Error`
   * instance, it is thrown directly instead of an `AssertionError`.
   * @throws {AssertionError} always thrown (unless `message` is an `Error` instance, which is
   * thrown instead).
   */
  export function fail(message?: string | Error): never

  /**
   * Throw an `AssertionError` if `value` is falsy.
   * @param value - The value to assert is truthy.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if `value` is falsy (unless `message` is an `Error` instance,
   * which is thrown instead).
   */
  export function ok(value: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` if `value` is truthy.
   * @param value - The value to assert is falsy.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if `value` is truthy (unless `message` is an `Error` instance,
   * which is thrown instead).
   */
  export function notOk(value: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` and `expected` are loosely equal (`==`), with `NaN`
   * treated as equal to `NaN`.
   * @param actual - The value produced.
   * @param expected - The value to compare `actual` against.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if the values are not loosely equal (unless `message` is an
   * `Error` instance, which is thrown instead).
   */
  export function equal(actual: any, expected: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` and `expected` are loosely unequal (`!=`), with
   * `NaN` treated as equal to `NaN`.
   * @param actual - The value produced.
   * @param expected - The value to compare `actual` against.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if the values are loosely equal (unless `message` is an
   * `Error` instance, which is thrown instead).
   */
  export function notEqual(actual: any, expected: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` and `expected` are the same value according to
   * `Object.is()`, which treats `NaN` as equal to `NaN` and `0` as distinct from `-0`.
   * @param actual - The value produced.
   * @param expected - The value to compare `actual` against.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if the values are not the same value (unless `message` is an
   * `Error` instance, which is thrown instead).
   */
  export function strictEqual(actual: any, expected: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` and `expected` are different values according to
   * `Object.is()`, which treats `NaN` as equal to `NaN` and `0` as distinct from `-0`.
   * @param actual - The value produced.
   * @param expected - The value to compare `actual` against.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if the values are the same value (unless `message` is an
   * `Error` instance, which is thrown instead).
   */
  export function notStrictEqual(actual: any, expected: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` and `expected` are the same value recursively. Values
   * must share a prototype, and are then compared by their own enumerable properties, descending
   * into the values reachable from them. Boxed primitives, dates, regular expressions, errors,
   * buffers, typed arrays, maps, and sets are each compared by what they hold; weak maps, weak
   * sets, and promises are compared by reference. Cycles are handled.
   * @param actual - The value produced.
   * @param expected - The value to compare `actual` against.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if the values are not recursively equal (unless `message` is an
   * `Error` instance, which is thrown instead).
   */
  export function deepStrictEqual(actual: any, expected: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` and `expected` are different values recursively, as
   * determined by the same comparison `deepStrictEqual()` uses.
   * @param actual - The value produced.
   * @param expected - The value to compare `actual` against.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if the values are recursively equal (unless `message` is an
   * `Error` instance, which is thrown instead).
   */
  export function notDeepStrictEqual(actual: any, expected: any, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` is a string that matches the `expected` regular
   * expression.
   * @param actual - The string to test.
   * @param expected - The regular expression that `actual` must match.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if `actual` is not a string or does not match `expected`
   * (unless `message` is an `Error` instance, which is thrown instead).
   */
  export function match(actual: string, expected: RegExp, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `actual` is a string that does not match the `expected`
   * regular expression.
   * @param actual - The string to test.
   * @param expected - The regular expression that `actual` must not match.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if `actual` is not a string or matches `expected` (unless
   * `message` is an `Error` instance, which is thrown instead).
   */
  export function doesNotMatch(actual: string, expected: RegExp, message?: string | Error): void

  /**
   * Throw an `AssertionError` unless `fn` throws.
   * @param fn - The function to call.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`. Defaults to `'Executed'` when nothing was thrown.
   * @throws {AssertionError} thrown if `fn` does not throw (unless `message` is an `Error`
   * instance, which is thrown instead).
   */
  export function throws(fn: () => unknown, message?: string | Error): void
  /**
   * Throw an `AssertionError` unless `fn` throws an error matching `error`.
   * @param fn - The function to call.
   * @param error - What the thrown value must match: a predicate that returns `true`, a constructor
   * the value is an instance of, a regular expression that matches it, or an error or object whose
   * own enumerable properties it recursively matches.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`. Defaults to `'Executed'` when nothing was thrown.
   * @throws {AssertionError} thrown if `fn` does not throw, or throws something that does not match
   * `error` (unless `message` is an `Error` instance, which is thrown instead).
   */
  export function throws(
    fn: () => unknown,
    error: ((err: unknown) => boolean) | RegExp | Error | object,
    message?: string | Error
  ): void

  /**
   * Throw an `AssertionError` if `fn` throws.
   * @param fn - The function to call.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if `fn` throws (unless `message` is an `Error` instance, which
   * is thrown instead).
   */
  export function doesNotThrow(fn: () => unknown, message?: string | Error): void
  /**
   * Throw an `AssertionError` if `fn` throws an error matching `error`. A thrown value that does
   * not match `error` is re-thrown as it is.
   * @param fn - The function to call.
   * @param error - What the thrown value is checked against: a predicate that returns `true`, a
   * constructor the value is an instance of, a regular expression that matches it, or an error or
   * object whose own enumerable properties it recursively matches.
   * @param message - Custom message for the thrown error; if an `Error` instance, it is thrown
   * directly instead of an `AssertionError`.
   * @throws {AssertionError} thrown if `fn` throws something matching `error` (unless `message` is
   * an `Error` instance, which is thrown instead). Anything thrown that does not match `error` is
   * re-thrown unchanged.
   */
  export function doesNotThrow(
    fn: () => unknown,
    error: ((err: unknown) => boolean) | RegExp | Error | object,
    message?: string | Error
  ): void

  /**
   * Reject with an `AssertionError` unless `fn` rejects. The returned promise settles once the
   * assertion has been made, so it must be awaited.
   * @param fn - The promise to await, or a function returning one; a function that throws
   * synchronously propagates rather than counting as a rejection.
   * @param message - Custom message for the error; if an `Error` instance, it is used directly
   * instead of an `AssertionError`. Defaults to `'Executed'` when nothing was rejected.
   * @returns A promise that resolves once the assertion has passed, and rejects with an
   * `AssertionError` if `fn` does not reject (or with `message` if it is an `Error` instance).
   */
  export function rejects(
    fn: (() => Promise<unknown>) | Promise<unknown>,
    message?: string | Error
  ): Promise<void>
  /**
   * Reject with an `AssertionError` unless `fn` rejects with a reason matching `error`. The
   * returned promise settles once the assertion has been made, so it must be awaited.
   * @param fn - The promise to await, or a function returning one; a function that throws
   * synchronously propagates rather than counting as a rejection.
   * @param error - What the rejection reason must match: a predicate that returns `true`, a
   * constructor the reason is an instance of, a regular expression that matches it, or an error or
   * object whose own enumerable properties it recursively matches.
   * @param message - Custom message for the error; if an `Error` instance, it is used directly
   * instead of an `AssertionError`. Defaults to `'Executed'` when nothing was rejected.
   * @returns A promise that resolves once the assertion has passed, and rejects with an
   * `AssertionError` if `fn` does not reject, or rejects with a reason that does not match `error`
   * (or with `message` if it is an `Error` instance).
   */
  export function rejects(
    fn: (() => Promise<unknown>) | Promise<unknown>,
    error: ((err: unknown) => boolean) | RegExp | Error | object,
    message?: string | Error
  ): Promise<void>

  /**
   * Reject with an `AssertionError` if `fn` rejects. The returned promise settles once the
   * assertion has been made, so it must be awaited.
   * @param fn - The promise to await, or a function returning one; a function that throws
   * synchronously propagates rather than counting as a rejection.
   * @param message - Custom message for the error; if an `Error` instance, it is used directly
   * instead of an `AssertionError`.
   * @returns A promise that resolves once the assertion has passed, and rejects with an
   * `AssertionError` if `fn` rejects (or with `message` if it is an `Error` instance).
   */
  export function doesNotReject(
    fn: (() => Promise<unknown>) | Promise<unknown>,
    message?: string | Error
  ): Promise<void>
  /**
   * Reject with an `AssertionError` if `fn` rejects with a reason matching `error`. A reason that
   * does not match `error` is passed on as it is. The returned promise settles once the assertion
   * has been made, so it must be awaited.
   * @param fn - The promise to await, or a function returning one; a function that throws
   * synchronously propagates rather than counting as a rejection.
   * @param error - What the rejection reason is checked against: a predicate that returns `true`, a
   * constructor the reason is an instance of, a regular expression that matches it, or an error or
   * object whose own enumerable properties it recursively matches.
   * @param message - Custom message for the error; if an `Error` instance, it is used directly
   * instead of an `AssertionError`.
   * @returns A promise that resolves once the assertion has passed, and rejects with an
   * `AssertionError` if `fn` rejects with a reason matching `error` (or with `message` if it is an
   * `Error` instance). A reason that does not match `error` is passed on unchanged.
   */
  export function doesNotReject(
    fn: (() => Promise<unknown>) | Promise<unknown>,
    error: ((err: unknown) => boolean) | RegExp | Error | object,
    message?: string | Error
  ): Promise<void>

  /**
   * Throw an `AssertionError` unless `actual` is `null` or `undefined`.
   * @param actual - The value to assert is `null` or `undefined`.
   * @throws {AssertionError} thrown if `actual` is neither `null` nor `undefined`, with the
   * message `ifError got <actual>`.
   */
  export function ifError(actual: any): void
}

export = assert
