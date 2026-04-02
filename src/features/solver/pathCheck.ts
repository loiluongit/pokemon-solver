import type { BoardMatrix } from './types'


export const addPadding = (board: BoardMatrix): BoardMatrix => {
  const rows = board.length
  const cols = board[0].length
  const padded = Array.from({ length: rows + 2 }, () => Array(cols + 2).fill(0))

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      padded[r + 1][c + 1] = board[r][c]
    }
  }
  return padded
}
