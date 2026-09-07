// Implementation of: https://en.wikipedia.org/wiki/Steinhaus%E2%80%93Johnson%E2%80%93Trotter_algorithm

function nextSwap(indexes, directions, len) {
  let index = -1

  for (let i = 0; i < len; i++) {
    if (directions[i] === 0) continue

    if (index === -1 || indexes[i] > indexes[index]) index = i
  }

  return index
}

function swap(list, index, newIndex) {
  const temp = list[index]
  list[index] = list[newIndex]
  list[newIndex] = temp

  return list
}

function reflect(list, indexes, len) {
  const reflectedList = new Array(len)

  for (let i = 0; i < len; i++) reflectedList[i] = list[indexes[i]]

  return reflectedList
}

module.exports = function permute(list) {
  const len = list.length

  const indexes = new Array(len)
  indexes[0] = 0

  const directions = new Array(len)
  directions[0] = 0

  for (let i = 1; i < len; i++) {
    indexes[i] = i
    directions[i] = -1
  }

  const permutations = [reflect(list, indexes, len)]

  let index = nextSwap(indexes, directions, len)
  let direction = directions[index]

  while (index !== -1) {
    const newIndex = index + direction

    swap(indexes, index, newIndex)
    swap(directions, index, newIndex)

    permutations.push(reflect(list, indexes, len))

    if (
      newIndex === 0 ||
      newIndex === len - 1 ||
      indexes[newIndex + direction] > indexes[newIndex]
    ) {
      directions[newIndex] = 0
    }

    for (let i = 0; i < len; i++) {
      if (i === newIndex) continue

      if (indexes[i] > indexes[newIndex]) directions[i] = i < newIndex ? 1 : -1
    }

    index = nextSwap(indexes, directions, len)
    direction = directions[index]
  }

  return permutations
}
