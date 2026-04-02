import type { BoardMatrix, Point } from './types'

const DIRS: Point[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

interface QueueNode {
  row: number
  col: number
  turns: number
  dirIndex: number
  path: Point[]
}

const inBounds = (board: BoardMatrix, row: number, col: number) =>
  row >= 0 && row < board.length && col >= 0 && col < board[0].length

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

export const canConnect = (board: BoardMatrix, from: Point, to: Point): Point[] | null => {
  if (from.row === to.row && from.col === to.col) return null
  if (board[from.row][from.col] === 0 || board[to.row][to.col] === 0) return null
  if (board[from.row][from.col] !== board[to.row][to.col]) return null

  const rows = board.length
  const cols = board[0].length
  const visitedTurns = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Array(4).fill(Number.POSITIVE_INFINITY)),
  )

  const queue: QueueNode[] = []
  for (let d = 0; d < DIRS.length; d += 1) {
    visitedTurns[from.row][from.col][d] = 0
    queue.push({ row: from.row, col: from.col, turns: 0, dirIndex: d, path: [from] })
  }

  let i = 0
  while (i < queue.length) {
    const node = queue[i]
    i += 1

    for (let nextDir = 0; nextDir < DIRS.length; nextDir += 1) {
      const turns = node.turns + (node.dirIndex === nextDir ? 0 : 1)
      if (turns > 2) continue

      let nr = node.row + DIRS[nextDir].row
      let nc = node.col + DIRS[nextDir].col

      while (inBounds(board, nr, nc)) {
        if (!(nr === to.row && nc === to.col) && board[nr][nc] !== 0) break

        if (turns <= visitedTurns[nr][nc][nextDir]) {
          visitedTurns[nr][nc][nextDir] = turns
          const nextPoint = { row: nr, col: nc }
          const nextPath = [...node.path, nextPoint]

          if (nr === to.row && nc === to.col) return nextPath

          queue.push({
            row: nr,
            col: nc,
            turns,
            dirIndex: nextDir,
            path: nextPath,
          })
        }

        nr += DIRS[nextDir].row
        nc += DIRS[nextDir].col
      }
    }
  }

  return null
}

