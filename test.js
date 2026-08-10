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

test('deepStrictEqual, negative zero', (t) => {
  t.exception(() => assert.deepStrictEqual(-0, 0, 'should fail'), /should fail/)
  t.exception(() => assert.deepStrictEqual([-0], [0], 'should fail'), /should fail/)

  t.execution(() => assert.deepStrictEqual(new Set([-0]), new Set([0])))
  t.execution(() => assert.deepStrictEqual(new Map([[-0, 1]]), new Map([[0, 1]])))
})

test('deepStrictEqual, array', (t) => {
  t.execution(() => assert.deepStrictEqual([1, 'foo'], [1, 'foo']))
  t.execution(() => assert.deepStrictEqual([1, , , 3], [1, , , 3]))
  t.exception(() => assert.deepStrictEqual([1, 'foo'], [1], 'should fail'), /should fail/)
  t.exception(() => assert.deepStrictEqual([1, 'foo'], [1, 'bar'], 'should fail'), /should fail/)
  t.exception(() => assert.deepStrictEqual([1, , , 3], [1, , , 3, ,], 'should fail'), /should fail/)
})

test('deepStrictEqual, array, hole vs explicit undefined', (t) => {
  t.exception(
    () => assert.deepStrictEqual([1, , 3], [1, undefined, 3], 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, array, additional property', (t) => {
  const a = [1, 2]
  const b = [1, 2]

  a.foo = 'x'
  b.foo = 'y'

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)

  const c = [1, 2]
  c.foo = 'x'

  t.exception(() => assert.deepStrictEqual(c, [1, 2], 'should fail'), /should fail/)
})

test('deepStrictEqual, arguments vs array', (t) => {
  function make() {
    return arguments
  }

  t.exception(() => assert.deepStrictEqual(make(1, 2, 3), [1, 2, 3], 'should fail'), /should fail/)
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

test('deepStrictEqual, object, key order', (t) => {
  t.execution(() => assert.deepStrictEqual({ a: 1, b: 2 }, { b: 2, a: 1 }))
})

test('deepStrictEqual, object, non-enumerable property', (t) => {
  const a = {}
  const b = {}

  Object.defineProperty(a, 'x', { value: 1, enumerable: false })
  Object.defineProperty(b, 'x', { value: 2, enumerable: false })

  t.execution(() => assert.deepStrictEqual(a, b))
})

test('deepStrictEqual, object, non-enumerable symbol', (t) => {
  const symbol = Symbol('symbol')

  const a = {}
  const b = {}

  Object.defineProperty(a, symbol, { value: 1, enumerable: false })
  Object.defineProperty(b, symbol, { value: 2, enumerable: false })

  t.execution(() => assert.deepStrictEqual(a, b))
})

test('deepStrictEqual, class', (t) => {
  class MyClass {
    constructor(value) {
      this.value = value
    }
  }

  t.execution(() => assert.deepStrictEqual(new MyClass('foo'), new MyClass('foo')))
  t.exception(
    () => assert.deepStrictEqual(new MyClass('foo'), new MyClass('bar'), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, object, getter', (t) => {
  const obj = {
    get foo() {
      return 'bar'
    }
  }

  t.execution(() => assert.deepStrictEqual(obj, { foo: 'bar' }))
  t.exception(() => assert.deepStrictEqual(obj, { foo: 'baz' }, 'should fail'), /should fail/)
})

test('deepStrictEqual, object, prototype', (t) => {
  const prototype = { __proto__: null }
  const a = { constructor: 42, foo: 'bar' }
  const b = { constructor: 42, foo: 'bar' }

  Object.setPrototypeOf(a, prototype)
  Object.setPrototypeOf(b, prototype)

  t.execution(() => assert.deepStrictEqual(a, b))

  Object.setPrototypeOf(b, { __proto__: null })

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
})

test('deepStrictEqual, null prototype', (t) => {
  t.exception(() => assert.deepStrictEqual({}, Object.create(null), 'should fail'), /should fail/)
})

test('deepStrictEqual, regexp', (t) => {
  t.execution(() => assert.deepStrictEqual(/abc/, /abc/))
  t.exception(() => assert.deepStrictEqual(/abc/, /abc/g, 'should fail'), /should fail/)
})

test('deepStrictEqual, regexp, additional property', (t) => {
  const a = /x/
  const b = /x/

  a.foo = 1
  b.foo = 2

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
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

test('deepStrictEqual, symbol', (t) => {
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

test('deepStrictEqual, boxed value', (t) => {
  const boxedSymbol = Object(Symbol())

  t.execution(() => assert.deepStrictEqual(new Number(1), new Number(1)))
  t.exception(
    () => assert.deepStrictEqual(new Number(1), new Number(2), 'should fail'),
    /should fail/
  )

  t.execution(() => assert.deepStrictEqual(new String('foo'), Object('foo')))
  t.exception(
    () => assert.deepStrictEqual(new Boolean(true), Object(false), 'should fail'),
    /should fail/
  )

  t.execution(() => assert.deepStrictEqual(Object(1n), Object(1n)))
  t.exception(() => assert.deepStrictEqual(Object(1n), Object(2n), 'should fail'), /should fail/)

  t.execution(() => assert.deepStrictEqual(boxedSymbol, boxedSymbol))
  t.exception(
    () => assert.deepStrictEqual(boxedSymbol, Object(Symbol()), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, boxed value, additional property', (t) => {
  const a = new Number(1)
  const b = new Number(1)

  a.foo = 'x'
  b.foo = 'y'

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
})

test('deepStrictEqual, boxed value vs primitive', (t) => {
  t.exception(() => assert.deepStrictEqual(new Number(1), 1, 'should fail'), /should fail/)
})

test('deepStrictEqual, date', (t) => {
  t.execution(() => assert.deepStrictEqual(new Date(2000, 3, 14), new Date(2000, 3, 14)))
  t.exception(
    () => assert.deepStrictEqual(new Date(), new Date(2000, 3, 14), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, date, additional property', (t) => {
  const date1 = new Date('foo')
  const date2 = new Date('bar')

  date1.foo = true
  date2.foo = true

  t.execution(() => assert.deepStrictEqual(date1, date2))

  date2.foo = false

  t.exception(() => assert.deepStrictEqual(date1, date2, 'should fail'), /should fail/)
})

test('deepStrictEqual, date, invalid', (t) => {
  t.execution(() => assert.deepStrictEqual(new Date(NaN), new Date(NaN)))
})

test('deepStrictEqual, error', (t) => {
  t.execution(() => assert.deepStrictEqual(new Error('foo'), new Error('foo')))
  t.exception(
    () => assert.deepStrictEqual(new Error('foo'), new Error('bar'), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(new Error('foo'), new TypeError('foo'), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, error, cause property', (t) => {
  t.execution(() =>
    assert.deepStrictEqual(
      new Error('err', { cause: new Error('foo') }),
      new Error('err', { cause: new Error('foo') })
    )
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Error('err', { cause: new Error('foo') }),
        new Error('err', { cause: new Error('bar') }),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Error('err', { cause: new Error('foo') }),
        new Error('err'),
        'should fail'
      ),
    /should fail/
  )
})

test('deepStrictEqual, error, aggregate error', (t) => {
  t.execution(() =>
    assert.deepStrictEqual(
      new AggregateError([new Error('foo'), new Error('bar')]),
      new AggregateError([new Error('foo'), new Error('bar')])
    )
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new AggregateError([new Error('foo'), new Error('bar')]),
        new AggregateError([new Error('foo'), new Error('baz')]),
        'should fail'
      ),
    /should fail/
  )
})

test('deepStrictEqual, error, additional property', (t) => {
  const error1 = new Error('foo')
  const error2 = new Error('foo')

  error1.foo = true
  error2.foo = true

  t.execution(() => assert.deepStrictEqual(error1, error2))

  error2.foo = false

  t.exception(() => assert.deepStrictEqual(error1, error2, 'should fail'), /should fail/)
})

test('deepStrictEqual, error, custom toStringTag', (t) => {
  const error = new Error('foo')

  error[Symbol.toStringTag] = 'CustomTag'

  t.exception(() => assert.deepStrictEqual(error, new Error('foo'), 'should fail'), /should fail/)
})

test('deepStrictEqual, buffer', (t) => {
  t.execution(() => assert.deepStrictEqual(Buffer.from('foo'), Buffer.from('foo')))
  t.exception(
    () => assert.deepStrictEqual(Buffer.from('foo'), Buffer.from('bar'), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, arraybuffer', (t) => {
  t.execution(() => assert.deepStrictEqual(new ArrayBuffer(8), new ArrayBuffer(8)))
  t.exception(
    () => assert.deepStrictEqual(new ArrayBuffer(10), new ArrayBuffer(12), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, typed array', (t) => {
  t.execution(() => assert.deepStrictEqual(new Uint16Array([21, 31]), new Uint16Array([21, 31])))
  t.exception(
    () =>
      assert.deepStrictEqual(new Uint16Array([21, 31]), new Uint16Array([31, 21]), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, typed array, additional property', (t) => {
  const a = new Uint8Array([1])
  const b = new Uint8Array([1])

  a.foo = 1
  b.foo = 2

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
})

test('deepStrictEqual, typed array, differing type', (t) => {
  t.exception(
    () => assert.deepStrictEqual(new Uint8Array([1, 2]), new Int8Array([1, 2]), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(new Uint8Array([1, 2, 3]), Buffer.from([1, 2, 3]), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, dataview', (t) => {
  t.execution(() =>
    assert.deepStrictEqual(new DataView(new ArrayBuffer(10)), new DataView(new ArrayBuffer(10)))
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new DataView(new ArrayBuffer(10)),
        new DataView(new ArrayBuffer(12)),
        'should fail'
      ),
    /should fail/
  )
})

test('deepStrictEqual, promise', (t) => {
  const promise1 = Promise.resolve(1)
  const promise2 = Promise.resolve(1)

  t.execution(() => assert.deepStrictEqual(promise1, promise1))
  t.exception(() => assert.deepStrictEqual(promise1, promise2, 'should fail'), /should fail/)
})

test('deepStrictEqual, function', (t) => {
  const fn = () => {}

  t.execution(() => assert.deepStrictEqual(fn, fn))
  t.exception(
    () =>
      assert.deepStrictEqual(
        () => {},
        () => {},
        'should fail'
      ),
    /should fail/
  )
})

test('deepStrictEqual, proxy', (t) => {
  const proxy = new Proxy([1, 2], {})

  t.execution(() => assert.deepStrictEqual(proxy, [1, 2]))
  t.exception(() => assert.deepStrictEqual(proxy, [1, 1], 'should fail'), /should fail/)
})

test('deepStrictEqual, url', (t) => {
  t.execution(() => assert.deepStrictEqual(new URL('http://foo'), new URL('http://foo')))
  t.exception(
    () => assert.deepStrictEqual(new URL('http://foo'), new URL('http://bar'), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, url, additional property', (t) => {
  const url1 = new URL('http://foo')
  const url2 = new URL('http://foo')

  url1.foo = true
  url2.foo = true

  t.execution(() => assert.deepStrictEqual(url1, url2))

  url2.foo = false

  t.exception(() => assert.deepStrictEqual(url1, url2, 'should fail'), /should fail/)
})

test('deepStrictEqual, recursive object', (t) => {
  {
    const a = {}
    a.prop = a

    const b = {}
    b.prop = b

    assert.deepStrictEqual(a, b)
  }

  {
    const a = { prop: null }
    const b = { prop: a }
    a.prop = b

    t.execution(() => assert.deepStrictEqual(a, b))
  }

  {
    const a = {}
    a.prop = 'foo'

    const b = {}
    b.prop = b

    t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
  }

  {
    const a = {}
    a.prop = a

    const b = {}
    b.prop = {}
    b.prop.prop = b

    t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
  }

  {
    const a = {}
    a.prop = a

    const b = {}
    b.prop = b

    const c = {}
    c.prop = a

    t.exception(() => assert.deepStrictEqual(b, c, 'should fail'), /should fail/)
  }
})

test('deepStrictEqual, recursive array', (t) => {
  const a = []
  const b = [a]
  a[0] = b

  t.execution(() => assert.deepStrictEqual(a, b))
})

test('deepStrictEqual, recursive map', (t) => {
  {
    const a = new Map()
    a.set('prop', a)

    const b = new Map()
    b.set('prop', b)

    t.execution(() => assert.deepStrictEqual(a, b))
  }

  {
    const a = new Map()
    a.set(a, 'value')

    const b = new Map()
    b.set(b, 'value')

    t.execution(() => assert.deepStrictEqual(a, b))
  }
})

test('deepStrictEqual, recursive set', (t) => {
  const a = new Set()
  a.add(a)

  const b = new Set()
  b.add(b)

  t.execution(() => assert.deepStrictEqual(a, b))
})
