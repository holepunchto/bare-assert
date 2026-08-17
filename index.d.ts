declare function assert(value: any, message?: string | Error): void

declare namespace assert {
  export class AssertionError extends Error {
    constructor(opts?: { message?: string; actual?: any; expected?: any; operator?: string })

    actual?: any
    expected?: any
    operator?: string
  }

  export function ok(value: any, message?: string | Error): void

  export function equal(actual: any, expected: any, message?: string | Error): void

  export function notEqual(actual: any, expected: any, message?: string | Error): void

  export function strictEqual(actual: any, expected: any, message?: string | Error): void

  export function notStrictEqual(actual: any, expected: any, message?: string | Error): void

  export function deepStrictEqual(actual: any, expected: any, message?: string | Error): void

  export function notDeepStrictEqual(actual: any, expected: any, message?: string | Error): void

  export function match(actual: string, expected: RegExp, message?: string | Error): void

  export function doesNotMatch(actual: string, expected: RegExp, message?: string | Error): void

  export function ifError(actual: any): void
}

export = assert
