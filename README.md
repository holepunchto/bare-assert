# bare-assert

Assertion library for JavaScript.

```
npm i bare-assert
```

## Usage

```js
const assert = require('bare-assert')

assert(1 + 1 === 2, 'sum should be correct')

assert.equal(1, 1)
assert.notEqual(1, 2)
```

## API

#### `assert(value[, message])`

Throws an `AssertionError` unless `value` is truthy. If `message` is an `Error` instance, it is thrown directly instead of being wrapped in an `AssertionError`.

#### `assert.AssertionError`

An `Error` subclass thrown by all assertions on failure. Instances have the following properties:

#### `error.actual`

The `actual` value passed to the assertion, if any.

#### `error.expected`

The `expected` value passed to the assertion, if any.

#### `error.operator`

The name of the operator used by the assertion that failed, such as `'=='` or `'strictEqual'`.

If no `message` is provided to `AssertionError`, one is generated from `actual`, `expected`, and `operator`.

#### `assert.fail([message])`

Throws an `AssertionError` unconditionally. Defaults `message` to `'Failed'` if not provided.

#### `assert.ok(value[, message])`

Throws an `AssertionError` unless `value` is truthy. Equivalent to `assert()`.

#### `assert.notOk(value[, message])`

Throws an `AssertionError` if `value` is truthy.

#### `assert.equal(actual, expected[, message])`

Throws an `AssertionError` unless `actual == expected`, using the `==` operator. `NaN` is treated as equal to `NaN`.

#### `assert.notEqual(actual, expected[, message])`

Throws an `AssertionError` unless `actual != expected`, using the `!=` operator. `NaN` is treated as equal to `NaN`.

#### `assert.strictEqual(actual, expected[, message])`

Throws an `AssertionError` unless `actual` and `expected` are the same value, as determined by `Object.is()`.

#### `assert.notStrictEqual(actual, expected[, message])`

Throws an `AssertionError` unless `actual` and `expected` are not the same value, as determined by `Object.is()`.

#### `assert.match(actual, regexp[, message])`

Throws an `AssertionError` unless `actual` is a string that matches `regexp`.

#### `assert.doesNotMatch(actual, regexp[, message])`

Throws an `AssertionError` unless `actual` is a string that does not match `regexp`.

#### `assert.ifError(actual)`

Throws an `AssertionError` unless `actual` is `undefined` or `null`.

## License

Apache-2.0
