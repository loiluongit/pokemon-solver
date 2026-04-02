import { useEffect, useRef } from 'react'
import type { TileDetection, TileFrame } from '../cv/tileDetect'
import type { ValidPair, Point as SolverPoint } from '../solver/types'

interface BoardCanvasProps {
  imageUrl: string | null
  highlightedTiles: TileDetection[]
  showHighlightedTiles: boolean
  frame: TileFrame | null
  frameRows: number
  frameCols: number
  pair: ValidPair | null
}

export const BoardCanvas = ({
  imageUrl,
  highlightedTiles: _highlightedTiles,
  showHighlightedTiles,
  frame,
  frameRows,
  frameCols,
  pair,
}: BoardCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return

    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const maxWidth = 1000
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          if (showHighlightedTiles) {
        if (frame) {
          ctx.strokeStyle = '#16a34a'
          ctx.lineWidth = 2
          ctx.strokeRect(frame.x, frame.y, frame.width, frame.height)

          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 1
          const border = 5
          const cellW = frame.width / frameCols
          const cellH = frame.height / frameRows

          // Draw inner region used for average RGB sampling in each cell.
          for (let row = 0; row < frameRows; row += 1) {
            for (let col = 0; col < frameCols; col += 1) {
              const x = frame.x + col * cellW + border
              const y = frame.y + row * cellH + border
              const w = Math.max(1, cellW - border * 2)
              const h = Math.max(1, cellH - border * 2)
              ctx.strokeRect(x, y, w, h)
            }
          }

          for (let r = 1; r < frameRows; r += 1) {
            const y = frame.y + (frame.height * r) / frameRows
            ctx.beginPath()
            ctx.moveTo(frame.x, y)
            ctx.lineTo(frame.x + frame.width, y)
            ctx.stroke()
          }
          for (let c = 1; c < frameCols; c += 1) {
            const x = frame.x + (frame.width * c) / frameCols
            ctx.beginPath()
            ctx.moveTo(x, frame.y)
            ctx.lineTo(x, frame.y + frame.height)
            ctx.stroke()
          }
        }
      }
      // draw pair path if available
      if (pair && pair.path && pair.path.length > 0) {
        const rows = frame ? frameRows : Math.max(1, frameRows || 9)
        const cols = frame ? frameCols : Math.max(1, frameCols || 16)
        let cellX = 0
        let cellY = 0
        let offsetX = 0
        let offsetY = 0
        if (frame) {
          cellX = frame.width / cols
          cellY = frame.height / rows
          offsetX = frame.x
          offsetY = frame.y
        } else {
          cellX = canvas.width / cols
          cellY = canvas.height / rows
          offsetX = 0
          offsetY = 0
        }

        ctx.save()
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 3
        ctx.beginPath()
        pair.path.forEach((p, i) => {
          const pp = p as SolverPoint
          // solver uses a padded board (1-cell border) internally; shift coordinates
          // back by 1 to map to the visible grid
          const px = pp.c - 1
          const py = pp.r - 1
          const x = offsetX + px * cellX + cellX / 2
          const y = offsetY + py * cellY + cellY / 2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        // endpoints
        const start = pair.path[0] as SolverPoint
        const end = pair.path[pair.path.length - 1] as SolverPoint
        const sx = offsetX + (start.c - 1) * cellX + cellX / 2
        const sy = offsetY + (start.r - 1) * cellY + cellY / 2
        const ex = offsetX + (end.c - 1) * cellX + cellX / 2
        const ey = offsetY + (end.r - 1) * cellY + cellY / 2
        ctx.fillStyle = 'rgba(255,0,0,0.9)'
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
    }
  }, [frame, frameCols, frameRows, _highlightedTiles, imageUrl, showHighlightedTiles, pair])

  return <canvas className="board-canvas" ref={canvasRef} />
}

