import { describe, expect, it } from 'vitest'
import { findAllValidPairs, findFirstValidPair } from '../findPairs'

describe('Onet solver', () => {
  it('finds a straight line pair', () => {
    const board = [
      [1, 0, 1],
      [0, 0, 0],
    ]
    const first = findFirstValidPair(board)
    expect(first).not.toBeNull()
    expect(first?.from).toEqual({ row: 0, col: 0 })
    expect(first?.to).toEqual({ row: 0, col: 2 })
  })

  it('finds pair requiring one turn', () => {
    const board = [
      [2, 0, 0],
      [0, 0, 2],
    ]
    const first = findFirstValidPair(board)
    expect(first).not.toBeNull()
    expect(first?.value).toBe(2)
  })

  it('finds pair requiring border route', () => {
    const board = [
      [3, 9, 0, 3],
      [9, 9, 9, 9],
    ]
    const all = findAllValidPairs(board)
    expect(all.some((p) => p.value === 3)).toBe(true)
  })
})

