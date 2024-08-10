export function toSeconds (timestamp: number) {
  return parseInt(timestamp.toString().slice(0, 10))
}
