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
