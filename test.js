const test = require('brittle')
const assert = require('.')

test('basic', (t) => {
  t.execution(() => assert(true))
  t.exception(() => assert(false, 'should fail'), /should fail/)
})

test('fail', (t) => {
  t.exception(() => assert.fail('should fail'), /should fail/)
})

test('ok', (t) => {
  t.execution(() => assert.ok(true))
  t.exception(() => assert.ok(false, 'should fail'), /should fail/)
})

test('notOk', (t) => {
  t.execution(() => assert.notOk(false))
  t.exception(() => assert.notOk(true, 'should fail'), /should fail/)
})

test('equal', (t) => {
  t.execution(() => assert.equal(1, '1'))
  t.execution(() => assert.equal(NaN, NaN))
  t.exception(() => assert.equal({}, {}, 'should fail'), /should fail/)
})

test('notEqual', (t) => {
  t.execution(() => assert.notEqual({}, {}))
  t.exception(() => assert.notEqual(1, '1', 'should fail'), /should fail/)
  t.exception(() => assert.notEqual(NaN, NaN, 'should fail'), /should fail/)
})

test('strictEqual', (t) => {
  t.execution(() => assert.strictEqual(1, 1))
  t.exception(() => assert.strictEqual(1, '1', 'should fail'), /should fail/)
})

test('notStrictEqual', (t) => {
  t.execution(() => assert.notStrictEqual(1, '1'))
  t.exception(() => assert.notStrictEqual(1, 1, 'should fail'), /should fail/)
})

test('match', (t) => {
  t.execution(() => assert.match('should pass', /pass/))
  t.exception(() => assert.match('should not pass', /fail/, 'should fail'), /should fail/)
  t.exception(() => assert.match(1, /fail/, 'should fail'), /should fail/)
})

test('doesNotMatch', (t) => {
  t.execution(() => assert.doesNotMatch('should not fail', /pass/))
  t.exception(() => assert.doesNotMatch('should fail', /fail/, 'should fail'), /should fail/)
  t.exception(() => assert.doesNotMatch(1, /fail/, 'should fail'), /should fail/)
})

test('ifError', (t) => {
  t.execution(() => assert.ifError(null))
  t.execution(() => assert.ifError(undefined))
  t.exception(() => assert.ifError('error'))
})

test('deepStrictEqual, basic', (t) => {
  t.execution(() => assert.deepStrictEqual(NaN, NaN))
  t.execution(() => assert.deepStrictEqual(1, 1))
  t.execution(() => assert.deepStrictEqual('foo', 'foo'))
  t.exception(() => assert.deepStrictEqual(1, new Date(), 'should fail'), /should fail/)
})

test('deepStrictEqual, array', (t) => {
  t.execution(() => assert.deepStrictEqual([1, 'foo'], [1, 'foo']))
  t.exception(() => assert.deepStrictEqual([1, 'foo'], [1], 'should fail'), /should fail/)
  t.exception(() => assert.deepStrictEqual([1, 'foo'], [1, 'bar'], 'should fail'), /should fail/)
})

test('deepStrictEqual, object', (t) => {
  t.execution(() => assert.deepStrictEqual({}, {}))
  t.execution(() => assert.deepStrictEqual({ a: { b: 1 } }, { a: { b: 1 } }))
  t.execution(() => assert.deepStrictEqual({ a: [1, 2] }, { a: [1, 2] }))
  t.exception(
    () => assert.deepStrictEqual({ a: { b: 1 } }, { a: { b: '1' } }, 'should fail'),
    /should fail/
  )
  t.exception(() => assert.deepStrictEqual({ a: [1, 2] }, { a: [1] }, 'should fail'), /should fail/)
})

test('deepStrictEqual, regexp', (t) => {
  t.execution(() => assert.deepStrictEqual(/abc/, /abc/))
  t.exception(() => assert.deepStrictEqual(/abc/, /abc/g, 'should fail'), /should fail/)
})

test('deepStrictEqual, map', (t) => {
  t.execution(() =>
    assert.deepStrictEqual(
      new Map([
        [{}, null],
        [true, 2],
        [undefined, {}]
      ]),
      new Map([
        [undefined, {}],
        [true, 2],
        [{}, null]
      ])
    )
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Map([
          [{}, null],
          [true, 2],
          [undefined, {}]
        ]),
        new Map([
          [{}, null],
          [true, 2],
          [null, {}] // different key
        ]),
        'should fail'
      ),
    /should fail/
  )
})

test('deepStrictEqual, set', (t) => {
  t.execution(() => assert.deepStrictEqual(new Set(['a', 1, 'b', 2]), new Set(['b', 2, 'a', 1])))
  t.execution(() =>
    assert.deepStrictEqual(new Set([{ a: 1 }, 1, {}, 2]), new Set([{}, 2, 1, { a: 1 }]))
  )
  t.exception(
    () =>
      assert.deepStrictEqual(new Set(['a', 1, 'b', 2]), new Set(['b', 2, 'a', 42]), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, weak map', (t) => {
  const map1 = new WeakMap([[Object, true]])
  const map2 = new WeakMap([[Object, true]])

  t.execution(() => assert.deepStrictEqual(map1, map1))
  t.exception(() => assert.deepStrictEqual(map1, map2, 'should fail'), /should fail/)
})

test('deepStrictEqual, weak set', (t) => {
  const obj = {}

  const set1 = new WeakSet([obj])
  const set2 = new WeakSet([obj])

  t.execution(() => assert.deepStrictEqual(set1, set1))
  t.exception(() => assert.deepStrictEqual(set1, set2, 'should fail'), /should fail/)
})

test('deepStrictEqual, symbols', (t) => {
  t.execution(() => assert.deepStrictEqual(Symbol.for('foo'), Symbol.for('foo')))
  t.exception(
    () => assert.deepStrictEqual(Symbol.for('foo'), Symbol.for('bar'), 'should fail'),
    /should fail/
  )

  const sym1 = Symbol()
  const sym2 = Symbol()

  t.execution(() => assert.deepStrictEqual({ [sym1]: 1 }, { [sym1]: 1 }))
  t.exception(
    () => assert.deepStrictEqual({ [sym1]: 1 }, { [sym2]: 1 }, 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, object wrappers', (t) => {
  t.execution(() => assert.deepStrictEqual(new String('foo'), Object('foo')))
  t.execution(() => assert.deepStrictEqual(new Number(1), new Number(1)))
  t.exception(
    () => assert.deepStrictEqual(new Number(1), new Number(2), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, functions', (t) => {
  t.execution(() => assert.deepStrictEqual(new Error('foo'), new Error('foo')))
  t.exception(
    () => assert.deepStrictEqual(new Error('foo'), new Error('bar'), 'should fail'),
    /should fail/
  )
})

test.skip('deepStrictEqual, recursive self-references', (t) => {
  const foo = {}
  foo.prop = foo

  const bar = {}
  bar.prop = bar

  t.execution(() => assert.deepStrictEqual(foo, bar))
})

test.skip('deepStrictEqual, recursive mutual references', (t) => {
  const foo = { prop: null }
  const bar = { prop: foo }
  foo.prop = bar

  t.execution(() => assert.deepStrictEqual(foo, bar))
})

test.skip('deepStrictEqual, recursive lists', (t) => {
  const foo = []
  const bar = [foo]
  foo[0] = bar

  t.execution(() => assert.deepStrictEqual(foo, bar))
})
