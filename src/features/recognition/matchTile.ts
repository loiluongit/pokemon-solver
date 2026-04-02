import { templateCatalog } from './templateCatalog'

export interface TilePixels {
  data: Uint8ClampedArray
}

export interface MatchResult {
  id: number
  confidence: number
}

export const computeAverageRgb = (tile: TilePixels) => {
  let r = 0
  let g = 0
  let b = 0
  let px = 0

  for (let i = 0; i < tile.data.length; i += 4) {
    r += tile.data[i]
    g += tile.data[i + 1]
    b += tile.data[i + 2]
    px += 1
  }

  return { r: r / px, g: g / px, b: b / px }
}

export const isLikelyEmptyTile = (tile: TilePixels): boolean => {
  const { r, g, b } = computeAverageRgb(tile)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 12
}

export const matchTile = (tile: TilePixels): MatchResult => {
  if (isLikelyEmptyTile(tile)) {
    return { id: 0, confidence: 1 }
  }

  const avg = computeAverageRgb(tile)
  let bestId = 0
  let bestDist = Number.POSITIVE_INFINITY

  for (const tpl of templateCatalog) {
    const dist = Math.hypot(avg.r - tpl.avgR, avg.g - tpl.avgG, avg.b - tpl.avgB)
    if (dist < bestDist) {
      bestDist = dist
      bestId = tpl.id
    }
  }

  const confidence = Math.max(0, 1 - bestDist / 255)
  return { id: bestId, confidence }
}

