const test = require('brittle')
const assert = require('.')

test('basic', (t) => {
  t.exception(() => assert(false, 'should fail'), /should fail/)
  t.execution(() => assert(true, 'should pass'))
})
