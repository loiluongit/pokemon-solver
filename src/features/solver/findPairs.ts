import { addPadding, canConnect } from './pathCheck'
import type { BoardMatrix, Point, ValidPair } from './types'

const toPaddedPoint = (p: Point): Point => ({ row: p.row + 1, col: p.col + 1 })
const fromPaddedPoint = (p: Point): Point => ({ row: p.row - 1, col: p.col - 1 })

export const findAllValidPairs = (board: BoardMatrix): ValidPair[] => {
  console.log('findAllValidPairs', board.length, board[0].length)
  if (board.length === 0 || board[0].length === 0) return []
  const padded = addPadding(board)
  const pairs: ValidPair[] = []

  for (let r1 = 0; r1 < board.length; r1 += 1) {
    for (let c1 = 0; c1 < board[0].length; c1 += 1) {
      if (board[r1][c1] === 0) continue

      for (let r2 = r1; r2 < board.length; r2 += 1) {
        for (let c2 = 0; c2 < board[0].length; c2 += 1) {
          if (r2 === r1 && c2 <= c1) continue
          if (board[r2][c2] !== board[r1][c1]) continue

          const path = canConnect(padded, toPaddedPoint({ row: r1, col: c1 }), toPaddedPoint({ row: r2, col: c2 }))
          if (!path) continue

          pairs.push({
            from: { row: r1, col: c1 },
            to: { row: r2, col: c2 },
            value: board[r1][c1],
            path: path.map(fromPaddedPoint),
          })
        }
      }
    }
  }

  return pairs
}

export const findFirstValidPair = (board: BoardMatrix): ValidPair | null => {
  const pairs = findAllValidPairs(board)
  return pairs.length > 0 ? pairs[0] : null
}

