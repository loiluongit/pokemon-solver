import type { TileImage } from '../recognition/buildMatrix'

interface TileRect {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedTilesResult {
  tiles: TileImage[]
  rows: number
  cols: number
  detections: TileDetection[]
  frame: TileFrame
}

export interface TileDetection {
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
}

export interface TileFrame {
  x: number
  y: number
  width: number
  height: number
}

interface RgbColor {
  r: number
  g: number
  b: number
}

interface DetectColorConfig {
  target: RgbColor
  tolerance: number
}

const defaultColorConfig: DetectColorConfig = {
  // User-provided tile background color: #ffdbf9
  target: { r: 255, g: 219, b: 249 },
  tolerance: 34,
}

const iou = (a: TileRect, b: TileRect) => {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  if (x2 <= x1 || y2 <= y1) return 0
  const inter = (x2 - x1) * (y2 - y1)
  const union = a.width * a.height + b.width * b.height - inter
  return inter / union
}

const clusterAxis = (values: number[], tolerance: number): number[] => {
  if (values.length === 0) return []
  const sorted = [...values].sort((a, b) => a - b)
  const clusters: number[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i += 1) {
    if (Math.abs(sorted[i] - clusters[clusters.length - 1]) > tolerance) {
      clusters.push(sorted[i])
    } else {
      const prev = clusters[clusters.length - 1]
      clusters[clusters.length - 1] = (prev + sorted[i]) / 2
    }
  }
  return clusters
}

const nearestIndex = (value: number, refs: number[]) => {
  let best = 0
  let bestDist = Number.POSITIVE_INFINITY
  for (let i = 0; i < refs.length; i += 1) {
    const dist = Math.abs(value - refs[i])
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

export const detectOnetTiles = (canvas: HTMLCanvasElement): DetectedTilesResult | null => {
  const cv = window.cv as any
  if (!cv?.Mat) return null

  const src = cv.imread(canvas)
  const mask = new cv.Mat()
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U)

  try {
    const cfg = defaultColorConfig
    const lower = new cv.Mat(src.rows, src.cols, src.type(), [
      Math.max(0, cfg.target.r - cfg.tolerance),
      Math.max(0, cfg.target.g - cfg.tolerance),
      Math.max(0, cfg.target.b - cfg.tolerance),
      0,
    ])
    const upper = new cv.Mat(src.rows, src.cols, src.type(), [
      Math.min(255, cfg.target.r + cfg.tolerance),
      Math.min(255, cfg.target.g + cfg.tolerance),
      Math.min(255, cfg.target.b + cfg.tolerance),
      255,
    ])
    cv.inRange(src, lower, upper, mask)
    cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel)
    cv.findContours(mask, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    lower.delete()
    upper.delete()

    const rects: TileRect[] = []
    for (let i = 0; i < contours.size(); i += 1) {
      const contour = contours.get(i)
      const rect = cv.boundingRect(contour)
      contour.delete()

      const area = rect.width * rect.height
      const ratio = rect.width / rect.height
      if (area < 500 || area > 4000) continue
      if (ratio < 0.7 || ratio > 1.3) continue
      rects.push(rect)
    }

    rects.sort((a, b) => b.width * b.height - a.width * a.height)
    const unique: TileRect[] = []
    for (const rect of rects) {
      if (unique.some((u) => iou(u, rect) > 0.75)) continue
      unique.push(rect)
    }
    if (unique.length === 0) return null

    const avgSize = unique.reduce((sum, r) => sum + (r.width + r.height) / 2, 0) / unique.length
    const rowRefs = clusterAxis(unique.map((r) => r.y + r.height / 2), avgSize * 0.55)
    const colRefs = clusterAxis(unique.map((r) => r.x + r.width / 2), avgSize * 0.55)

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const detections: TileDetection[] = []
    const tiles: TileImage[] = unique.map((rect) => {
      const row = nearestIndex(rect.y + rect.height / 2, rowRefs)
      const col = nearestIndex(rect.x + rect.width / 2, colRefs)
      const inset = 2
      const x = Math.max(0, rect.x + inset)
      const y = Math.max(0, rect.y + inset)
      const maxW = canvas.width - x
      const maxH = canvas.height - y
      const w = Math.max(2, Math.min(rect.width - inset * 2, maxW))
      const h = Math.max(2, Math.min(rect.height - inset * 2, maxH))
      detections.push({ row, col, x, y, width: w, height: h })
      return {
        row,
        col,
        imageData: ctx.getImageData(x, y, w, h),
      }
    })

    const minX = Math.min(...detections.map((d) => d.x))
    const minY = Math.min(...detections.map((d) => d.y))
    const maxX = Math.max(...detections.map((d) => d.x + d.width))
    const maxY = Math.max(...detections.map((d) => d.y + d.height))
    const expand = 3
    const frameX = Math.max(0, minX - expand)
    const frameY = Math.max(0, minY - expand)
    const frameMaxX = Math.min(canvas.width, maxX + expand)
    const frameMaxY = Math.min(canvas.height, maxY + expand)
    const frame: TileFrame = {
      x: frameX,
      y: frameY,
      width: Math.max(1, frameMaxX - frameX),
      height: Math.max(1, frameMaxY - frameY),
    }

    return { tiles, rows: rowRefs.length, cols: colRefs.length, detections, frame }
  } catch {
    return null
  } finally {
    src.delete()
    mask.delete()
    contours.delete()
    hierarchy.delete()
    kernel.delete()
  }
}

