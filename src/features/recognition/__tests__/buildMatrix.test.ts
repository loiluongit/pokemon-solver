import { describe, expect, it } from 'vitest'
import { buildAverageRgbMatrixFromTiles, buildMatrixFromTiles } from '../buildMatrix'

const createTile = (row: number, col: number, r: number, g: number, b: number) => {
  const data = new Uint8ClampedArray(4 * 4 * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }
  return { row, col, imageData: { data } as ImageData }
}

describe('buildMatrixFromTiles', () => {
  it('converts tiles to matrix and confidence', () => {
    const tiles = [createTile(0, 0, 200, 140, 120), createTile(0, 1, 120, 120, 120)]
    const out = buildMatrixFromTiles(tiles, 1, 2)

    expect(out.matrix[0][0]).toBe(1)
    expect(out.matrix[0][1]).toBe(0)
    expect(out.confidence[0][0]).toBeGreaterThan(0.7)
  })
})

describe('buildAverageRgbMatrixFromTiles', () => {
  it('converts tile to average rgb triplet matrix', () => {
    const tiles = [createTile(0, 0, 255, 219, 249), createTile(0, 1, 120, 120, 120)]
    const out = buildAverageRgbMatrixFromTiles(tiles, 1, 2)

    expect(out.matrix[0][0]).toEqual({ r: 255, g: 219, b: 249 })
    expect(out.matrix[0][1]).toEqual({ r: 120, g: 120, b: 120 })
  })
})

