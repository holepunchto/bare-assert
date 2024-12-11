declare function assert(value: any, message?: string | Error): void

declare namespace assert {
  class AssertionError extends Error {
    constructor(opts?: {
      message?: string
      actual?: any
      expected?: any
      operator?: string
    })

    actual?: any
    expected?: any
    operator?: string
  }
}

export = assert
