// https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm
module.exports = function hopcroftKarp(graph) {
  const distances = []

  const pairs = {
    u: new Array(graph.length).fill(null),

    v: graph.flat().reduce((acc, value) => {
      acc[value] = null

      return acc
    }, [])
  }

  let matching = 0

  function breadthFirstSearch() {
    const queue = []

    for (let u = 0; u < graph.length; u++) {
      if (pairs.u[u] === null) {
        distances[u] = 0
        queue.push(u)
      } else distances[u] = Infinity
    }

    distances[null] = Infinity

    while (queue.length > 0) {
      const u = queue.shift()

      if (distances[u] >= distances[null]) continue

      for (const v of graph[u]) {
        if (distances[pairs.v[v]] !== Infinity) continue

        distances[pairs.v[v]] = distances[u] + 1
        queue.push(pairs.v[v])
      }
    }

    return distances[null] !== Infinity
  }

  function depthFirstSearch(u) {
    if (u === null) return true

    for (const v of graph[u]) {
      if (distances[pairs.v[v]] !== distances[u] + 1) continue

      if (depthFirstSearch(pairs.v[v]) === false) continue

      pairs.v[v] = u
      pairs.u[u] = v

      return true
    }

    distances[u] = Infinity

    return false
  }

  while (breadthFirstSearch() === true) {
    for (let u = 0; u < pairs.u.length; u++) {
      if (pairs.u[u] !== null) continue

      if (depthFirstSearch(u) === true) matching++
    }
  }

  return matching === graph.length
}
