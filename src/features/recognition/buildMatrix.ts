import { matchTile } from './matchTile'

export interface TileImage {
  row: number
  col: number
  imageData: ImageData
}

export interface MatrixBuildResult {
  matrix: number[][]
  confidence: number[][]
}

export interface RgbValue {
  r: number
  g: number
  b: number
}

export interface RgbMatrixBuildResult {
  matrix: RgbValue[][]
  confidence: number[][]
}

interface ColorCluster {
  label: string
  r: number
  g: number
  b: number
}

const toAlphabetLabel = (index: number): string => {
  let n = index
  let out = ''
  while (n >= 0) {
    out = String.fromCharCode((n % 26) + 65) + out
    n = Math.floor(n / 26) - 1
  }
  return out
}

export const tagRgbMatrix = (matrix: RgbValue[][], channelTolerance = 4): string[][] => {
  const labels = matrix.map((row) => row.map(() => ''))
  const clusters: ColorCluster[] = []

  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix[0].length; c += 1) {
      const value = matrix[r][c]
      if (value.r === 0 && value.g === 0 && value.b === 0) {
        labels[r][c] = ''
        continue
      }

      const matched = clusters.find(
        (k) =>
          Math.abs(value.r - k.r) <= channelTolerance &&
          Math.abs(value.g - k.g) <= channelTolerance &&
          Math.abs(value.b - k.b) <= channelTolerance,
      )

      if (matched) {
        labels[r][c] = matched.label
      } else {
        const label = toAlphabetLabel(clusters.length)
        clusters.push({ label, r: value.r, g: value.g, b: value.b })
        labels[r][c] = label
      }
    }
  }

  return labels
}

export const buildMatrixFromTiles = (
  tiles: TileImage[],
  rows: number,
  cols: number,
): MatrixBuildResult => {
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0))
  const confidence = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (const tile of tiles) {
    const result = matchTile({ data: tile.imageData.data })
    matrix[tile.row][tile.col] = result.id
    confidence[tile.row][tile.col] = result.confidence
  }

  return { matrix, confidence }
}

export const buildAverageRgbMatrixFromTiles = (
  tiles: TileImage[],
  rows: number,
  cols: number,
): RgbMatrixBuildResult => {
  const isEmptyTileRgb = (r: number, g: number, b: number) => {
    const max = Math.max(r, g, b)
    const avg = (r + g + b) / 3
    return max <= 35 && avg <= 22
  }

  const matrix = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ r: 0, g: 0, b: 0 })),
  )
  const confidence = Array.from({ length: rows }, () => Array(cols).fill(1))

  for (const tile of tiles) {
    const data = tile.imageData.data
    const width = tile.imageData.width
    const height = tile.imageData.height
    const border = 5
    const useInnerArea = width > border * 2 && height > border * 2
    const startX = useInnerArea ? border : 0
    const startY = useInnerArea ? border : 0
    const endX = useInnerArea ? width - border : width
    const endY = useInnerArea ? height - border : height
    let sumR = 0
    let sumG = 0
    let sumB = 0
    let px = 0

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const idx = (y * width + x) * 4
        sumR += data[idx]
        sumG += data[idx + 1]
        sumB += data[idx + 2]
        px += 1
      }
    }

    if (px === 0) {
      matrix[tile.row][tile.col] = { r: 0, g: 0, b: 0 }
      continue
    }

    const r = Math.round(sumR / px)
    const g = Math.round(sumG / px)
    const b = Math.round(sumB / px)
    matrix[tile.row][tile.col] = isEmptyTileRgb(r, g, b) ? { r: 0, g: 0, b: 0 } : { r, g, b }
  }

  return { matrix, confidence }
}

