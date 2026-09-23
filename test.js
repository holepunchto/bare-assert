const test = require('brittle')
const assert = require('.')
const hopcroftKarp = require('./lib/hopcroft-karp')

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

// What makes a validation object is the properties it carries, not the kind of
// object carrying them.
test('throws, custom validation, object kinds', (t) => {
  const thrown = () => {
    throw Object.assign(new Error('boom'), { code: 7 })
  }

  const args = (function () {
    return arguments
  })()

  args.code = 7

  t.execution(() => assert.throws(thrown, Object.assign(new Date(0), { code: 7 })))
  t.execution(() => assert.throws(thrown, Object.assign(new Map(), { code: 7 })))
  t.execution(() => assert.throws(thrown, Object.assign(new Set(), { code: 7 })))
  t.execution(() => assert.throws(thrown, Object.assign([], { code: 7 })))
  t.execution(() => assert.throws(thrown, Object.assign(new Uint8Array(0), { code: 7 })))
  t.execution(() => assert.throws(thrown, Object.assign(Promise.resolve(1), { code: 7 })))
  t.execution(() => assert.throws(thrown, args))
  t.execution(() => assert.throws(thrown, { code: 7 }))

  t.exception(
    () => assert.throws(thrown, Object.assign(new Date(0), { code: 8 }), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.throws(thrown, Object.assign([], { code: 8 }), 'should fail'),
    /should fail/
  )
})

// A constructor says what the error should be an instance of. It is not a
// predicate, and a class cannot be called to find out.
test('throws, custom validation, constructor', (t) => {
  class Boom extends Error {}

  function Legacy(message) {
    this.message = message
  }

  Legacy.prototype = Object.create(Error.prototype)

  const throwing = (err) => () => {
    throw err
  }

  t.execution(() => assert.throws(throwing(new Boom('boom')), Boom))
  t.execution(() => assert.throws(throwing(new TypeError('boom')), TypeError))
  t.execution(() => assert.throws(throwing(new Legacy('boom')), Legacy))
  t.execution(() => assert.doesNotThrow(() => {}, Boom))

  t.exception.all(
    () => assert.throws(throwing(new TypeError('boom')), Boom, 'should fail'),
    /should fail/
  )
})

test('rejects, custom validation, constructor', async (t) => {
  t.plan(1)

  class Boom extends Error {}

  await t.execution(assert.rejects(() => Promise.reject(new Boom('boom')), Boom))
})

test('rejects, custom validation, object kinds', async (t) => {
  t.plan(1)

  await t.execution(
    assert.rejects(
      () => Promise.reject(Object.assign(new Error('boom'), { code: 7 })),
      Object.assign(new Date(0), { code: 7 })
    )
  )
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

// A pair that is the same reference is equal without being walked, so a getter
// reachable only through it is never invoked. Each case needs its own object,
// or a failure in one leaves state behind that decides the next.
test('deepStrictEqual, object, getter, identical reference', (t) => {
  const foo = {
    get bar() {
      throw new Error('should not be read')
    }
  }

  const baz = {
    get bar() {
      throw new Error('should not be read')
    }
  }

  t.execution(() => assert.deepStrictEqual(foo, foo))
  t.execution(() => assert.deepStrictEqual({ bar: baz }, { bar: baz }))
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

// Two prototypes that are not the same object are not the same prototype, even
// where both lead back to one constructor. This is what the documented contract
// asks for - "[[Prototype]] of objects are compared using the === operator" -
// and Node's own implementation is looser than that, comparing `constructor`
// and reaching for the prototype only as a fallback. These cases pass there and
// must keep failing here; do not relax them to match it.
test('deepStrictEqual, object, prototype, same constructor', (t) => {
  class Foo {}

  const descend = (prototype) => Object.create(Object.create(prototype))

  t.exception(
    () =>
      assert.deepStrictEqual(Object.create(Foo.prototype), descend(Foo.prototype), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual({}, descend(Object.prototype), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(descend(Object.prototype), descend(Object.prototype), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(descend(Number.prototype), descend(Number.prototype), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        Object.assign(Object.create(Foo.prototype), { foo: 1 }),
        Object.assign(descend(Foo.prototype), { foo: 1 }),
        'should fail'
      ),
    /should fail/
  )

  t.execution(() => assert.deepStrictEqual(new Foo(), new Foo()))

  // Partial equality compares the kind of a value rather than its prototype, so
  // the same pair belongs together there.
  t.execution(() =>
    assert.partialDeepStrictEqual(Object.create(Foo.prototype), descend(Foo.prototype))
  )
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

// Inheriting from `Number.prototype` does not make a value a boxed number, and
// `valueOf` cannot be called on one that is not.
test('deepStrictEqual, boxed value, without internal slot', (t) => {
  t.execution(() =>
    assert.deepStrictEqual(Object.create(Number.prototype), Object.create(Number.prototype))
  )
  t.execution(() =>
    assert.deepStrictEqual(Object.create(String.prototype), Object.create(String.prototype))
  )

  t.exception.all(
    () => assert.deepStrictEqual(Object.create(Number.prototype), new Number(1), 'should fail'),
    /should fail/
  )
})

// `Object.prototype.toString` reports whatever `Symbol.toStringTag` says, so
// the tag alone does not make a value a boxed one either.
test('deepStrictEqual, boxed value, forged tag', (t) => {
  const tagged = (tag) => ({ [Symbol.toStringTag]: tag })

  t.execution(() => assert.deepStrictEqual(tagged('Number'), tagged('Number')))
  t.execution(() => assert.deepStrictEqual(tagged('String'), tagged('String')))
  t.execution(() => assert.deepStrictEqual(tagged('Object'), tagged('Object')))

  t.exception(
    () => assert.deepStrictEqual(tagged('Number'), tagged('String'), 'should fail'),
    /should fail/
  )
})

// Inheriting the prototype and carrying the tag still leaves the value without
// the state a boxed number keeps, which is the only thing `valueOf` can read.
test('deepStrictEqual, boxed value, borrowed prototype and tag', (t) => {
  const borrowed = () => {
    const value = Object.create(Number.prototype)

    value[Symbol.toStringTag] = 'Number'

    return value
  }

  t.execution(() => assert.deepStrictEqual(borrowed(), borrowed()))
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

// An own `cause` on one side and none on the other is a difference whichever
// side carries it.
test('deepStrictEqual, error, cause property, one sided', (t) => {
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Error('err', { cause: undefined }),
        new Error('err'),
        'should fail'
      ),
    /should fail/
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

  t.execution(() =>
    assert.partialDeepStrictEqual(new Error('err', { cause: undefined }), new Error('err'))
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

test('deepStrictEqual, recursive array in set', (t) => {
  const selfReferential = () => {
    const list = []

    list.push(list)

    return list
  }

  t.execution(() =>
    assert.deepStrictEqual(new Set([selfReferential()]), new Set([selfReferential()]))
  )
  t.execution(() =>
    assert.deepStrictEqual(new Map([[selfReferential(), 1]]), new Map([[selfReferential(), 1]]))
  )

  t.execution(() => {
    const a = []
    const b = []

    a.push(b)
    b.push(a)

    assert.deepStrictEqual(new Set([a]), new Set([b]))
  })
})

// A comparison that throws part way through must not leave the pairs it was
// walking behind, where a later comparison would mistake them for a cycle.
test('deepStrictEqual, comparison state', (t) => {
  const a = {
    foo: {
      get bar() {
        throw new Error('boom')
      }
    }
  }

  const b = {
    foo: {
      get bar() {
        throw new Error('boom')
      }
    }
  }

  t.exception(() => assert.deepStrictEqual(a, b), /boom/)
  t.exception(() => assert.deepStrictEqual(a, b), /boom/)
  t.exception(() => assert.partialDeepStrictEqual(a, b), /boom/)
  t.exception(() => assert.notDeepStrictEqual(a, b, 'should not be equal'), /boom/)
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

// Partial equality compares the kind of a value, not its prototype, so a class
// instance and a plain object with the same properties are equal.
test('partialDeepStrictEqual, prototype', (t) => {
  class MyClass {
    constructor(value) {
      this.value = value
    }
  }

  class Base {
    constructor() {
      this.foo = 1
    }
  }

  class Derived extends Base {
    constructor() {
      super()
      this.bar = 2
    }
  }

  class MyMap extends Map {}

  class MyArray extends Array {}

  t.execution(() => assert.partialDeepStrictEqual(new MyClass('foo'), { value: 'foo' }))
  t.execution(() => assert.partialDeepStrictEqual({ value: 'foo' }, new MyClass('foo')))
  t.execution(() => assert.partialDeepStrictEqual(new MyClass('foo'), {}))
  t.execution(() => assert.partialDeepStrictEqual(new Derived(), new Base()))
  t.execution(() =>
    assert.partialDeepStrictEqual(Object.assign(Object.create(null), { foo: 'bar' }), {
      foo: 'bar'
    })
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { foo: 'bar' },
      Object.assign(Object.create(null), { foo: 'bar' })
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new MyMap([
        ['foo', 1],
        ['bar', 2]
      ]),
      new Map([['foo', 1]])
    )
  )
  t.execution(() => assert.partialDeepStrictEqual(MyArray.from([1, 2, 3]), [1, 3]))
  t.execution(() => assert.partialDeepStrictEqual([1, 2, 3], MyArray.from([1, 3])))

  t.exception(
    () => assert.partialDeepStrictEqual(new Base(), new Derived(), 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, prototype, nested', (t) => {
  class MyClass {
    constructor(value) {
      this.value = value
    }
  }

  t.execution(() =>
    assert.partialDeepStrictEqual({ foo: new MyClass('bar') }, { foo: { value: 'bar' } })
  )
  t.execution(() => assert.partialDeepStrictEqual([new MyClass('foo')], [{ value: 'foo' }]))
  t.execution(() =>
    assert.partialDeepStrictEqual(new Set([new MyClass('foo')]), new Set([{ value: 'foo' }]))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([['foo', new MyClass('bar')]]),
      new Map([['foo', { value: 'bar' }]])
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([[new MyClass('foo'), 1]]),
      new Map([[{ value: 'foo' }, 1]])
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Error('message', { cause: new MyClass('foo') }),
      new Error('message', { cause: { value: 'foo' } })
    )
  )
})

// Ignoring the prototype does not make values of different kinds comparable.
test('partialDeepStrictEqual, prototype, differing kind', (t) => {
  class Tagged {
    constructor() {
      this.value = 'foo'
    }

    get [Symbol.toStringTag]() {
      return 'Tagged'
    }
  }

  t.exception(() => assert.partialDeepStrictEqual({}, [], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual([1], { 0: 1 }, 'should fail'), /should fail/)
  t.exception(
    () => assert.partialDeepStrictEqual(new Map([['foo', 1]]), { foo: 1 }, 'should fail'),
    /should fail/
  )
  t.exception(() => assert.partialDeepStrictEqual(new Set([1]), [1], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual(new Date(0), {}, 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual(/foo/, {}, 'should fail'), /should fail/)
  t.exception(
    () => assert.partialDeepStrictEqual(new Uint8Array([1]), [1], 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new String('foo'), 'foo', 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Tagged(), { value: 'foo' }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ value: 'foo' }, new Tagged(), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(new TypeError('message'), new Error('message'), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(function foo() {}, {}, 'should fail'),
    /should fail/
  )
})

// Values of different kinds stay unequal whichever side the special one is on.
// `Object.prototype.toString` separates the kinds that carry no
// `Symbol.toStringTag` of their own, such as errors, regular expressions,
// boxed primitives and arguments objects.
test('partialDeepStrictEqual, prototype, object tag', (t) => {
  const args = function () {
    return arguments
  }

  t.exception(() => assert.partialDeepStrictEqual({}, /foo/, 'should fail'), /should fail/)
  t.exception(
    () => assert.partialDeepStrictEqual({}, new Error('message'), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { lastIndex: 0, flags: '', source: 'foo' },
        /foo/,
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { message: 'message', name: 'Error' },
        new Error('message'),
        'should fail'
      ),
    /should fail/
  )
  t.exception(() => assert.partialDeepStrictEqual({}, new Number(1), 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual({}, new String(''), 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual({}, args(), 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual(args(1), {}, 'should fail'), /should fail/)
  t.exception(
    () => assert.partialDeepStrictEqual(Object.create(null), /foo/, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(Object.create(null), new Error('message'), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ foo: {} }, { foo: /bar/ }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ foo: {} }, { foo: new Error('bar') }, 'should fail'),
    /should fail/
  )

  // An empty tag is still a tag the other side does not have.
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { [Symbol.toStringTag]: '', foo: 1 },
        { foo: 1 },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { foo: 1 },
        { [Symbol.toStringTag]: '', foo: 1 },
        'should fail'
      ),
    /should fail/
  )
})

// A container tag says what a value would like to be called, not what it holds.
test('partialDeepStrictEqual, prototype, forged container tag', (t) => {
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { [Symbol.toStringTag]: 'Map' },
        new Map([['foo', 1]]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ [Symbol.toStringTag]: 'Map' }, new Map(), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { [Symbol.toStringTag]: 'Set' },
        new Set([1, 2]),
        'should fail'
      ),
    /should fail/
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Map([['foo', 1]]),
        { [Symbol.toStringTag]: 'Map' },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ [Symbol.toStringTag]: 'Array' }, [], 'should fail'),
    /should fail/
  )
})

// A proxy is a proxy, whatever it wraps. Node reaches a different answer for
// arrays alone, because `Array.isArray` is specified to recurse through a
// proxy's target while every other kind is decided from an internal slot on the
// value itself; that inconsistency is not worth reproducing.
test('partialDeepStrictEqual, proxy', (t) => {
  t.exception(
    () => assert.partialDeepStrictEqual(new Proxy([1, 2, 3], {}), [1, 3], 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual([1, 2, 3], new Proxy([1, 3], {}), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(new Proxy([1, 2, 3], {}), new Proxy([1, 3], {}), 'should fail'),
    /should fail/
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Proxy(new ArrayBuffer(2), {}),
        new ArrayBuffer(2),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Proxy(new Uint8Array([1]), {}),
        new Uint8Array([1]),
        'should fail'
      ),
    /should fail/
  )

  t.execution(() => assert.partialDeepStrictEqual(new Proxy({ a: 1, b: 2 }, {}), { a: 1 }))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Proxy(Object.assign(Object.create(null), { a: 1 }), {}),
      Object.assign(Object.create(null), { a: 1 })
    )
  )
})

// Strict equality answers the same way: a proxy has no kind of its own, so it
// stands apart from every value that does. Node agrees for all of these but
// arrays, where `Array.isArray` recursing into the proxy's target leads it the
// other way.
test('deepStrictEqual, proxy', (t) => {
  const args = (function () {
    return arguments
  })(1, 2)

  const sameArgs = (function () {
    return arguments
  })(1, 2)

  t.exception(
    () => assert.deepStrictEqual(new Proxy([1, 2], {}), [1, 2], 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(new Proxy(args, {}), sameArgs, 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(
        new Proxy(new Uint8Array([1, 2]), {}),
        new Uint8Array([1, 2]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.deepStrictEqual(new Proxy(new ArrayBuffer(2), {}), new ArrayBuffer(2), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(new Proxy(new Error('x'), {}), new Error('x'), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.deepStrictEqual(new Proxy(new Number(1), {}), new Number(1), 'should fail'),
    /should fail/
  )

  t.execution(() => assert.deepStrictEqual(new Proxy({ a: 1 }, {}), { a: 1 }))
  t.execution(() =>
    assert.deepStrictEqual(
      new Proxy(Object.assign(Object.create(null), { a: 1 }), {}),
      Object.assign(Object.create(null), { a: 1 })
    )
  )
  t.execution(() => assert.deepStrictEqual(new Proxy({ a: 1 }, {}), new Proxy({ a: 1 }, {})))
})

// Whichever answer a proxy gets, reaching it must not mean calling a method on
// a receiver that cannot accept it.
test('partialDeepStrictEqual, proxy, unwrapped receiver', (t) => {
  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(
        new Proxy(new Map([['a', 1]]), {}),
        new Map([['a', 1]]),
        'should fail'
      ),
    /should fail/
  )
  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(
        new Map([['a', 1]]),
        new Proxy(new Map([['a', 1]]), {}),
        'should fail'
      ),
    /should fail/
  )
  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(new Proxy(new Set([1, 2]), {}), new Set([1]), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () => assert.partialDeepStrictEqual(new Proxy(new Date(0), {}), new Date(0), 'should fail'),
    /should fail/
  )
})

test('deepStrictEqual, proxy, unwrapped receiver', (t) => {
  t.exception.all(
    () =>
      assert.deepStrictEqual(
        new Proxy(new Map([['a', 1]]), {}),
        new Map([['a', 1]]),
        'should fail'
      ),
    /should fail/
  )
  t.exception.all(
    () => assert.deepStrictEqual(new Proxy(new Set([1]), {}), new Set([1]), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () => assert.deepStrictEqual(new Proxy(new Date(0), {}), new Date(0), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () => assert.deepStrictEqual(new Proxy(/a/, {}), /a/, 'should fail'),
    /should fail/
  )

  t.execution(() => assert.deepStrictEqual(new Proxy({ a: 1 }, {}), { a: 1 }))
})

// Subclassing does not change what kind a value is, so the checks that turn on
// kind still reach it.
test('partialDeepStrictEqual, subclassed kinds', (t) => {
  class List extends Array {}

  class Dict extends Map {}

  class Bag extends Set {}

  class Pattern extends RegExp {}

  class Boom extends Error {}

  t.execution(() => assert.partialDeepStrictEqual(List.from([1, 2, 3]), List.from([1, 3])))
  t.execution(() =>
    assert.throws(
      () => {
        throw Object.assign(new Boom('boom'), { code: 7 })
      },
      Object.assign(new Boom('boom'), { code: 7 })
    )
  )
  t.execution(() =>
    assert.throws(() => {
      throw new Error('boom')
    }, new Pattern('boom'))
  )

  t.exception(
    () => assert.partialDeepStrictEqual(List.from([1, 2]), List.from([1, 2, 3]), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Dict([['a', 1]]),
        new Dict([
          ['a', 1],
          ['b', 2]
        ]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Bag([1]), new Bag([1, 2]), 'should fail'),
    /should fail/
  )
})

// The tag is what has to agree, so the same kind with a replaced prototype is
// still equal.
test('partialDeepStrictEqual, prototype, replaced prototype', (t) => {
  const withParent = (value, prototype) => Object.setPrototypeOf(value, { __proto__: prototype })

  t.execution(() => assert.partialDeepStrictEqual(/foo/, withParent(/foo/, RegExp.prototype)))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Error('message'),
      withParent(new Error('message'), Error.prototype)
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(new Date(0), withParent(new Date(0), Date.prototype))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(new Number(1), withParent(new Number(1), Number.prototype))
  )
})

// A boxed value is equal to another of the same type holding the same value.
// Neither the type nor the sign of a zero is negotiable.
test('partialDeepStrictEqual, boxed value', (t) => {
  t.exception(
    () => assert.partialDeepStrictEqual(new Number(0), new String(''), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new String('1'), new Number(1), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Boolean(true), new Number(1), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Number(-0), new Number(0), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Number(1), new Number(2), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(Object(1n), new Number(1), 'should fail'),
    /should fail/
  )
  t.exception(() => assert.partialDeepStrictEqual({}, new Number(0), 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual(new Number(0), {}, 'should fail'), /should fail/)

  t.execution(() => assert.partialDeepStrictEqual(new Number(1), new Number(1)))
  t.execution(() => assert.partialDeepStrictEqual(new String('ab'), new String('ab')))
})

// Only a boxed value is compared through `valueOf`. A plain object that happens
// to have one is still a plain object.
test('partialDeepStrictEqual, boxed value, custom valueOf', (t) => {
  t.exception(
    () => assert.partialDeepStrictEqual({ valueOf: () => 0 }, new Number(0), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ valueOf: () => true }, new Boolean(true), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Number(0), { valueOf: () => 0 }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ valueOf: () => 'ab' }, new String('ab'), 'should fail'),
    /should fail/
  )

  t.execution(() => {
    const valueOf = () => 0

    assert.partialDeepStrictEqual({ valueOf, foo: 1 }, { valueOf })
  })
})

test('partialDeepStrictEqual, boxed value, without internal slot', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(Object.create(Number.prototype), Object.create(Number.prototype))
  )

  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(Object.create(Number.prototype), new Number(1), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(new Number(1), Object.create(Number.prototype), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(Object.create(String.prototype), new String(''), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(
        Object.create(Boolean.prototype),
        new Boolean(false),
        'should fail'
      ),
    /should fail/
  )
  t.exception.all(
    () =>
      assert.partialDeepStrictEqual(
        { foo: Object.create(Number.prototype) },
        { foo: new Number(1) },
        'should fail'
      ),
    /should fail/
  )
})

// Inheriting from a box prototype is not what makes a value boxed, so supplying
// the `valueOf` the prototype cannot serve does not make one either.
test('partialDeepStrictEqual, boxed value, borrowed prototype', (t) => {
  const borrow = (prototype, value) => {
    const borrowed = Object.create(prototype)

    borrowed.valueOf = () => value

    return borrowed
  }

  t.exception(
    () => assert.partialDeepStrictEqual(borrow(Number.prototype, 1), new Number(1), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(borrow(String.prototype, ''), new String(''), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { foo: borrow(Number.prototype, 1) },
        { foo: new Number(1) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(() => {
    const borrowed = { valueOf: () => 1 }

    Object.setPrototypeOf(borrowed, Number.prototype)

    assert.partialDeepStrictEqual(borrowed, new Number(1), 'should fail')
  }, /should fail/)
  t.exception(
    () => assert.partialDeepStrictEqual(new Number(1), borrow(Number.prototype, 1), 'should fail'),
    /should fail/
  )

  t.execution(() => assert.partialDeepStrictEqual(new Number(1), new Number(1)))
})

test('partialDeepStrictEqual, boxed value, forged tag', (t) => {
  const tagged = (tag, properties = {}) => ({ [Symbol.toStringTag]: tag, ...properties })

  t.execution(() => assert.partialDeepStrictEqual(tagged('Number'), tagged('Number')))
  t.execution(() => assert.partialDeepStrictEqual(tagged('String'), tagged('String')))
  t.execution(() => assert.partialDeepStrictEqual(tagged('Boolean'), tagged('Boolean')))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      tagged('Number', { foo: 1, bar: 2 }),
      tagged('Number', { foo: 1 })
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual({ foo: tagged('Number') }, { foo: tagged('Number') })
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(new Set([tagged('Number')]), new Set([tagged('Number')]))
  )
  t.execution(() => assert.partialDeepStrictEqual(tagged('Object'), tagged('Object')))
  t.execution(() => assert.partialDeepStrictEqual(tagged('Custom'), tagged('Custom')))

  t.exception(
    () => assert.partialDeepStrictEqual(tagged('Number'), new Number(1), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Number(1), tagged('Number'), 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, boxed value, borrowed prototype and tag', (t) => {
  const borrowed = (properties = {}) => {
    const value = Object.create(Number.prototype)

    value[Symbol.toStringTag] = 'Number'

    return Object.assign(value, properties)
  }

  const boxed = (number) => Object.assign(new Number(number), { [Symbol.toStringTag]: 'Number' })

  t.execution(() => assert.partialDeepStrictEqual(borrowed(), borrowed()))

  t.exception.all(
    () => assert.partialDeepStrictEqual(borrowed(), boxed(1), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () => assert.partialDeepStrictEqual(boxed(1), borrowed(), 'should fail'),
    /should fail/
  )
  t.exception.all(
    () => assert.partialDeepStrictEqual({ foo: borrowed() }, { foo: boxed(1) }, 'should fail'),
    /should fail/
  )
  t.exception.all(
    () => assert.partialDeepStrictEqual(borrowed({ valueOf: () => 1 }), boxed(1), 'should fail'),
    /should fail/
  )

  t.execution(() => assert.partialDeepStrictEqual(boxed(1), boxed(1)))
  t.execution(() => {
    class Subclass extends Number {}

    const subclassed = new Subclass(1)

    subclassed[Symbol.toStringTag] = 'Number'

    assert.partialDeepStrictEqual(subclassed, boxed(1))
  })
})

// Whether a value carries a boxed primitive is settled by the value itself, not
// by which `valueOf` it happens to reach. An inherited one is no more its own
// than a borrowed prototype is.
test('partialDeepStrictEqual, boxed value, inherited valueOf', (t) => {
  const boxed = (number) => Object.assign(new Number(number), { [Symbol.toStringTag]: 'Number' })

  const inheriting = (number) => {
    const prototype = Object.create(Number.prototype)

    prototype.valueOf = () => number

    const value = Object.create(prototype)

    value[Symbol.toStringTag] = 'Number'

    return value
  }

  t.exception(
    () => assert.partialDeepStrictEqual(inheriting(1), boxed(1), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(boxed(1), inheriting(1), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ foo: inheriting(1) }, { foo: boxed(1) }, 'should fail'),
    /should fail/
  )

  t.execution(() => assert.partialDeepStrictEqual(inheriting(1), inheriting(1)))
  t.exception(
    () => assert.partialDeepStrictEqual(inheriting(2), boxed(1), 'should fail'),
    /should fail/
  )
})

// A boxed value keeps its own `valueOf` from being consulted, so carrying one
// changes nothing about the value it holds.
test('partialDeepStrictEqual, boxed value, own valueOf', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(Object.assign(new Number(1), { valueOf: () => 1 }), new Number(1))
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        Object.assign(new Number(1), { valueOf: () => 1 }),
        new Number(2),
        'should fail'
      ),
    /should fail/
  )
})

// Overriding `valueOf` does not change which primitive a box holds, so the
// comparison reads it through the intrinsic for the type and never calls the
// override at all.
test('partialDeepStrictEqual, boxed value, overridden valueOf', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      Object.assign(new Number(1), { valueOf: () => 99 }),
      new Number(1)
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      Object.assign(new String('ab'), { valueOf: () => 'zz' }),
      new String('ab')
    )
  )
  t.execution(() => {
    class Overriding extends Number {
      valueOf() {
        return 99
      }
    }

    assert.partialDeepStrictEqual(new Overriding(1), new Number(1))
  })

  t.exception(
    () => assert.partialDeepStrictEqual(new Number(1), new Number(2), 'should fail'),
    /should fail/
  )

  let reads = 0

  const counting = Object.assign(new Number(1), {
    valueOf() {
      reads++

      return 1
    }
  })

  t.execution(() => assert.partialDeepStrictEqual(counting, new Number(1)))
  t.is(reads, 0)
})

// Reading a value's `valueOf` is a side effect, and a value that holds no boxed
// primitive has no reason to be asked for one.
test('partialDeepStrictEqual, boxed value, valueOf is not consulted', (t) => {
  let reads = 0

  const prototype = Object.create(Number.prototype)

  prototype.valueOf = () => {
    reads++

    return 1
  }

  const value = Object.create(prototype)

  value[Symbol.toStringTag] = 'Number'

  const boxed = Object.assign(new Number(1), { [Symbol.toStringTag]: 'Number' })

  t.exception(() => assert.partialDeepStrictEqual(value, boxed, 'should fail'), /should fail/)

  t.is(reads, 0)
})

// A boxed value stays one however far it is subclassed.
test('partialDeepStrictEqual, boxed value, subclass', (t) => {
  class Direct extends Number {}

  class Middle extends Number {}

  class Indirect extends Middle {}

  t.execution(() => assert.partialDeepStrictEqual(new Direct(1), new Number(1)))
  t.execution(() => assert.partialDeepStrictEqual(new Number(1), new Direct(1)))
  t.execution(() => assert.partialDeepStrictEqual(new Indirect(1), new Number(1)))
  t.execution(() => assert.partialDeepStrictEqual(new Number(1), new Indirect(1)))
  t.execution(() => assert.partialDeepStrictEqual(new Indirect(1), new Direct(1)))

  t.exception(
    () => assert.partialDeepStrictEqual(new Direct(1), new Number(2), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Indirect(1), new Number(2), 'should fail'),
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

// Partial equality is not transitive, so matching entries greedily can consume
// the only entry a later expected entry could have matched.
test('partialDeepStrictEqual, map, ambiguous object keys', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([
        [{ a: 1 }, 0],
        [{ a: 1, b: 1, c: 1 }, 1],
        [{ a: 1, b: 1 }, 1],
        [{ a: 1 }, 0]
      ]),
      new Map([
        [{ b: 1 }, 1],
        [{ a: 1, b: 1, c: 1 }, 1],
        [{}, 0]
      ])
    )
  )

  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([
        [{ a: 1, c: 1 }, 0],
        [{ a: 1, b: 2 }, 0],
        [{ a: 1 }, 1],
        [{ a: 1, b: 1 }, 0]
      ]),
      new Map([
        [{ b: 1 }, 0],
        [{}, 0],
        [{ a: 1, c: 1 }, 0]
      ])
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Map([[{ a: 1 }, 'x']]),
        new Map([[{ a: 1 }, 'y']]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, map, ambiguous object keys, minimal', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([
        [{ a: 1 }, 1],
        [{ a: 1, b: 1 }, 1]
      ]),
      new Map([
        [{ a: 1 }, 1],
        [{ b: 1 }, 1]
      ])
    )
  )
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

test('partialDeepStrictEqual, set, ambiguous members', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([
        { a: 1, b: 1 },
        { a: 1, c: 1 },
        { a: 1, c: 1 },
        { a: 1, b: 2 }
      ]),
      new Set([{ a: 1, b: 2 }, { a: 1 }, { a: 1, b: 1 }])
    )
  )

  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([{ a: 2 }, { a: 1 }, { b: 1 }, { a: 1 }]),
      new Set([{ b: 1 }, {}, { a: 2 }])
    )
  )

  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([
        { a: 1, c: 1 },
        { a: 1, b: 2 },
        { a: 1, b: 2 },
        { a: 1, b: 1, c: 1 }
      ]),
      new Set([{ a: 1, b: 1 }, { a: 1 }, { a: 1, c: 1 }])
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Set([{ a: 1 }, { a: 1 }]),
        new Set([{ a: 1 }, { b: 1 }]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, set, ambiguous members, minimal', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([{ a: 1 }, { a: 1, b: 1 }]),
      new Set([{ a: 1 }, { b: 1 }])
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([{ b: 1 }, { a: 1, b: 1 }, { b: 1 }]),
      new Set([{ b: 1 }, { a: 1 }])
    )
  )
})

// Matching object members must not cost a factorial in the number of expected
// members. A pair that cannot be matched is the worst case, because every
// candidate ordering is tried before it gives up. Nine members is the point
// where that becomes impossible to miss: Node answers in a millisecond, and
// each further member multiplies the wait by the next integer. Every member
// here has the same shape, so no shortcut based on which key names appear can
// rule the pair out up front.
test('partialDeepStrictEqual, set, many object members', (t) => {
  const actual = new Set()
  const expected = new Set()

  for (let i = 0; i < 9; i++) actual.add({ foo: i })
  for (let i = 0; i < 8; i++) expected.add({ foo: i })

  expected.add({ foo: 'unmatchable' })

  const start = Date.now()

  t.exception(() => assert.partialDeepStrictEqual(actual, expected, 'should fail'), /should fail/)

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

// A member carrying a key name that appears nowhere in the actual set is the
// one shape that can be ruled out without matching anything.
test('partialDeepStrictEqual, set, many object members, disjoint keys', (t) => {
  const actual = new Set()
  const expected = new Set()

  for (let i = 0; i < 9; i++) actual.add({ foo: 1, index: i })
  for (let i = 0; i < 8; i++) expected.add({ foo: 1, other: i })

  expected.add({ unmatchable: true })

  const start = Date.now()

  t.exception(() => assert.partialDeepStrictEqual(actual, expected, 'should fail'), /should fail/)

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

// Members that all match one another leave nothing to narrow the search by, so
// only a matching that remembers the pairings it has already ruled out stays
// affordable. Every further member multiplies the wait by the next integer.
test('partialDeepStrictEqual, set, many matching object members', (t) => {
  const actual = new Set()
  const expected = new Set()

  for (let i = 0; i < 11; i++) actual.add({ foo: 1 })
  for (let i = 0; i < 10; i++) expected.add({ foo: 1 })

  expected.add({ bar: 1 })

  const start = Date.now()

  t.exception(() => assert.partialDeepStrictEqual(actual, expected, 'should fail'), /should fail/)

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

// Map entries are matched the same way and cost the same, on their keys.
test('partialDeepStrictEqual, map, many object keys', (t) => {
  const actual = new Map()
  const expected = new Map()

  for (let i = 0; i < 7; i++) actual.set({ foo: 1, index: i }, 1)
  for (let i = 0; i < 6; i++) expected.set({ foo: 1, other: i }, 1)

  expected.set({ unmatchable: true }, 1)

  const start = Date.now()

  t.exception(() => assert.partialDeepStrictEqual(actual, expected, 'should fail'), /should fail/)

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

// Noticing that one member matches nothing is easy. The cost lives in the pairs
// where every member matches something and the members still cannot all be
// matched at once, which is what a matching has to decide. Here eleven members
// compete for ten candidates.
test('partialDeepStrictEqual, set, more members than candidates', (t) => {
  const actual = new Set()
  const expected = new Set()

  for (let i = 0; i < 10; i++) actual.add({ foo: 1 })

  actual.add({ bar: 1 })

  for (let i = 0; i < 11; i++) expected.add({ foo: 1 })

  const start = Date.now()

  t.exception(() => assert.partialDeepStrictEqual(actual, expected, 'should fail'), /should fail/)

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

// Counting members against candidates settles the case where the shortfall is
// visible across the whole pair. Here it is not: every member matches
// something, every candidate is wanted by someone, and only three of the
// members compete over the same two candidates. Deciding that is the matching's
// job, and the members that match anything come first, so each attempt reaches
// the conflict last.
test('partialDeepStrictEqual, set, more members than candidates, in part', (t) => {
  const actual = new Set()
  const expected = new Set()

  for (let i = 0; i < 2; i++) actual.add({ foo: 1 })
  for (let i = 0; i < 9; i++) actual.add({ bar: 1 })

  for (let i = 0; i < 8; i++) expected.add({})
  for (let i = 0; i < 3; i++) expected.add({ foo: 1 })

  const start = Date.now()

  t.exception(() => assert.partialDeepStrictEqual(actual, expected, 'should fail'), /should fail/)

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

// Here every member matches exactly six candidates, so taking the most
// constrained member first cannot tell them apart either, and every candidate
// is wanted by someone. The shortfall is still confined to the seven members
// that share the same six candidates.
test('partialDeepStrictEqual, set, more members than candidates, same weight', (t) => {
  const width = 6
  const spread = 6
  const spreadCandidates = spread + 1

  const candidates = []

  for (let i = 0; i < width; i++) candidates.push({ shared: 1 })
  for (let i = 0; i < spreadCandidates; i++) candidates.push({})

  for (let i = 0; i < spread; i++) {
    for (let j = 0; j < width; j++) {
      candidates[width + ((i + j) % spreadCandidates)]['spread' + i] = 1
    }
  }

  const actual = new Set(candidates)
  const expected = new Set()

  for (let i = 0; i < spread; i++) expected.add({ ['spread' + i]: 1 })
  for (let i = 0; i <= width; i++) expected.add({ shared: 1 })

  const start = Date.now()

  t.exception(() => assert.partialDeepStrictEqual(actual, expected, 'should fail'), /should fail/)

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

// A member that refers to itself must not send the comparison down forever.
test('partialDeepStrictEqual, set, recursive array member', (t) => {
  const selfReferential = () => {
    const list = []

    list.push(list)

    return list
  }

  const shared = selfReferential()

  t.execution(() => assert.partialDeepStrictEqual(new Set([shared]), new Set([shared])))
  t.execution(() =>
    assert.partialDeepStrictEqual(new Set([selfReferential()]), new Set([selfReferential()]))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([[selfReferential(), 1]]),
      new Map([[selfReferential(), 1]])
    )
  )
  t.execution(() => assert.partialDeepStrictEqual(selfReferential(), selfReferential()))
})

// A partial element match ignores position, so the indexes an expected array
// carries need not be the indexes the actual one carries.
test('partialDeepStrictEqual, set, sparse array member', (t) => {
  const sparse = (index, value) => {
    const list = []

    list[index] = value

    return list
  }

  t.execution(() => assert.partialDeepStrictEqual(new Set([sparse(1, 'x')]), new Set([['x']])))
  t.execution(() => assert.partialDeepStrictEqual(new Set([sparse(2, 'x')]), new Set([['x']])))
  t.execution(() =>
    assert.partialDeepStrictEqual(new Map([[sparse(1, 'x'), 1]]), new Map([[['x'], 1]]))
  )
  t.execution(() => assert.partialDeepStrictEqual(new Set([['x', 'y']]), new Set([['y']])))

  t.exception(
    () => assert.partialDeepStrictEqual(new Set([sparse(1, 'x')]), new Set([['y']]), 'should fail'),
    /should fail/
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

// Which indexes the element match consumed has to survive descending into an
// element, or the indexes get compared a second time by position.
test('partialDeepStrictEqual, array, object elements', (t) => {
  t.execution(() => assert.partialDeepStrictEqual([{ foo: 1 }, { bar: 2 }], [{ bar: 2 }]))
  t.execution(() => assert.partialDeepStrictEqual([{ bar: 2 }, { foo: 1 }], [{ bar: 2 }]))
  t.execution(() => assert.partialDeepStrictEqual([{ foo: 1 }, { bar: 2, baz: 3 }], [{ bar: 2 }]))
  t.execution(() => assert.partialDeepStrictEqual([[9], [1, 2]], [[1]]))
  t.execution(() =>
    assert.partialDeepStrictEqual([{ foo: 1 }, { bar: 2 }], [{ foo: 1 }, { bar: 2 }])
  )
  t.execution(() =>
    assert.partialDeepStrictEqual([{ foo: 1 }, { bar: 2 }, { baz: 3 }], [{ foo: 1 }, { baz: 3 }])
  )

  t.exception(
    () => assert.partialDeepStrictEqual([{ foo: 1 }, { bar: 2 }], [{ baz: 3 }], 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        [{ bar: 2 }, { foo: 1 }],
        [{ foo: 1 }, { bar: 2 }],
        'should fail'
      ),
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

  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Error('message', { cause: 'boom' }),
      new Error('message', { cause: undefined })
    )
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

// An `undefined` property on the expected error is not compared, but an own
// `cause` still has to be present on both sides.
test('partialDeepStrictEqual, error, undefined property', (t) => {
  const message = new Error('message')
  message.message = undefined

  const name = new Error('message')
  name.name = undefined

  t.execution(() => assert.partialDeepStrictEqual(new Error('message'), message))
  t.exception(
    () => assert.partialDeepStrictEqual(new Error('message'), name, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Error('message'), new Error('other'), 'should fail'),
    /should fail/
  )
})

// Only `undefined` means the property is not compared. Every other falsy
// message is a message.
test('partialDeepStrictEqual, error, falsy message', (t) => {
  const withMessage = (value) => {
    const err = new Error('message')

    err.message = value

    return err
  }

  t.exception(
    () => assert.partialDeepStrictEqual(new Error('message'), withMessage(0), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Error('message'), withMessage(false), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Error('message'), withMessage(null), 'should fail'),
    /should fail/
  )

  t.execution(() => assert.partialDeepStrictEqual(new Error('message'), withMessage('')))
  t.execution(() => assert.partialDeepStrictEqual(new Error('message'), withMessage(undefined)))
})

// An empty string stands for "not compared" on `message` alone. On the other
// error properties it is a value like any other.
test('partialDeepStrictEqual, error, empty property', (t) => {
  const hidden = (value, key, property) => {
    Object.defineProperty(value, key, { value: property, enumerable: false, configurable: true })

    return value
  }

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Error('message'),
        hidden(new Error('message'), 'name', ''),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Error('message', { cause: 'boom' }),
        new Error('message', { cause: '' }),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new AggregateError([new Error('inner')], 'message'),
        hidden(new AggregateError([], 'message'), 'errors', ''),
        'should fail'
      ),
    /should fail/
  )

  t.execution(() => assert.partialDeepStrictEqual(new Error(''), new Error('')))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Error('message', { cause: '' }),
      new Error('message', { cause: '' })
    )
  )
})

test('partialDeepStrictEqual, error, undefined property, non-enumerable', (t) => {
  const hidden = (value, key) => {
    Object.defineProperty(value, key, { value: undefined, enumerable: false, configurable: true })

    return value
  }

  t.execution(() =>
    assert.partialDeepStrictEqual(new Error('message'), hidden(new Error('message'), 'name'))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(new Error('message'), hidden(new Error('message'), 'errors'))
  )
})

test('partialDeepStrictEqual, error, aggregate error', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(new AggregateError([new Error()]), new AggregateError([]))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new AggregateError([new Error('a'), new Error('b')], 'message'),
      new AggregateError([new Error('b')], 'message')
    )
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

test('partialDeepStrictEqual, error, aggregate error, undefined errors', (t) => {
  const expected = new AggregateError([], 'message')
  expected.errors = undefined

  t.execution(() =>
    assert.partialDeepStrictEqual(new AggregateError([new Error('inner')], 'message'), expected)
  )
})

test('partialDeepStrictEqual, typed array', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array([1, 2, 3, 5]))
  )
})

// A shorter expected typed array is matched against the bytes of the actual
// one, not against its elements.
test('partialDeepStrictEqual, typed array, byte subsequence', (t) => {
  t.execution(() => assert.partialDeepStrictEqual(new Uint16Array([3, 1]), new Uint16Array([0])))
  t.execution(() =>
    assert.partialDeepStrictEqual(new Float64Array([0, 3, 2]), new Float64Array([0, 0]))
  )
  t.execution(() => assert.partialDeepStrictEqual(new Uint16Array([1, 2, 3]), new Uint16Array([2])))

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Uint16Array([1, 2]),
        new Uint16Array([2, 1]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, typed array, differing type', (t) => {
  t.execution(() => assert.partialDeepStrictEqual(new Uint8Array([1, 2, 3]), Buffer.from([1])))
  t.execution(() => assert.partialDeepStrictEqual(Buffer.from([1, 2, 3]), new Uint8Array([1])))

  t.exception(
    () => assert.partialDeepStrictEqual(new Uint8Array([1, 2]), new Int8Array([1]), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(new Uint8Array([1, 2]), new Uint16Array([1]), 'should fail'),
    /should fail/
  )
})

// The byte indexes a typed array matched are its own, and must not go on to
// excuse a mismatch in whatever is compared next.
test('partialDeepStrictEqual, typed array, sibling values', (t) => {
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { foo: new Uint8Array([1]), bar: { 0: 'a' } },
        { foo: new Uint8Array([1]), bar: { 0: 'b' } },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ bar: { 0: 'a' } }, { bar: { 0: 'b' } }, 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { foo: Buffer.from([1]), bar: { 0: 'a' } },
        { foo: Buffer.from([1]), bar: { 0: 'b' } },
        'should fail'
      ),
    /should fail/
  )

  t.execution(() =>
    assert.partialDeepStrictEqual(
      { foo: new Uint8Array([1, 2]), bar: [{ baz: 1 }, { qux: 2 }] },
      { foo: new Uint8Array([1, 2]), bar: [{ qux: 2 }] }
    )
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

test('partialDeepStrictEqual, dataview', (t) => {
  const dataView = (bytes, offset, length) => {
    const { buffer } = new Uint8Array(bytes)

    return length === undefined ? new DataView(buffer) : new DataView(buffer, offset, length)
  }

  t.execution(() => assert.partialDeepStrictEqual(dataView([1, 2]), dataView([1, 2])))
  t.execution(() => assert.partialDeepStrictEqual(dataView([1, 2, 3]), dataView([3])))
  t.execution(() => assert.partialDeepStrictEqual(dataView([1, 2]), dataView([])))
  t.execution(() =>
    assert.partialDeepStrictEqual(dataView([1, 2, 3, 4]), dataView([9, 2, 3, 9], 1, 2))
  )

  t.exception(
    () => assert.partialDeepStrictEqual(dataView([1, 2]), dataView([3]), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(dataView([1]), dataView([1, 2]), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(dataView([1, 2, 3]), dataView([3, 1]), 'should fail'),
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

// Only canonical array indexes are covered by the element comparison. Every
// other digit-like key is an ordinary property and has to match.
test('partialDeepStrictEqual, array, non-index keys', (t) => {
  t.exception(
    () => assert.partialDeepStrictEqual([1, 2, 3], Object.assign([], { '01': 5 }), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual([1, 2, 3], Object.assign([], { 4294967295: 5 }), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual([1, 2, 3], Object.assign([], { 4294967296: 5 }), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        Object.assign([1, 2], { '01': 5 }),
        Object.assign([1], { '01': 6 }),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Uint8Array([1, 2, 3]),
        Object.assign(new Uint8Array([1]), { '01': 5 }),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual([1, 2, 3], Object.assign([], { foo: 5 }), 'should fail'),
    /should fail/
  )

  t.execution(() =>
    assert.partialDeepStrictEqual(
      Object.assign([1, 2], { '01': 5 }),
      Object.assign([1], { '01': 5 })
    )
  )
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
// The cases below are adapted from
// https://github.com/nodejs/node/blob/main/test/parallel/test-assert-partial-deep-equal.js
// Cases relying on `vm` realms, `node:crypto` or `File`/`Blob` have no
// equivalent here and are not carried over.

test('partialDeepStrictEqual, missing operand', (t) => {
  t.exception(
    () => assert.partialDeepStrictEqual({ a: 1 }, undefined, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(undefined, { a: 1 }, 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, primitives', (t) => {
  const sym = Symbol('test')

  t.execution(() => assert.partialDeepStrictEqual(1, 1))
  t.execution(() => assert.partialDeepStrictEqual('foo', 'foo'))
  t.execution(() => assert.partialDeepStrictEqual('1', '1'))
  t.execution(() => assert.partialDeepStrictEqual(false, false))
  t.execution(() => assert.partialDeepStrictEqual(null, null))
  t.execution(() => assert.partialDeepStrictEqual(undefined, undefined))
  t.execution(() => assert.partialDeepStrictEqual(sym, sym))
  t.execution(() => assert.partialDeepStrictEqual(NaN, NaN))
})

test('partialDeepStrictEqual, negative zero', (t) => {
  t.exception(() => assert.partialDeepStrictEqual(0, -0, 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual([0], [-0], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual([-0], [0], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual([0, 0, 0], [0, -0], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual(['-0'], [-0], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual([-0], ['-0'], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual(['0'], [0], 'should fail'), /should fail/)
  t.exception(() => assert.partialDeepStrictEqual([0], ['0'], 'should fail'), /should fail/)

  t.execution(() => assert.partialDeepStrictEqual([0], [0]))
  t.execution(() => assert.partialDeepStrictEqual([-0], [-0]))
  t.execution(() => assert.partialDeepStrictEqual([0, -0, 0], [0, 0]))
})

test('partialDeepStrictEqual, object, values', (t) => {
  const nested = () => ({ level1: { level2: { level3: 'deepValue' } } })
  const many = (offset) =>
    Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, i + offset]))

  t.execution(() => assert.partialDeepStrictEqual({ a: 1, b: 'string' }, { a: 1, b: 'string' }))
  t.execution(() => assert.partialDeepStrictEqual({ a: 1, b: 'string' }, { b: 'string', a: 1 }))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { a: { nested: { property: true, some: 'other' } } },
      { a: { nested: { property: true } } }
    )
  )
  t.execution(() => assert.partialDeepStrictEqual(nested(), nested()))
  t.execution(() => assert.partialDeepStrictEqual(many(0), many(0)))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { num: 1, str: 'test', bool: true, sym: Symbol.for('test') },
      { num: 1, str: 'test', bool: true, sym: Symbol.for('test') }
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual({ a: 1, b: 'string' }, { a: 2, b: 'string' }, 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        nested(),
        { level1: { level2: { level3: 'differentValue' } } },
        'should fail'
      ),
    /should fail/
  )
  t.exception(() => assert.partialDeepStrictEqual(many(0), many(1), 'should fail'), /should fail/)
  t.exception(
    () => assert.partialDeepStrictEqual({ a: 1, b: 2, c: 3 }, { b: '2' }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ a: [1, 2, 3] }, { a: [1, 2, 4] }, 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, object, property kinds', (t) => {
  const func = () => {}
  const sym = Symbol('test')

  t.execution(() => assert.partialDeepStrictEqual({ [sym]: 'symbol' }, { [sym]: 'symbol' }))
  t.execution(() => assert.partialDeepStrictEqual({ pattern: /abc/ }, { pattern: /abc/ }))
  t.execution(() => assert.partialDeepStrictEqual({ fn: func }, { fn: func }))
  t.execution(() =>
    assert.partialDeepStrictEqual({ buf: Buffer.from('Node.js') }, { buf: Buffer.from('Node.js') })
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { [Symbol('test')]: 'symbol' },
        { [Symbol('test')]: 'symbol' },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ pattern: /abc/ }, { pattern: /def/ }, 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual({ fn: () => {} }, { fn: () => {} }, 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, object, property enumerability', (t) => {
  const withGetter = () => {
    let value = 'test'

    return Object.defineProperty({}, 'prop', {
      get: () => value,
      set: (newValue) => {
        value = newValue
      },
      enumerable: true,
      configurable: true
    })
  }

  const withHidden = () => Object.defineProperty({}, 'hidden', { value: 'secret' })

  t.execution(() => assert.partialDeepStrictEqual(withGetter(), withGetter()))
  t.execution(() => assert.partialDeepStrictEqual(withHidden(), withHidden()))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { __proto__: null, prop: 'value' },
      { __proto__: null, prop: 'value' }
    )
  )
})

test('partialDeepStrictEqual, array, elements', (t) => {
  t.execution(() => assert.partialDeepStrictEqual([1, 'two', true], [1, 'two', true]))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      [
        {
          foo: 'yarp',
          nope: {
            bar: '123',
            a: [1, 2, 0],
            c: {},
            b: [
              { foo: 'yarp', nope: { bar: '123', a: [1, 2, 0], c: {}, b: [] } },
              { foo: 'yarp', nope: { bar: '123', a: [1, 2, 1], c: {}, b: [] } }
            ]
          }
        }
      ],
      [
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
    )
  )

  t.exception(
    () => assert.partialDeepStrictEqual([1, 'two'], [1, 'two', true], 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual([1, 'two', true], [1, 'two', false], 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        [1, 2, 2, 2, 2, 2, 2, 3],
        [1, 2, 2, 2, 2, 2, 2, 2],
        'should fail'
      ),
    /should fail/
  )
  t.exception(() => assert.partialDeepStrictEqual([1, 2, 3], ['2'], 'should fail'), /should fail/)
})

test('partialDeepStrictEqual, array, extra properties', (t) => {
  const withSymbols = () => {
    const array = [1, 2, 3]

    array[Symbol.for('abc')] = 'test'
    array[Symbol.for('test')] = 'test'

    Object.defineProperty(array, Symbol.for('hidden'), { value: 'hidden' })

    return array
  }

  const withProperties = () => {
    const array = [1, 2, 3]

    array.alsoIgnored = [{ nested: { property: true } }]
    array.extra = 'test'
    array.ignored = 'test'

    return array
  }

  const expectedSymbol = () => {
    const array = [1, 2, 3]

    array[Symbol.for('test')] = 'test'

    return array
  }

  const expectedProperty = () => {
    const array = [1, 2, 3]

    array.extra = 'test'

    Object.defineProperty(array, 'ignored', { enumerable: false })
    Object.defineProperty(array, Symbol.for('hidden'), { value: 'hidden' })

    return array
  }

  t.execution(() => assert.partialDeepStrictEqual(withSymbols(), expectedSymbol()))
  t.execution(() => assert.partialDeepStrictEqual(withProperties(), expectedProperty()))

  t.exception(() => {
    const actual = [1, 2, 3]
    const expected = [1, 2, 3]

    actual[Symbol.for('test')] = 'test'
    expected[Symbol.for('test')] = 'different'

    assert.partialDeepStrictEqual(actual, expected, 'should fail')
  }, /should fail/)
  t.exception(() => {
    const actual = [1, 2, 3]
    const expected = [1, 2, 3]

    actual.extra = 'test'
    expected.extra = 'different'

    assert.partialDeepStrictEqual(actual, expected, 'should fail')
  }, /should fail/)
  t.exception(() => {
    const actual = [1, 2, 3]

    actual[Symbol.for('abc')] = 'test'
    actual[Symbol.for('other')] = 'test'

    Object.defineProperty(actual, Symbol.for('test'), { value: 'test' })

    assert.partialDeepStrictEqual(actual, expectedSymbol(), 'should fail')
  }, /should fail/)
  t.exception(() => {
    const actual = [1, 2, 3]

    actual.alsoIgnored = [{ nested: { property: true } }]
    actual.ignored = 'test'

    Object.defineProperty(actual, 'extra', { value: 'test' })

    const expected = [1, 2, 3]

    expected.extra = 'test'

    assert.partialDeepStrictEqual(actual, expected, 'should fail')
  }, /should fail/)
})

test('partialDeepStrictEqual, array, sparse elements', (t) => {
  const identical = () => {
    const array = new Array(100)

    array[1] = 2

    return array
  }

  t.execution(() => assert.partialDeepStrictEqual(new Array(1000), new Array(100)))
  t.execution(() => assert.partialDeepStrictEqual(identical(), identical()))

  t.exception(() => {
    const actual = new Array(1000)

    actual[90] = 1
    actual[92] = 2
    actual[95] = 1
    actual[96] = 2
    actual.foo = 'bar'
    actual.extra = 'test'

    const expected = new Array(1000)

    expected[90] = 1
    expected[92] = 1
    expected[95] = 1
    expected.extra = 'test'
    expected.foo = 'bar'

    assert.partialDeepStrictEqual(actual, expected, 'should fail')
  }, /should fail/)
  t.exception(() => {
    const actual = new Array(1000)

    actual[90] = 1
    actual[92] = 1

    const expected = new Array(1000)

    expected[90] = 1
    expected[92] = 1
    expected[95] = 1

    assert.partialDeepStrictEqual(actual, expected, 'should fail')
  }, /should fail/)
})

// A sparse array holds far fewer elements than its length, and only the ones it
// holds have to be looked at. The lengths are smaller than the ones upstream
// uses, which is still enough to tell the two apart: walking every index takes
// seconds, while reaching only for the handful of elements present takes well
// under a tenth of a second.
test('partialDeepStrictEqual, array, sparse elements, cost', (t) => {
  const actual = new Array(10_000_000)

  actual[0] = 1
  actual[1] = 2
  actual[100] = 100n
  actual[200_000] = 3
  actual[1_200_000] = 4
  actual[9_999_999] = []

  const expected = new Array(6_000_000)

  expected[0] = 1
  expected[1] = 2
  expected[200_000] = 3
  expected[1_200_000] = 4

  const start = Date.now()

  t.execution(() => assert.partialDeepStrictEqual(actual, expected))

  const elapsed = Date.now() - start

  t.ok(elapsed < 200, `compared in ${elapsed}ms`)
})

test('partialDeepStrictEqual, array, object elements, subset', (t) => {
  t.execution(() => assert.partialDeepStrictEqual([{ a: 5 }], [{ a: 5 }]))
  t.execution(() => assert.partialDeepStrictEqual([{ a: 5 }, { b: 5 }], [{ a: 5 }]))
})

test('partialDeepStrictEqual, circular references', (t) => {
  const x = ['x']

  const circular = () => {
    const obj = {}

    obj.self = obj
    obj.set = new Set([x, ['y']])

    return obj
  }

  t.execution(() => assert.partialDeepStrictEqual(circular(), circular()))
})

test('partialDeepStrictEqual, date', (t) => {
  t.execution(() => assert.partialDeepStrictEqual(new Date(0), new Date(0)))

  t.exception(
    () => assert.partialDeepStrictEqual(new Date(0), new Date(1), 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, weak collections', (t) => {
  t.exception(
    () => assert.partialDeepStrictEqual(new WeakSet(), new WeakSet(), 'should fail'),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new WeakMap(), new WeakMap(), 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, url', (t) => {
  t.execution(() => assert.partialDeepStrictEqual(new URL('http://foo'), new URL('http://foo')))

  t.exception(
    () =>
      assert.partialDeepStrictEqual(new URL('http://foo'), new URL('http://bar'), 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, map, entries', (t) => {
  const pair = () =>
    new Map([
      ['key1', 'value1'],
      ['key2', 'value2']
    ])

  t.execution(() => assert.partialDeepStrictEqual(pair(), pair()))
  t.execution(() => assert.partialDeepStrictEqual(pair(), new Map([['key1', 'value1']])))
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([
        ['key1', { nested: { property: true } }],
        ['key2', new Set([1, 2, 3])],
        ['key3', new Uint8Array([1, 2, 3])]
      ]),
      new Map([
        ['key1', { nested: { property: true } }],
        ['key2', new Set([1, 2, 3])],
        ['key3', new Uint8Array([1, 2, 3])]
      ])
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        pair(),
        new Map([
          ['key1', 'value1'],
          ['key3', 'value3']
        ]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        pair(),
        new Map([
          ['key1', 'value1'],
          ['key3', 'value2']
        ]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        pair(),
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
          ['key3', 'value3']
        ]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, map, nested', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      {
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
      { a: { z: [1, 2, 3], b: { c: new Map([['key1', 'value1']]) } } }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([
        [
          'key1',
          new Map([
            ['nestedKey1', 'nestedValue1'],
            ['nestedKey2', 'nestedValue2']
          ])
        ],
        ['key2', 'value2']
      ]),
      new Map([['key1', new Map([['nestedKey1', 'nestedValue1']])]])
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Map([
        ['key1', ['value1', 'value2']],
        ['key2', 'value2']
      ]),
      new Map([['key1', ['value1', 'value2']]])
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Map([
          ['key1', ['value1', 'value2']],
          ['key2', 'value2']
        ]),
        new Map([['key1', ['value3']]]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, map, object keys, unmatched', (t) => {
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Map([
          [{ a: 1 }, 'value1'],
          [{ b: 2 }, 'value2'],
          [{ b: 2 }, 'value4']
        ]),
        new Map([
          [{ a: 1 }, 'value1'],
          [{ b: 2 }, 'value3']
        ]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Map([
          [{ a: 1 }, 'value1'],
          [{ b: 1 }, 'value2'],
          [{ a: 1 }, 'value1']
        ]),
        new Map([
          [{ a: 1 }, 'value1'],
          [{ a: 1 }, 'value1'],
          [{ a: 1 }, 'value1']
        ]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Map([
          [{ a: 2 }, 1],
          [1, 1],
          [{ b: 1 }, 1],
          [[], 1],
          [2, 1],
          [{ a: 1 }, 1]
        ]),
        new Map([
          [{ a: 1 }, 1],
          [[], 1],
          [2, 1],
          [{ a: 1 }, 1]
        ]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, set, members', (t) => {
  t.execution(() => assert.partialDeepStrictEqual(new Set([{ a: 1 }]), new Set([{ a: 1 }])))
  t.execution(() =>
    assert.partialDeepStrictEqual(new Set(['value1', 'value2']), new Set(['value1', 'value2']))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set(['value1', 'value2', 'value3']),
      new Set(['value1', 'value2'])
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Set([{ a: 1 }]),
        new Set([{ a: 1 }, { b: 1 }]),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Set(['value1', 'value2']),
        new Set(['value1', 'value3']),
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Set([{ a: 1 }, { a: 2 }, { a: 1 }, { a: 2 }]),
        new Set([{ a: 1 }, { a: 2 }, { a: 1 }, { a: 1 }]),
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, set, mixed members', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([{ b: 1 }, [], 1, { a: 1 }, 2, []]),
      new Set([{ a: 1 }, 2, []])
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([{ a: 1 }, 1, { b: 1 }, [], 2, { a: 1 }]),
      new Set([{ a: 1 }, [], 2, { a: 1 }])
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      new Set([{ a: 1 }, { a: 1 }, 1, { b: 1 }, [], 2, { a: 1 }]),
      new Set([{ a: 1 }, [], 2, { a: 1 }])
    )
  )
})

test('partialDeepStrictEqual, error, properties', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { error: new Error('Test error') },
      { error: new Error('Test error') }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { error: new Error('Test error 1', { cause: 42 }) },
      { error: new Error('Test error 1') }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { error: new Error('Test error 1', { cause: undefined }) },
      { error: new Error('Test error 1') }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual({ error: new Error('Test error 1') }, { error: new Error() })
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { error: new AggregateError([new Error(), 123]) },
      { error: new AggregateError([]) }
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { error: new Error('Test error 1') },
        { error: new Error('Test error 2') },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { error: new Error('Test error 1') },
        { error: new Error('Test error 1', { cause: 42 }) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { error: new Error('Test error 1') },
        { error: new Error('Test error 1', { cause: undefined }) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { error: new Error() },
        { error: new Error('Test error 1') },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { error: new AggregateError([], 'Test error 1') },
        { error: new AggregateError([new Error()], 'Test error 1') },
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, typed array, content', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { typedArray: new Int16Array([1, 2, 3, 4, 5]) },
      { typedArray: new Int16Array([1, 2, 3]) }
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { typedArray: new Uint8Array([1, 2, 3]) },
        { typedArray: new Uint8Array([4, 5, 6]) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { typedArray: new Uint8Array([1, 2, 3, 4, 5]) },
        { typedArray: new Uint8Array([1, 333, 2, 4]) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () => assert.partialDeepStrictEqual(new Int16Array(3), new Uint16Array(3), 'should fail'),
    /should fail/
  )
  t.exception(() => {
    const actual = new Uint8Array(3)
    const expected = new Uint8Array(3)

    actual[Symbol.for('test')] = 'test'
    expected[Symbol.for('test')] = 'different'

    assert.partialDeepStrictEqual(actual, expected, 'should fail')
  }, /should fail/)
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        new Float32Array([+0.0]),
        new Float32Array([-0.0]),
        'should fail'
      ),
    /should fail/
  )
})

// The element type a typed array holds is not something its tag or its
// prototype can speak for.
test('partialDeepStrictEqual, typed array, forged element type', (t) => {
  const spoofed = () => {
    const array = new Int8Array(10)

    Object.defineProperty(array, Symbol.toStringTag, { value: 'Uint8Array' })
    Object.setPrototypeOf(array, Uint8Array.prototype)

    return array
  }

  t.exception(
    () => assert.partialDeepStrictEqual(new Uint8Array(10), spoofed(), 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, arraybuffer, differing kind', (t) => {
  t.exception(
    () => assert.partialDeepStrictEqual(new ArrayBuffer(3), new Uint8Array(3), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(new ArrayBuffer(3), new SharedArrayBuffer(3), 'should fail'),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(new SharedArrayBuffer(3), new ArrayBuffer(3), 'should fail'),
    /should fail/
  )
})

test('partialDeepStrictEqual, dataview, views', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { dataView: new DataView(new ArrayBuffer(8), 0, 4) },
      { dataView: new DataView(new ArrayBuffer(8), 4, 4) }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { dataView: new DataView(new ArrayBuffer(8)) },
      { dataView: new DataView(new ArrayBuffer(8)) }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { dataView: new DataView(new ArrayBuffer(8), 0, 8) },
      { dataView: new DataView(new ArrayBuffer(8), 0, 8) }
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { dataView: new DataView(new ArrayBuffer(3)) },
        { dataView: new DataView(new ArrayBuffer(4)) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { dataView: new DataView(new ArrayBuffer(3)) },
        { dataView: new Uint8Array(3) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { dataView: new Uint8Array(3) },
        { dataView: new DataView(new ArrayBuffer(3)) },
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, SharedArrayBuffer, views', (t) => {
  t.execution(() =>
    assert.partialDeepStrictEqual(new SharedArrayBuffer(3), new SharedArrayBuffer(3))
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { typedArray: new Uint8Array(new SharedArrayBuffer(5)) },
      { typedArray: new Uint8Array(new SharedArrayBuffer(3)) }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { typedArray: new Int16Array(new SharedArrayBuffer(10)) },
      { typedArray: new Int16Array(new SharedArrayBuffer(6)) }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { typedArray: new SharedArrayBuffer(5) },
      { typedArray: new SharedArrayBuffer(3) }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { dataView: new DataView(new SharedArrayBuffer(8), 0, 4) },
      { dataView: new DataView(new SharedArrayBuffer(8), 4, 4) }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { dataView: new DataView(new SharedArrayBuffer(8)) },
      { dataView: new DataView(new SharedArrayBuffer(8)) }
    )
  )
  t.execution(() =>
    assert.partialDeepStrictEqual(
      { dataView: new DataView(new SharedArrayBuffer(8), 0, 8) },
      { dataView: new DataView(new SharedArrayBuffer(8), 0, 8) }
    )
  )

  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { typedArray: new Uint8Array(new SharedArrayBuffer(3)) },
        { typedArray: new Uint8Array(new SharedArrayBuffer(5)) },
        'should fail'
      ),
    /should fail/
  )
  t.exception(
    () =>
      assert.partialDeepStrictEqual(
        { typedArray: new SharedArrayBuffer(3) },
        { typedArray: new SharedArrayBuffer(5) },
        'should fail'
      ),
    /should fail/
  )
})

test('partialDeepStrictEqual, SharedArrayBuffer, content', (t) => {
  const filled = (length, last) => {
    const buffer = new SharedArrayBuffer(length * Int32Array.BYTES_PER_ELEMENT)
    const view = new Int32Array(buffer)

    view[0] = 1
    view[1] = 2
    view[2] = last

    return buffer
  }

  t.execution(() => {
    const actual = new SharedArrayBuffer(4 * Int32Array.BYTES_PER_ELEMENT)
    const view = new Int32Array(actual)

    view[0] = 1
    view[1] = 2
    view[2] = 3
    view[3] = 4

    assert.partialDeepStrictEqual(actual, filled(3, 3))
  })

  t.exception(
    () => assert.partialDeepStrictEqual(filled(4, 3), filled(4, 6), 'should fail'),
    /should fail/
  )
})

test('AssertionError', (t) => {
  const err = new assert.AssertionError({ actual: 1, expected: 2, operator: '==' })

  t.is(err.name, 'AssertionError')
  t.is(err.code, 'ASSERTION')
})

test('Hopcroft-karp', (t) => {
  t.is(
    hopcroftKarp([
      [0, 1],
      [0, 4],
      [2, 3],
      [0, 4],
      [1, 3]
    ]),
    true
  )
})
