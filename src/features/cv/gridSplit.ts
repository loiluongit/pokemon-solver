import type { TileImage } from '../recognition/buildMatrix'

export interface GridConfig {
  rows: number
  cols: number
}

export interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

export const splitBoardIntoTiles = (
  boardCanvas: HTMLCanvasElement,
  config: GridConfig,
): TileImage[] => {
  const ctx = boardCanvas.getContext('2d')
  if (!ctx) throw new Error('Cannot get canvas context')

  const tileWidth = Math.floor(boardCanvas.width / config.cols)
  const tileHeight = Math.floor(boardCanvas.height / config.rows)
  const tiles: TileImage[] = []

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const x = col * tileWidth
      const y = row * tileHeight
      const imageData = ctx.getImageData(x, y, tileWidth, tileHeight)
      tiles.push({ row, col, imageData })
    }
  }

  return tiles
}

export const splitFrameIntoTiles = (
  canvas: HTMLCanvasElement,
  frame: FrameRect,
  config: GridConfig,
): TileImage[] => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot get canvas context')

  const tileWidth = frame.width / config.cols
  const tileHeight = frame.height / config.rows
  const tiles: TileImage[] = []

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const fx = frame.x + col * tileWidth
      const fy = frame.y + row * tileHeight
      const x = Math.max(0, Math.floor(fx))
      const y = Math.max(0, Math.floor(fy))
      const nextX = Math.min(canvas.width, Math.floor(frame.x + (col + 1) * tileWidth))
      const nextY = Math.min(canvas.height, Math.floor(frame.y + (row + 1) * tileHeight))
      const w = Math.max(1, nextX - x)
      const h = Math.max(1, nextY - y)

      tiles.push({
        row,
        col,
        imageData: ctx.getImageData(x, y, w, h),
      })
    }
  }

  return tiles
}

