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

test('throws, basic', (t) => {
  t.execution(() => {
    assert.throws(() => {
      throw new Error()
    })
  })

  t.exception(() => assert.throws(() => {}, 'should fail'), /should fail/)
})

test('throws, constructor', (t) => {
  t.execution(() => {
    assert.throws(() => {
      throw new Error('foo')
    }, Error)
  })

  t.exception(() => {
    assert.throws(
      () => {
        throw new Error('foo')
      },
      SyntaxError,
      /should fail/
    )
  }, /should fail/)
})

test('throws, regexp', (t) => {
  t.execution(() => {
    assert.throws(() => {
      throw new Error('foo')
    }, /^Error: foo$/)
  })

  t.exception(() => {
    assert.throws(
      () => {
        throw new Error('foo')
      },
      /^Error: bar$/,
      /should fail/
    )
  }, /should fail/)
})

test('throws, custom validation, function', (t) => {
  t.execution(() => {
    assert.throws(
      () => {
        throw new Error('foo')
      },
      (err) => /foo/.test(err)
    )
  })

  t.exception(() => {
    assert.throws(
      () => {
        throw new Error('foo')
      },
      (err) => /bar/.test(err),
      /should fail/
    )
  }, /should fail/)
})

test('throws, error instance', (t) => {
  t.execution(() => {
    assert.throws(() => {
      throw new Error('Foo')
    }, new Error('Foo'))
  })

  t.exception(() => {
    assert.throws(
      () => {
        throw new Error('Foo')
      },
      new Error('Bar'),
      /should fail/
    )
  }, /should fail/)
})

test('throws, custom validation, object', (t) => {
  const err = new TypeError('Wrong value')
  err.code = 404
  err.foo = 'bar'
  err.info = {
    nested: true,
    baz: 'text'
  }
  err.reg = /abc/i

  t.execution(() => {
    assert.throws(
      () => {
        throw err
      },
      {
        name: /^TypeError$/,
        message: /Wrong/,
        foo: 'bar',
        info: {
          nested: true,
          baz: 'text'
        },
        reg: /abc/i
      }
    )
  })

  t.exception(() => {
    assert.throws(
      () => {
        throw err
      },
      {
        name: /^TypeError$/,
        message: /Worng/,
        info: {
          nested: true,
          baz: 'text'
        }
      },
      /should fail/
    )
  }, /should fail/)
  t.exception(() => {
    assert.throws(
      () => {
        throw err
      },
      {
        name: /^TypeError$/,
        message: /Wrong/,
        info: {
          nested: false,
          baz: 'text'
        }
      },
      /should fail/
    )
  }, /should fail/)
})

test('doesNotThrow, basic', (t) => {
  t.execution(() => {
    assert.doesNotThrow(() => {})
  })

  t.exception(
    () =>
      assert.doesNotThrow(() => {
        throw (new Error('Foo'), 'should fail')
      }),
    /should fail/
  )
})

test('doesNotThrow, constructor', (t) => {
  t.exception(() => {
    assert.doesNotThrow(
      () => {
        throw new TypeError('Foo')
      },
      TypeError,
      'should fail'
    )
  }, /should fail/)

  t.exception(() => {
    assert.doesNotThrow(() => {
      throw new Error('Foo')
    }, TypeError)
  }, /Foo/)
})

test('rejects, basic', (t) => {
  t.plan(2)

  t.execution(() => {
    assert.rejects(async () => {
      throw new Error()
    })
  })

  t.exception(() => assert.rejects(async () => {}, 'should fail'), /should fail/)
})

test('rejects, promise', (t) => {
  t.plan(2)

  t.execution(() => {
    assert.rejects(Promise.reject(new Error('Foo')), /Foo/)
  })

  t.exception(
    () => assert.rejects(Promise.reject(new Error('Bar')), /Foo/, 'should fail'),
    /should fail/
  )
})

test('rejects, synchronous throw', (t) => {
  t.plan(1)

  const promise = assert.rejects(() => {
    throw new Error('Foo')
  })

  t.exception(async () => await promise, /Foo/)
})

test('rejects, object validation', async (t) => {
  t.plan(2)

  t.execution(() => {
    assert.rejects(
      async () => {
        throw new TypeError('Foo')
      },
      { name: 'TypeError', message: 'Foo' }
    )
  })

  t.exception(
    () =>
      assert.rejects(
        async () => {
          throw new TypeError('Foo')
        },
        { name: 'Error', message: 'Bar' },
        'should fail'
      ),
    /should fail/
  )
})

test('doesNotReject, basic', (t) => {
  t.plan(2)

  t.execution(() => {
    assert.doesNotReject(Promise.resolve('Foo'))
  })

  t.exception(() => assert.doesNotReject(Promise.reject('Foo'), 'should fail'), /should fail/)
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
  t.exception(
    () => assert.deepStrictEqual([1, , 3], [1, undefined, 3], 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual([1, , undefined, 3], [1, undefined, , 3], 'should fail'),
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

test('deepStrictEqual, array, symbol property', (t) => {
  const symbol = Symbol.for('symbol')

  const a = [1]
  const b = [1]

  a[symbol] = 1
  b[symbol] = 2

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
  t.exception(() => assert.deepStrictEqual(a, b), assert.AssertionError)
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

test('deepStrictEqual, map, additional property', (t) => {
  const map1 = new Map([['a', 1]])
  const map2 = new Map([['a', 1]])

  map1.foo = true
  map2.foo = true

  t.execution(() => assert.deepStrictEqual(map1, map2))

  map2.foo = false

  t.exception(() => assert.deepStrictEqual(map1, map2, 'should fail'), /should fail/)
  t.exception(() => assert.deepStrictEqual(map1, new Map([['a', 1]]), 'should fail'), /should fail/)
})

test('deepStrictEqual, map, object keys', (t) => {
  t.execution(() =>
    assert.deepStrictEqual(
      new Map([
        [{ x: 1 }, 'a'],
        [{ x: 2 }, 'b']
      ]),
      new Map([
        [{ x: 2 }, 'b'],
        [{ x: 1 }, 'a']
      ])
    )
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Map([
          [{ x: 1 }, 'a'],
          [{ x: 9 }, 'zzz']
        ]),
        new Map([
          [{ x: 2 }, 'b'],
          [{ x: 3 }, 'c']
        ]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Map([
          [{ x: 1 }, 'a'],
          [{ x: 2 }, 'b']
        ]),
        new Map([
          [{ x: 1 }, 'a'],
          [{ x: 2 }, 'c']
        ]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        {
          map: new Map([
            [{ k: 1 }, [1, 2]],
            [{ k: 2 }, [3, 4]]
          ])
        },
        {
          map: new Map([
            [{ k: 1 }, [9, 9]],
            [{ k: 2 }, [8, 8]]
          ])
        },
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

test('deepStrictEqual, set, additional property', (t) => {
  const set1 = new Set([1])
  const set2 = new Set([1])

  set1.foo = true
  set2.foo = true

  t.execution(() => assert.deepStrictEqual(set1, set2))

  set2.foo = false

  t.exception(() => assert.deepStrictEqual(set1, set2, 'should fail'), /should fail/)
  t.exception(() => assert.deepStrictEqual(set1, new Set([1]), 'should fail'), /should fail/)
})

test('deepStrictEqual, set, object members', (t) => {
  t.execution(() =>
    assert.deepStrictEqual(new Set([{ x: 1 }, { x: 2 }]), new Set([{ x: 2 }, { x: 1 }]))
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Set([{ x: 1 }, { x: 9 }]),
        new Set([{ x: 2 }, { x: 3 }]),
        'should fail'
      ),
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
  t.execution(() =>
    assert.deepStrictEqual(
      new Error('err', { cause: undefined }),
      new Error('err', { cause: undefined })
    )
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Error('err'),
        new Error('err', { cause: undefined }),
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

    t.execution(() => assert.deepStrictEqual(a, b))
  }

  {
    const a = { prop: null }
    const b = { prop: a }
    a.prop = b

    t.execution(() => assert.deepStrictEqual(a, b))
  }

  {
    const a = {}
    a.prop = {}
    a.prop.prop = a.prop

    const b = {}
    b.prop = {}
    b.prop.prop = a.prop

    t.execution(() => assert.deepStrictEqual(a, b))
  }

  {
    const a = {}
    a.prop = 'foo'

    const b = {}
    b.prop = b

    t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
  }
})

test('deepStrictEqual, recursive object, cycle shape', (t) => {
  // Builds a chain of `tail` objects leading into a cycle of `cycle` objects,
  // every node linked to the next through a single `prop` property. Every such
  // graph unfolds to the same infinite chain, so the shape of the cycle alone
  // does not decide equality; what matters is how many objects are reachable
  // from the root before one repeats.
  function cyclic(tail, cycle) {
    const nodes = []

    for (let i = 0; i < tail + cycle; i++) nodes.push({})
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].prop = nodes[i + 1]

    nodes[nodes.length - 1].prop = nodes[tail]

    return nodes[0]
  }

  t.execution(() => assert.deepStrictEqual(cyclic(0, 1), cyclic(0, 1)))
  t.execution(() => assert.deepStrictEqual(cyclic(2, 2), cyclic(2, 2)))

  t.execution(() => assert.deepStrictEqual(cyclic(0, 2), cyclic(1, 1)))
  t.execution(() => assert.deepStrictEqual(cyclic(1, 3), cyclic(3, 1)))

  t.execution(() => assert.deepStrictEqual(cyclic(0, 3), cyclic(1, 2)))
  t.execution(() => assert.deepStrictEqual(cyclic(1, 2), cyclic(2, 1)))
  t.execution(() => assert.deepStrictEqual(cyclic(0, 3), cyclic(2, 1)))

  t.exception(
    () => assert.deepStrictEqual(cyclic(0, 1), cyclic(0, 2), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(cyclic(0, 1), cyclic(1, 1), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(cyclic(0, 2), cyclic(1, 2), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(cyclic(1, 2), cyclic(2, 2), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(cyclic(0, 3), cyclic(1, 3), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, recursive object, cycle position', (t) => {
  // A self-edge under a different property, or at a different depth, describes a
  // different structure. None of these are equal to each other, so treating any
  // pair as equal would also make equality intransitive.
  const selfThenLeaf = () => {
    const a = {}
    a.foo = a
    a.bar = { value: 1 }
    return a
  }

  const onwardThenSelf = () => {
    const a = {}
    a.foo = { foo: { value: 1 } }
    a.bar = a
    return a
  }

  const selfThenChain = () => {
    const a = {}
    const b = {}
    a.foo = a
    a.bar = b
    b.foo = { value: 1 }
    return a
  }

  t.exception(
    () => assert.deepStrictEqual(selfThenLeaf(), onwardThenSelf(), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(onwardThenSelf(), selfThenChain(), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(selfThenLeaf(), selfThenChain(), 'should fail'),
    /should fail/
  )

  // The same shape with no cycle at all is different again.
  t.exception(
    () =>
      assert.deepStrictEqual(
        selfThenLeaf(),
        { foo: { value: 9, other: 9 }, bar: { value: 1 } },
        'should fail'
      ),
    /should fail/
  )

  t.execution(() => assert.deepStrictEqual(selfThenLeaf(), selfThenLeaf()))
  t.execution(() => assert.deepStrictEqual(onwardThenSelf(), onwardThenSelf()))
  t.execution(() => assert.deepStrictEqual(selfThenChain(), selfThenChain()))
})

test('deepStrictEqual, recursive object, sibling cycles', (t) => {
  // Cycles found while comparing one property must not affect the comparison of
  // the next. Here the first property holds a cycle on both sides, and the
  // second holds a cycle on one side only, which is a difference in its own
  // right regardless of what the first property established.
  {
    const a1 = {}
    a1.foo = a1

    const a2 = {}
    a2.foo = a2

    const b1 = {}
    b1.foo = b1

    const b2 = {}
    b2.foo = { value: 1 }

    t.exception(
      () =>
        assert.deepStrictEqual({ first: a1, second: a2 }, { first: b1, second: b2 }, 'should fail'),
      /should fail/
    )

    // The same difference on its own, and with the properties swapped.
    t.exception(
      () => assert.deepStrictEqual({ second: a2 }, { second: b2 }, 'should fail'),
      /should fail/
    )
    t.exception(
      () =>
        assert.deepStrictEqual({ first: a2, second: a1 }, { first: b2, second: b1 }, 'should fail'),
      /should fail/
    )
  }

  {
    const a1 = {}
    a1.foo = a1
    a1.bar = a1

    const a2 = {}
    a2.foo = a2
    a2.bar = { value: 1 }

    const b1 = {}
    b1.foo = b1
    b1.bar = b1

    const b2 = {}
    b2.foo = { value: 1, extra: 2 }
    b2.bar = { value: 1 }

    t.exception(
      () =>
        assert.deepStrictEqual({ first: a1, second: a2 }, { first: b1, second: b2 }, 'should fail'),
      /should fail/
    )
  }

  const build = () => {
    const first = {}
    first.foo = first

    const second = {}
    second.foo = second

    return { first, second }
  }

  t.execution(() => assert.deepStrictEqual(build(), build()))
})

test('deepStrictEqual, recursive object, nested up-reference', (t) => {
  // Both children point back at the root on one side, while on the other the
  // second child points at its sibling instead.
  const a = { foo: {}, bar: {} }
  a.foo.up = a
  a.bar.up = a

  const b = { foo: {}, bar: {} }
  b.foo.up = b
  b.bar.up = b.foo

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)

  const build = () => {
    const value = { foo: {}, bar: {} }
    value.foo.up = value
    value.bar.up = value
    return value
  }

  t.execution(() => assert.deepStrictEqual(build(), build()))
})

test('deepStrictEqual, recursive object, self vs sibling', (t) => {
  // The second property points back at the root on one side and at its sibling
  // on the other, which are different structures.
  const buildSelf = () => {
    const first = {}
    const second = {}
    first.foo = second
    first.bar = first
    second.foo = first
    second.bar = first
    return first
  }

  const buildSibling = () => {
    const first = {}
    const second = {}
    first.foo = second
    first.bar = second
    second.foo = first
    second.bar = first
    return first
  }

  // The answer must not depend on how deeply the comparison is nested.
  t.exception(
    () => assert.deepStrictEqual(buildSelf(), buildSibling(), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual({ value: buildSelf() }, { value: buildSibling() }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual([buildSelf()], [buildSibling()], 'should fail'),
    /should fail/
  )

  t.execution(() => assert.deepStrictEqual({ value: buildSelf() }, { value: buildSelf() }))
  t.execution(() => assert.deepStrictEqual({ value: buildSibling() }, { value: buildSibling() }))
})

test('deepStrictEqual, recursive object, differing node count', (t) => {
  // Three objects on one side against two on the other, describing the same
  // structure once the cycles are followed. How many objects a structure is
  // built from does not decide the answer.
  const buildThree = () => {
    const first = {}
    const second = {}
    const third = {}
    first.foo = third
    first.bar = second
    second.foo = first
    second.bar = second
    third.foo = first
    third.bar = first
    return first
  }

  const buildTwo = () => {
    const first = {}
    const second = {}
    first.foo = second
    first.bar = second
    second.foo = first
    second.bar = first
    return first
  }

  t.execution(() => assert.deepStrictEqual({ value: buildThree() }, { value: buildTwo() }))
  t.execution(() => assert.deepStrictEqual([buildThree()], [buildTwo()]))
  t.execution(() => assert.deepStrictEqual({ value: buildThree() }, { value: buildThree() }))

  const buildThreeWithLeaves = () => {
    const first = {}
    const second = {}
    const third = {}
    first.foo = third
    first.bar = second
    second.foo = { leaf: 1 }
    second.bar = first
    third.foo = { leaf: 1 }
    third.bar = third
    return first
  }

  const buildTwoWithLeaves = () => {
    const first = {}
    const second = {}
    first.foo = second
    first.bar = second
    second.foo = { leaf: 1 }
    second.bar = first
    return first
  }

  t.execution(() =>
    assert.deepStrictEqual({ value: buildThreeWithLeaves() }, { value: buildTwoWithLeaves() })
  )
})

test('deepStrictEqual, recursive object, repeated edges', (t) => {
  // The same object reached through more than one property is still a single
  // cycle, so revisiting it must not restart the traversal.
  t.execution(() => {
    const build = () => {
      const a = {}
      a.foo = a
      a.bar = a
      return a
    }

    return assert.deepStrictEqual(build(), build())
  })

  t.execution(() => {
    const build = () => {
      const a = {}
      a.foo = a
      a.bar = a
      a.baz = a
      return a
    }

    return assert.deepStrictEqual(build(), build())
  })

  t.execution(() => {
    const build = () => {
      const a = {}
      const b = {}

      a.foo = b
      a.bar = b
      b.foo = a
      b.bar = a

      return a
    }

    return assert.deepStrictEqual(build(), build())
  })

  const a = { value: 1 }
  a.foo = a
  a.bar = a

  const b = { value: 2 }
  b.foo = b
  b.bar = b

  t.exception(() => assert.deepStrictEqual(a, b, 'should fail'), /should fail/)
})

test('deepStrictEqual, shared reference', (t) => {
  // One object referenced from several properties is not a cycle: it must
  // compare equal to a structure that repeats the value instead of sharing it.
  const shared = { value: 1 }

  t.execution(() =>
    assert.deepStrictEqual({ foo: shared, bar: shared }, { foo: { value: 1 }, bar: { value: 1 } })
  )
  t.execution(() =>
    assert.deepStrictEqual(
      { foo: shared, bar: shared, baz: shared },
      { foo: { value: 1 }, bar: { value: 1 }, baz: { value: 1 } }
    )
  )
  t.execution(() => assert.deepStrictEqual([shared, shared], [{ value: 1 }, { value: 1 }]))
  t.execution(() =>
    assert.deepStrictEqual({ foo: shared, bar: shared }, { foo: shared, bar: shared })
  )

  t.exception(
    () =>
      assert.deepStrictEqual(
        { foo: shared, bar: shared },
        { foo: { value: 1 }, bar: { value: 2 } },
        'should fail'
      ),
    /should fail/
  )
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

test('notDeepStrictEqual', (t) => {
  t.execution(() => assert.notDeepStrictEqual({ foo: 1 }, { foo: 2 }))
  t.execution(() => assert.notDeepStrictEqual([1, 2], [1, 2, 3]))
  t.exception(() => assert.notDeepStrictEqual({ foo: 1 }, { foo: 1 }, 'should fail'), /should fail/)
  t.exception(() => assert.notDeepStrictEqual([1, 2], [1, 2], 'should fail'), /should fail/)
})

test('notDeepStrictEqual, recursive object', (t) => {
  // A two object cycle against the same cycle behind one extra object.
  const twoCycle = () => {
    const first = {}
    const second = {}
    first.prop = second
    second.prop = first
    return first
  }

  const tailIntoTwoCycle = () => ({ prop: twoCycle() })

  t.execution(() => assert.notDeepStrictEqual(twoCycle(), tailIntoTwoCycle()))
  t.exception(() => assert.notDeepStrictEqual(twoCycle(), twoCycle(), 'should fail'), /should fail/)
})

test('notDeepStrictEqual, shared reference', (t) => {
  const shared = { value: 1 }

  t.execution(() =>
    assert.notDeepStrictEqual(
      { foo: shared, bar: shared, baz: 1 },
      { foo: { value: 1 }, bar: { value: 1 }, baz: 2 }
    )
  )
  t.exception(
    () =>
      assert.notDeepStrictEqual(
        { foo: shared, bar: shared },
        { foo: { value: 1 }, bar: { value: 1 } },
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, basic', (t) => {
  t.execution(() => assert.partialDeepStrictEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }))
  t.execution(() => assert.partialDeepStrictEqual({ a: 1, b: 2, c: 3 }, { b: 2 }))
  t.execution(() => assert.partialDeepStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9], [4, 5, 9]))
  t.execution(() =>
    assert.partialDeepStrictEqual(new Set([{ a: 1 }, { b: 1 }]), new Set([{ a: 1 }]))
  )
  assert.partialDeepStrictEqual(
    new Map([
      ['foo', 'foo'],
      ['bar', 'bar']
    ]),
    new Map([['bar', 'bar']])
  )

  t.exception(
    () => assert.partialDeepStrictEqual({ a: 1 }, { a: 1, b: 2 }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ a: { b: 2 } }, { a: { b: '2' } }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9], [5, 4, 8], 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, map', (t) => {
  const foo = new Map([
    [{ a: 1 }, 'value1'],
    [{ a: 2 }, 'value2'],
    [{ a: 2 }, 'value3'],
    [{ a: 2 }, 'value3'],
    [{ a: 2 }, 'value4'],
    [{ a: 1 }, 'value2']
  ])

  const bar = new Map([
    [{ a: 2 }, 'value3'],
    [{ a: 1 }, 'value1'],
    [{ a: 2 }, 'value3'],
    [{ a: 1 }, 'value2']
  ])

  t.execution(() => assert.partialDeepStrictEqual(foo, bar))
})

test('partialDeepStrictEqual, set', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(new Set([{ foo: 1, bar: 2 }]), new Set([{ foo: 1 }]))
  )

  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([{ foo: 1, bar: 2 }, { foo: 1 }]),
      new Set([{ foo: 1 }, { foo: 1, bar: 2 }])
    )
  )
})

test('partialDeepStrictEqual, sparse array', (t) => {
  t.execution(() => assert.partialDeepStrictEqual([1, , , undefined, , 3], [1, , undefined, 3]))

  t.execution(() => {
    const foo = new Array(15)
    foo[0] = 1
    foo[1] = 2
    foo[5] = 100n
    foo[10] = 3

    const bar = new Array(12)
    bar[0] = 1
    bar[1] = 2
    bar[5] = 3

    assert.partialDeepStrictEqual(foo, bar)
  })

  t.exception(
    () => assert.partialDeepStrictEqual([1, , , , 3], [1, , undefined, 3], 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, error', (t) => {
  t.execution(() => assert.partialDeepStrictEqual(new Error('message'), new Error()))
  t.execution(() =>
    assert.partialDeepStrictEqual(new Error('message', { cause: 42 }), new Error('message'))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(new Error('message', { cause: undefined }), new Error('message'))
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Error('message'),
        new Error('message', { cause: undefined }),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, error, aggregate error', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(new AggregateError([new Error()]), new AggregateError([]))
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new AggregateError([]),
        new AggregateError([new Error()]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, typed array', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array([1, 2, 3, 5]))
  )
})

test('partialDeepStrictEqual, typed array, float', (t) => {
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Float16Array([+0.0]), // lunte-disable-line no-undef
        new Float16Array([-0.0]), // lunte-disable-line no-undef
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, array, non-enumerable symbol', (t) => {
  const foo = [1, 2, 3]

  Object.defineProperty(foo, Symbol.for('test'), {
    value: 'test',
    enumerable: false
  })

  const bar = [1, 2, 3]

  bar[Symbol.for('test')] = 'test'

  t.exception(() => assert.partialDeepStrictEqual(foo, bar, 'should fail'), /should fail/)
})

test('partialDeepStrictEqual, object, numeric keys', (t) => {
  t.exception(() => assert.partialDeepStrictEqual({ 0: 'a', 1: 'b' }, { 1: 'c' }))
})

test('partialDeepStrictEqual, SharedArrayBuffer', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(new SharedArrayBuffer(10), new SharedArrayBuffer(5))
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new SharedArrayBuffer(5),
        new SharedArrayBuffer(10),
        'should fail'
      ),
    /should fail/
  )
})

// Adapted from https://github.com/nodejs/node/blob/main/test/parallel/test-assert-partial-deep-equal.js
test('partialDeepStrictEqual, node.js test suite', function (t) {
  const x = ['x']

  function createCircularObject() {
    const obj = {}
    obj.self = obj
    obj.set = new Set([x, ['y']])
    return obj
  }

  function createDeepNestedObject() {
    return { level1: { level2: { level3: 'deepValue' } } }
  }

  /*
  async function generateCryptoKey() {
    const { KeyObject } = require('node:crypto')
    const { subtle } = globalThis.crypto

    const cryptoKey = await subtle.generateKey(
      {
        name: 'HMAC',
        hash: 'SHA-256',
        length: 256
      },
      true,
      ['sign', 'verify']
    )

    const keyObject = KeyObject.from(cryptoKey)

    return { cryptoKey, keyObject }
  }
  */

  t.test('throws an error', (t) => {
    const tests = [
      {
        description: 'throws when only actual is provided',
        actual: { a: 1 },
        expected: undefined
      },
      {
        description: 'throws when unequal zeros are compared',
        actual: 0,
        expected: -0
      },
      {
        description: 'throws when only expected is provided',
        actual: undefined,
        expected: { a: 1 }
      },
      {
        description: 'throws when expected has more properties than actual',
        actual: [1, 'two'],
        expected: [1, 'two', true]
      },
      {
        description: 'throws because expected has seven 2 while actual has six one',
        actual: [1, 2, 2, 2, 2, 2, 2, 3],
        expected: [1, 2, 2, 2, 2, 2, 2, 2]
      },
      {
        description: 'throws when comparing two different sets with objects',
        actual: new Set([{ a: 1 }]),
        expected: new Set([{ a: 1 }, { b: 1 }])
      },

      {
        description: 'throws when comparing two WeakSet objects',
        actual: new WeakSet(),
        expected: new WeakSet()
      },
      {
        description: 'throws when comparing two WeakMap objects',
        actual: new WeakMap(),
        expected: new WeakMap()
      },
      {
        description: 'throws when comparing two different objects',
        actual: { a: 1, b: 'string' },
        expected: { a: 2, b: 'string' }
      },
      {
        description: 'throws when comparing two objects with different nested objects',
        actual: createDeepNestedObject(),
        expected: { level1: { level2: { level3: 'differentValue' } } }
      },
      {
        description: 'throws when comparing two objects with different RegExp properties',
        actual: { pattern: /abc/ },
        expected: { pattern: /def/ }
      },
      {
        description: 'throws when comparing two arrays with different elements',
        actual: [1, 'two', true],
        expected: [1, 'two', false]
      },
      {
        description: 'throws when comparing [0] with [-0]',
        actual: [0],
        expected: [-0]
      },
      {
        description: 'throws when comparing [0, 0, 0] with [0, -0]',
        actual: [0, 0, 0],
        expected: [0, -0]
      },
      {
        description: 'throws when comparing ["-0"] with [-0]',
        actual: ['-0'],
        expected: [-0]
      },
      {
        description: 'throws when comparing [-0] with [0]',
        actual: [-0],
        expected: [0]
      },
      {
        description: 'throws when comparing [-0] with ["-0"]',
        actual: [-0],
        expected: ['-0']
      },
      {
        description: 'throws when comparing ["0"] with [0]',
        actual: ['0'],
        expected: [0]
      },
      {
        description: 'throws when comparing [0] with ["0"]',
        actual: [0],
        expected: ['0']
      },
      {
        description: 'throws when comparing two Date objects with different times',
        actual: new Date(0),
        expected: new Date(1)
      },
      {
        description: 'throws when comparing two objects with different large number of properties',
        actual: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, i])),
        expected: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, i + 1]))
      },
      {
        description: 'throws when comparing two objects with different Symbols',
        actual: { [Symbol('test')]: 'symbol' },
        expected: { [Symbol('test')]: 'symbol' }
      },
      {
        description: 'throws when comparing two objects with different array properties',
        actual: { a: [1, 2, 3] },
        expected: { a: [1, 2, 4] }
      },
      {
        description: 'throws when comparing two objects with different function properties',
        actual: { fn: () => {} },
        expected: { fn: () => {} }
      },
      {
        description: 'throws when comparing two objects with different Error message',
        actual: { error: new Error('Test error 1') },
        expected: { error: new Error('Test error 2') }
      },
      {
        description: 'throws when comparing two objects with missing cause on the actual Error',
        actual: { error: new Error('Test error 1') },
        expected: { error: new Error('Test error 1', { cause: 42 }) }
      },
      {
        description: 'throws when comparing two objects with missing message on the actual Error',
        actual: { error: new Error() },
        expected: { error: new Error('Test error 1') }
      },
      {
        description: 'throws when comparing two Errors with missing cause on the actual Error',
        actual: { error: new Error('Test error 1') },
        expected: { error: new Error('Test error 1', { cause: undefined }) }
      },
      {
        description:
          'throws when comparing two AggregateErrors with missing message on the actual Error',
        actual: { error: new AggregateError([], 'Test error 1') },
        expected: { error: new AggregateError([new Error()], 'Test error 1') }
      },
      {
        description:
          'throws when comparing two objects with different TypedArray instances and content',
        actual: { typedArray: new Uint8Array([1, 2, 3]) },
        expected: { typedArray: new Uint8Array([4, 5, 6]) }
      },
      {
        description: 'throws when comparing two Map objects with different entries',
        actual: new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ]),
        expected: new Map([
          ['key1', 'value1'],
          ['key3', 'value3']
        ])
      },
      {
        description: 'throws when comparing two Map objects with different keys',
        actual: new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ]),
        expected: new Map([
          ['key1', 'value1'],
          ['key3', 'value2']
        ])
      },
      {
        description: 'throws when the expected Map has more entries than the actual Map',
        actual: new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ]),
        expected: new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
          ['key3', 'value3']
        ])
      },
      {
        description:
          'throws when the nested array in the Map is not a subset of the other nested array',
        actual: new Map([
          ['key1', ['value1', 'value2']],
          ['key2', 'value2']
        ]),
        expected: new Map([['key1', ['value3']]])
      },
      {
        description: 'throws for maps with object keys and different values',
        actual: new Map([
          [{ a: 1 }, 'value1'],
          [{ b: 2 }, 'value2'],
          [{ b: 2 }, 'value4']
        ]),
        expected: new Map([
          [{ a: 1 }, 'value1'],
          [{ b: 2 }, 'value3']
        ])
      },
      {
        description: 'throws for maps with multiple identical object keys, just not enough',
        actual: new Map([
          [{ a: 1 }, 'value1'],
          [{ b: 1 }, 'value2'],
          [{ a: 1 }, 'value1']
        ]),
        expected: new Map([
          [{ a: 1 }, 'value1'],
          [{ a: 1 }, 'value1'],
          [{ a: 1 }, 'value1']
        ])
      },
      {
        description: 'throws for Maps with mixed unequal entries',
        actual: new Map([
          [{ a: 2 }, 1],
          [1, 1],
          [{ b: 1 }, 1],
          [[], 1],
          [2, 1],
          [{ a: 1 }, 1]
        ]),
        expected: new Map([
          [{ a: 1 }, 1],
          [[], 1],
          [2, 1],
          [{ a: 1 }, 1]
        ])
      },
      {
        description: 'throws for sets with different object values',
        actual: new Set([{ a: 1 }, { a: 2 }, { a: 1 }, { a: 2 }]),
        expected: new Set([{ a: 1 }, { a: 2 }, { a: 1 }, { a: 1 }])
      },
      {
        description: 'throws when comparing two TypedArray instances with different content',
        actual: new Uint8Array(10),
        expected: () => {
          const typedArray2 = new Int8Array(10)
          Object.defineProperty(typedArray2, Symbol.toStringTag, {
            value: 'Uint8Array'
          })
          Object.setPrototypeOf(typedArray2, Uint8Array.prototype)

          return typedArray2
        }
      },
      /*
      {
        description:
          'throws when comparing two Set objects from different realms with different values',
        actual: new vm.runInNewContext('new Set(["value1", "value2"])'),
        expected: new Set(['value1', 'value3'])
      },
      */
      {
        description: 'throws when comparing two Set objects with different values',
        actual: new Set(['value1', 'value2']),
        expected: new Set(['value1', 'value3'])
      },
      {
        description: 'throws when comparing one subset object with another',
        actual: { a: 1, b: 2, c: 3 },
        expected: { b: '2' }
      },
      {
        description: 'throws when comparing one subset array with another',
        actual: [1, 2, 3],
        expected: ['2']
      },
      {
        description: 'throws when comparing an array with symbol properties not matching',
        actual: (() => {
          const array = [1, 2, 3]
          array[Symbol.for('test')] = 'test'
          return array
        })(),
        expected: (() => {
          const array = [1, 2, 3]
          array[Symbol.for('test')] = 'different'
          return array
        })()
      },
      {
        description: 'throws when comparing an array with extra properties not matching',
        actual: (() => {
          const array = [1, 2, 3]
          array.extra = 'test'
          return array
        })(),
        expected: (() => {
          const array = [1, 2, 3]
          array.extra = 'different'
          return array
        })()
      },
      {
        description: 'throws when comparing a non matching sparse array',
        actual: (() => {
          const array = new Array(1000)
          array[90] = 1
          array[92] = 2
          array[95] = 1
          array[96] = 2
          array.foo = 'bar'
          array.extra = 'test'
          return array
        })(),
        expected: (() => {
          const array = new Array(1000)
          array[90] = 1
          array[92] = 1
          array[95] = 1
          array.extra = 'test'
          array.foo = 'bar'
          return array
        })()
      },
      {
        description: 'throws when comparing a same length sparse array with actual less keys',
        actual: (() => {
          const array = new Array(1000)
          array[90] = 1
          array[92] = 1
          return array
        })(),
        expected: (() => {
          const array = new Array(1000)
          array[90] = 1
          array[92] = 1
          array[95] = 1
          return array
        })()
      },
      {
        description:
          'throws when comparing an array with symbol properties matching but other enumerability',
        actual: (() => {
          const array = [1, 2, 3]
          array[Symbol.for('abc')] = 'test'
          Object.defineProperty(array, Symbol.for('test'), {
            value: 'test',
            enumerable: false
          })
          array[Symbol.for('other')] = 'test'
          return array
        })(),
        expected: (() => {
          const array = [1, 2, 3]
          array[Symbol.for('test')] = 'test'
          return array
        })()
      },
      {
        description:
          'throws comparing an array with extra properties matching but other enumerability',
        actual: (() => {
          const array = [1, 2, 3]
          array.alsoIgnored = [{ nested: { property: true } }]
          Object.defineProperty(array, 'extra', {
            value: 'test',
            enumerable: false
          })
          array.ignored = 'test'
          return array
        })(),
        expected: (() => {
          const array = [1, 2, 3]
          array.extra = 'test'
          return array
        })()
      },
      {
        description: 'throws when comparing an ArrayBuffer with a Uint8Array',
        actual: new ArrayBuffer(3),
        expected: new Uint8Array(3)
      },
      {
        description: 'throws when comparing an TypedArrays with symbol properties not matching',
        actual: (() => {
          const typed = new Uint8Array(3)
          typed[Symbol.for('test')] = 'test'
          return typed
        })(),
        expected: (() => {
          const typed = new Uint8Array(3)
          typed[Symbol.for('test')] = 'different'
          return typed
        })()
      },
      {
        description: 'throws when comparing a ArrayBuffer with a SharedArrayBuffer',
        actual: new ArrayBuffer(3),
        expected: new SharedArrayBuffer(3)
      },
      {
        description: 'throws when comparing a SharedArrayBuffer with an ArrayBuffer',
        actual: new SharedArrayBuffer(3),
        expected: new ArrayBuffer(3)
      },
      {
        description: 'throws when comparing an Int16Array with a Uint16Array',
        actual: new Int16Array(3),
        expected: new Uint16Array(3)
      },
      {
        description: 'throws when comparing two dataviews with different buffers',
        actual: { dataView: new DataView(new ArrayBuffer(3)) },
        expected: { dataView: new DataView(new ArrayBuffer(4)) }
      },
      {
        description:
          'throws because expected Uint8Array(SharedArrayBuffer) is not a subset of actual',
        actual: { typedArray: new Uint8Array(new SharedArrayBuffer(3)) },
        expected: { typedArray: new Uint8Array(new SharedArrayBuffer(5)) }
      },
      {
        description: 'throws because expected SharedArrayBuffer is not a subset of actual',
        actual: { typedArray: new SharedArrayBuffer(3) },
        expected: { typedArray: new SharedArrayBuffer(5) }
      },
      {
        description: 'throws when comparing a DataView with a TypedArray',
        actual: { dataView: new DataView(new ArrayBuffer(3)) },
        expected: { dataView: new Uint8Array(3) }
      },
      {
        description: 'throws when comparing a TypedArray with a DataView',
        actual: { dataView: new Uint8Array(3) },
        expected: { dataView: new DataView(new ArrayBuffer(3)) }
      },
      {
        description: 'throws when comparing Float16Array([+0.0]) with Float16Array([-0.0])',
        actual: new Float16Array([+0.0]), // lunte-disable-line no-undef
        expected: new Float16Array([-0.0]) // lunte-disable-line no-undef
      },
      {
        description: 'throws when comparing Float32Array([+0.0]) with Float32Array([-0.0])',
        actual: new Float32Array([+0.0]),
        expected: new Float32Array([-0.0])
      },
      {
        description: 'throws when comparing two Uint8Array objects with non-matching entries',
        actual: { typedArray: new Uint8Array([1, 2, 3, 4, 5]) },
        expected: { typedArray: new Uint8Array([1, 333, 2, 4]) }
      },
      {
        description: 'throws when comparing two different urls',
        actual: new URL('http://foo'),
        expected: new URL('http://bar')
      },
      {
        description:
          'throws when comparing SharedArrayBuffers when expected has different elements actual',
        actual: (() => {
          const sharedBuffer = new SharedArrayBuffer(4 * Int32Array.BYTES_PER_ELEMENT)
          const sharedArray = new Int32Array(sharedBuffer)

          sharedArray[0] = 1
          sharedArray[1] = 2
          sharedArray[2] = 3

          return sharedBuffer
        })(),
        expected: (() => {
          const sharedBuffer = new SharedArrayBuffer(4 * Int32Array.BYTES_PER_ELEMENT)
          const sharedArray = new Int32Array(sharedBuffer)

          sharedArray[0] = 1
          sharedArray[1] = 2
          sharedArray[2] = 6

          return sharedBuffer
        })()
      }
    ]

    /*
    if (common.hasCrypto) {
      tests.push({
        description: 'throws when comparing two objects with different CryptoKey instances objects',
        actual: async () => {
          return generateCryptoKey()
        },
        expected: async () => {
          return generateCryptoKey()
        }
      })

      const { createSecretKey } = require('node:crypto')

      tests.push({
        description: 'throws when comparing two objects with different KeyObject instances objects',
        actual: createSecretKey(Buffer.alloc(1, 0)),
        expected: createSecretKey(Buffer.alloc(1, 1))
      })
    }
    */

    for (const { description, actual, expected } of tests) {
      t.exception(() => assert.partialDeepStrictEqual(actual, expected), description)
    }
  })

  t.test('does not throw an error', (t) => {
    const sym = Symbol('test')
    const func = () => {}

    const tests = [
      {
        description: 'compares two identical simple objects',
        actual: { a: 1, b: 'string' },
        expected: { a: 1, b: 'string' }
      },
      {
        description: 'compares two objects with different property order',
        actual: { a: 1, b: 'string' },
        expected: { b: 'string', a: 1 }
      },
      {
        description: 'compares two deeply nested objects with partial equality',
        actual: { a: { nested: { property: true, some: 'other' } } },
        expected: { a: { nested: { property: true } } }
      },
      /*
      {
        description: 'compares plain objects from different realms',
        actual: vm.runInNewContext(`({
          a: 1,
          b: 2n,
          c: "3",
          d: /4/,
          e: new Set([5]),
          f: [6],
          g: new Uint8Array()
        })`),
        expected: { b: 2n, e: new Set([5]), f: [6], g: new Uint8Array() }
      },
      */
      {
        description: 'compares two integers',
        actual: 1,
        expected: 1
      },
      {
        description: 'compares two strings',
        actual: '1',
        expected: '1'
      },
      {
        description: 'compares two objects with nested objects',
        actual: createDeepNestedObject(),
        expected: createDeepNestedObject()
      },
      {
        description: 'compares two objects with circular references',
        actual: createCircularObject(),
        expected: createCircularObject()
      },
      {
        description: 'compares two arrays with identical elements',
        actual: [1, 'two', true],
        expected: [1, 'two', true]
      },
      {
        description: 'compares [0] with [0]',
        actual: [0],
        expected: [0]
      },
      {
        description: 'compares [-0] with [-0]',
        actual: [-0],
        expected: [-0]
      },
      {
        description: 'compares [0, -0, 0] with [0, 0]',
        actual: [0, -0, 0],
        expected: [0, 0]
      },
      {
        description: 'comparing an array with symbol properties matching',
        actual: (() => {
          const array = [1, 2, 3]
          array[Symbol.for('abc')] = 'test'
          array[Symbol.for('test')] = 'test'
          Object.defineProperty(array, Symbol.for('hidden'), {
            value: 'hidden',
            enumerable: false
          })
          return array
        })(),
        expected: (() => {
          const array = [1, 2, 3]
          array[Symbol.for('test')] = 'test'
          return array
        })()
      },
      {
        description: 'comparing an array with extra properties matching',
        actual: (() => {
          const array = [1, 2, 3]
          array.alsoIgnored = [{ nested: { property: true } }]
          array.extra = 'test'
          array.ignored = 'test'
          return array
        })(),
        expected: (() => {
          const array = [1, 2, 3]
          array.extra = 'test'
          Object.defineProperty(array, 'ignored', { enumerable: false })
          Object.defineProperty(array, Symbol.for('hidden'), {
            value: 'hidden',
            enumerable: false
          })
          return array
        })()
      },
      {
        description: 'compares two Date objects with the same time',
        actual: new Date(0),
        expected: new Date(0)
      },
      {
        description: 'compares two objects with large number of properties',
        actual: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, i])),
        expected: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, i]))
      },
      {
        description: 'compares two objects with Symbol properties',
        actual: { [sym]: 'symbol' },
        expected: { [sym]: 'symbol' }
      },
      {
        description: 'compares two objects with RegExp properties',
        actual: { pattern: /abc/ },
        expected: { pattern: /abc/ }
      },
      {
        description: 'compares two objects with identical function properties',
        actual: { fn: func },
        expected: { fn: func }
      },
      {
        description: 'compares two objects with mixed types of properties',
        actual: { num: 1, str: 'test', bool: true, sym },
        expected: { num: 1, str: 'test', bool: true, sym }
      },
      {
        description: 'compares two objects with Buffers',
        actual: { buf: Buffer.from('Node.js') },
        expected: { buf: Buffer.from('Node.js') }
      },
      {
        description: 'compares two objects with identical Error properties',
        actual: { error: new Error('Test error') },
        expected: { error: new Error('Test error') }
      },
      {
        description: 'compares two Uint8Array objects',
        actual: { typedArray: new Uint8Array([1, 2, 3, 4, 5]) },
        expected: { typedArray: new Uint8Array([1, 2, 3, 5]) }
      },
      {
        description: 'compares two Int16Array objects',
        actual: { typedArray: new Int16Array([1, 2, 3, 4, 5]) },
        expected: { typedArray: new Int16Array([1, 2, 3]) }
      },
      {
        description: 'compares two DataView objects with the same buffer and different views',
        actual: { dataView: new DataView(new ArrayBuffer(8), 0, 4) },
        expected: { dataView: new DataView(new ArrayBuffer(8), 4, 4) }
      },
      {
        description: 'compares two DataView objects with different buffers',
        actual: { dataView: new DataView(new ArrayBuffer(8)) },
        expected: { dataView: new DataView(new ArrayBuffer(8)) }
      },
      {
        description: 'compares two DataView objects with the same buffer and same views',
        actual: { dataView: new DataView(new ArrayBuffer(8), 0, 8) },
        expected: { dataView: new DataView(new ArrayBuffer(8), 0, 8) }
      },
      {
        description: 'compares two SharedArrayBuffers with the same length',
        actual: new SharedArrayBuffer(3),
        expected: new SharedArrayBuffer(3)
      },
      {
        description: 'compares two Uint8Array objects from SharedArrayBuffer',
        actual: { typedArray: new Uint8Array(new SharedArrayBuffer(5)) },
        expected: { typedArray: new Uint8Array(new SharedArrayBuffer(3)) }
      },
      {
        description: 'compares two Int16Array objects from SharedArrayBuffer',
        actual: { typedArray: new Int16Array(new SharedArrayBuffer(10)) },
        expected: { typedArray: new Int16Array(new SharedArrayBuffer(6)) }
      },
      {
        description:
          'compares two DataView objects with the same SharedArrayBuffer and different views',
        actual: { dataView: new DataView(new SharedArrayBuffer(8), 0, 4) },
        expected: { dataView: new DataView(new SharedArrayBuffer(8), 4, 4) }
      },
      {
        description: 'compares two DataView objects with different SharedArrayBuffers',
        actual: { dataView: new DataView(new SharedArrayBuffer(8)) },
        expected: { dataView: new DataView(new SharedArrayBuffer(8)) }
      },
      {
        description: 'compares two DataView objects with the same SharedArrayBuffer and same views',
        actual: { dataView: new DataView(new SharedArrayBuffer(8), 0, 8) },
        expected: { dataView: new DataView(new SharedArrayBuffer(8), 0, 8) }
      },
      {
        description: 'compares two SharedArrayBuffers',
        actual: { typedArray: new SharedArrayBuffer(5) },
        expected: { typedArray: new SharedArrayBuffer(3) }
      },
      {
        description: 'compares two SharedArrayBuffers with data inside',
        actual: (() => {
          const sharedBuffer = new SharedArrayBuffer(4 * Int32Array.BYTES_PER_ELEMENT)
          const sharedArray = new Int32Array(sharedBuffer)

          sharedArray[0] = 1
          sharedArray[1] = 2
          sharedArray[2] = 3
          sharedArray[3] = 4

          return sharedBuffer
        })(),
        expected: (() => {
          const sharedBuffer = new SharedArrayBuffer(3 * Int32Array.BYTES_PER_ELEMENT)
          const sharedArray = new Int32Array(sharedBuffer)

          sharedArray[0] = 1
          sharedArray[1] = 2
          sharedArray[2] = 3

          return sharedBuffer
        })()
      },
      {
        description: 'compares two Map objects with identical entries',
        actual: new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ]),
        expected: new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ])
      },
      {
        description: 'compares two Map where one is a subset of the other',
        actual: new Map([
          ['key1', { nested: { property: true } }],
          ['key2', new Set([1, 2, 3])],
          ['key3', new Uint8Array([1, 2, 3])]
        ]),
        expected: new Map([
          ['key1', { nested: { property: true } }],
          ['key2', new Set([1, 2, 3])],
          ['key3', new Uint8Array([1, 2, 3])]
        ])
      },
      {
        description: 'compares maps with object keys',
        actual: new Map([
          [{ a: 1 }, 'value1'],
          [{ a: 2 }, 'value2'],
          [{ a: 2 }, 'value3'],
          [{ a: 2 }, 'value3'],
          [{ a: 2 }, 'value4'],
          [{ a: 1 }, 'value2']
        ]),
        expected: new Map([
          [{ a: 2 }, 'value3'],
          [{ a: 1 }, 'value1'],
          [{ a: 2 }, 'value3'],
          [{ a: 1 }, 'value2']
        ])
      },
      {
        describe: 'compares two simple sparse arrays',
        actual: new Array(1_000),
        expected: new Array(100)
      },
      {
        describe: 'compares two identical sparse arrays',
        actual: (() => {
          const array = new Array(100)
          array[1] = 2
          return array
        })(),
        expected: (() => {
          const array = new Array(100)
          array[1] = 2
          return array
        })()
      },
      {
        describe: 'compares two big sparse arrays',
        actual: (() => {
          const array = new Array(150_000_000)
          array[0] = 1
          array[1] = 2
          array[100] = 100n
          array[200_000] = 3
          array[1_200_000] = 4
          array[120_200_000] = []
          return array
        })(),
        expected: (() => {
          const array = new Array(100_000_000)
          array[0] = 1
          array[1] = 2
          array[200_000] = 3
          array[1_200_000] = 4
          return array
        })()
      },
      {
        describe: 'compares two array of objects',
        actual: [{ a: 5 }],
        expected: [{ a: 5 }]
      },
      {
        describe: 'compares two array of objects where expected is a subset of actual',
        actual: [{ a: 5 }, { b: 5 }],
        expected: [{ a: 5 }]
      },
      {
        description: 'compares two Set objects with identical objects',
        actual: new Set([{ a: 1 }]),
        expected: new Set([{ a: 1 }])
      },
      {
        description: 'compares two Set objects where expected is a subset of actual',
        actual: new Set([{ a: 1 }, { b: 1 }]),
        expected: new Set([{ a: 1 }])
      },
      {
        description: 'compares two Sets with mixed entries',
        actual: new Set([{ b: 1 }, [], 1, { a: 1 }, 2, []]),
        expected: new Set([{ a: 1 }, 2, []])
      },
      {
        description: 'compares two Sets with mixed entries different order',
        actual: new Set([{ a: 1 }, 1, { b: 1 }, [], 2, { a: 1 }]),
        expected: new Set([{ a: 1 }, [], 2, { a: 1 }])
      },
      {
        description: 'compares two Sets with mixed entries different order 2',
        actual: new Set([{ a: 1 }, { a: 1 }, 1, { b: 1 }, [], 2, { a: 1 }]),
        expected: new Set([{ a: 1 }, [], 2, { a: 1 }])
      },
      {
        description: 'compares two Set objects with identical arrays',
        actual: new Set(['value1', 'value2']),
        expected: new Set(['value1', 'value2'])
      },
      {
        description: 'compares two Set objects',
        actual: new Set(['value1', 'value2', 'value3']),
        expected: new Set(['value1', 'value2'])
      },
      /*
      {
        description: 'compares two Map objects from different realms with identical entries',
        actual: new vm.runInNewContext('new Map([["key1", "value1"], ["key2", "value2"]])'),
        expected: new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ])
      },
      */
      {
        description: 'compares two Map objects where expected is a subset of actual',
        actual: new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ]),
        expected: new Map([['key1', 'value1']])
      },
      {
        description: 'compares two deeply nested Maps',
        actual: {
          a: {
            b: {
              c: new Map([
                ['key1', 'value1'],
                ['key2', 'value2']
              ])
            },
            z: [1, 2, 3]
          }
        },
        expected: {
          a: {
            z: [1, 2, 3],
            b: {
              c: new Map([['key1', 'value1']])
            }
          }
        }
      },
      {
        description: 'compares Maps nested into Maps',
        actual: new Map([
          [
            'key1',
            new Map([
              ['nestedKey1', 'nestedValue1'],
              ['nestedKey2', 'nestedValue2']
            ])
          ],
          ['key2', 'value2']
        ]),
        expected: new Map([['key1', new Map([['nestedKey1', 'nestedValue1']])]])
      },
      {
        description: 'compares Maps with nested arrays inside',
        actual: new Map([
          ['key1', ['value1', 'value2']],
          ['key2', 'value2']
        ]),
        expected: new Map([['key1', ['value1', 'value2']]])
      },
      {
        description: 'compares two objects with identical getter/setter properties',
        actual: (() => {
          let value = 'test'
          return Object.defineProperty({}, 'prop', {
            get: () => value,
            set: (newValue) => {
              value = newValue
            },
            enumerable: true,
            configurable: true
          })
        })(),
        expected: (() => {
          let value = 'test'
          return Object.defineProperty({}, 'prop', {
            get: () => value,
            set: (newValue) => {
              value = newValue
            },
            enumerable: true,
            configurable: true
          })
        })()
      },
      {
        description: 'compares two objects with no prototype',
        actual: { __proto__: null, prop: 'value' },
        expected: { __proto__: null, prop: 'value' }
      },
      {
        description: 'compares two objects with identical non-enumerable properties',
        actual: (() => {
          const obj = {}
          Object.defineProperty(obj, 'hidden', {
            value: 'secret',
            enumerable: false
          })
          return obj
        })(),
        expected: (() => {
          const obj = {}
          Object.defineProperty(obj, 'hidden', {
            value: 'secret',
            enumerable: false
          })
          return obj
        })()
      },
      {
        description: 'compares two identical primitives, string',
        actual: 'foo',
        expected: 'foo'
      },
      {
        description: 'compares two identical primitives, number',
        actual: 1,
        expected: 1
      },
      {
        description: 'compares two identical primitives, boolean',
        actual: false,
        expected: false
      },
      {
        description: 'compares two identical primitives, null',
        actual: null,
        expected: null
      },
      {
        description: 'compares two identical primitives, undefined',
        actual: undefined,
        expected: undefined
      },
      {
        description: 'compares two identical primitives, Symbol',
        actual: sym,
        expected: sym
      },
      {
        description: 'compares one subset object with another',
        actual: { a: 1, b: 2, c: 3 },
        expected: { b: 2 }
      },
      {
        description: 'compares one subset array with another',
        actual: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        expected: [2, 5, 6, 7, 8]
      },
      /*
      {
        description: 'ensures that File extends Blob',
        actual: Object.getPrototypeOf(File.prototype),
        expected: Blob.prototype
      },
      */
      {
        description: 'compares NaN with NaN',
        actual: NaN,
        expected: NaN
      },
      {
        description: 'compares two identical urls',
        actual: new URL('http://foo'),
        expected: new URL('http://foo')
      },
      {
        description: 'compares a more complex object with additional parts on the actual',
        actual: [
          {
            foo: 'yarp',
            nope: {
              bar: '123',
              a: [1, 2, 0],
              c: {},
              b: [
                {
                  foo: 'yarp',
                  nope: { bar: '123', a: [1, 2, 0], c: {}, b: [] }
                },
                {
                  foo: 'yarp',
                  nope: { bar: '123', a: [1, 2, 1], c: {}, b: [] }
                }
              ]
            }
          }
        ],
        expected: [
          {
            foo: 'yarp',
            nope: {
              bar: '123',
              c: {},
              b: [
                { foo: 'yarp', nope: { bar: '123', c: {}, b: [] } },
                { foo: 'yarp', nope: { bar: '123', c: {}, b: [] } }
              ]
            }
          }
        ]
      },
      {
        description: 'comparing two Errors with missing cause on the expected Error',
        actual: { error: new Error('Test error 1', { cause: 42 }) },
        expected: { error: new Error('Test error 1') }
      },
      {
        description: 'comparing two Errors with cause set to undefined on the actual Error',
        actual: { error: new Error('Test error 1', { cause: undefined }) },
        expected: { error: new Error('Test error 1') }
      },
      {
        description: 'comparing two Errors with missing message on the expected Error',
        actual: { error: new Error('Test error 1') },
        expected: { error: new Error() }
      },
      {
        description:
          'comparing two AggregateErrors with no message or errors on the expected Error',
        actual: { error: new AggregateError([new Error(), 123]) },
        expected: { error: new AggregateError([]) }
      }
    ]

    for (const { description, actual, expected } of tests) {
      t.execution(() => assert.partialDeepStrictEqual(actual, expected), description)
    }
  })
})
