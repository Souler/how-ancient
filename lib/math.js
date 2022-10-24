/**
 * iterative mean implementation to prevent overflows
 * @see https://stackoverflow.com/a/1934266/18908709
 * @see https://www.heikohoffmann.de/htmlthesis/node134.html
 */
export function mean(values = []) {
  const avg = values.reduce((avg, value, idx) => {
    return avg + (value - avg) / (idx + 1)
  }, 0)

  return avg
}

export function median(values = []) {
  const sortedValues = [...values].sort()
  const medianIndex = Math.floor((sortedValues.length - 1 ) / 2)

  return values[medianIndex]
}
