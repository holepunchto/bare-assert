class AssertionError extends Error {
  constructor(opts = {}) {
    const { message = null, actual, expected, operator } = opts

    super(message)

    this.actual = actual
    this.expected = expected
    this.operator = operator
  }
}

module.exports = exports = function assert(value, message) {
  if (value) return

  if (message instanceof Error) throw message

  const err = new AssertionError({ message })

  if (Error.captureStackTrace) Error.captureStackTrace(err, assert)

  throw err
}

exports.AssertionError = AssertionError
