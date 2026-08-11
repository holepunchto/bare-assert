module.exports = function getEnumerableKeys(obj) {
  const keys = Object.keys(obj)

  for (const symbolKey of Object.getOwnPropertySymbols(obj)) {
    const { enumerable } = Object.getOwnPropertyDescriptor(obj, symbolKey)
    if (enumerable) keys.push(symbolKey)
  }

  return keys
}
