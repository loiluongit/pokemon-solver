export interface BoardRegion {
  x: number
  y: number
  width: number
  height: number
}

export const detectBoardRegion = (canvas: HTMLCanvasElement): BoardRegion => {
  const width = canvas.width
  const height = canvas.height
  const marginX = Math.round(width * 0.06)
  const marginY = Math.round(height * 0.12)

  return {
    x: marginX,
    y: marginY,
    width: width - marginX * 2,
    height: height - marginY * 2,
  }
}

export const cropBoard = (canvas: HTMLCanvasElement, region: BoardRegion): HTMLCanvasElement => {
  const board = document.createElement('canvas')
  board.width = region.width
  board.height = region.height

  const outCtx = board.getContext('2d')
  if (!outCtx) throw new Error('Cannot get canvas context')
  outCtx.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)

  return board
}

