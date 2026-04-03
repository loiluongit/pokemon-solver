
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
      const imageW = Math.round(img.width * scale)
      const imageH = Math.round(img.height * scale)

      // Determine one-tile padding in pixels. Use the frame cell height when
      // available, otherwise derive from the full image and provided frameRows.
      const rows = frame ? frameRows : Math.max(1, frameRows || 9)
      const cellHForPadding = frame ? frame.height / frameRows : imageH / rows
      const extra = Math.round(cellHForPadding)

      // Make canvas taller by extra padding on top and bottom and draw the
      // image shifted down by `extra` so there's blank space above it.
      canvas.width = imageW
      canvas.height = imageH + extra * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, extra, imageW, imageH)

      if (showHighlightedTiles) {
        if (frame) {
          const frameY = frame.y + extra
          ctx.strokeStyle = '#16a34a'
          ctx.lineWidth = 2
          ctx.strokeRect(frame.x, frameY, frame.width, frame.height)

          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 1
          const border = 5
          const cellW = frame.width / frameCols
          const cellH = frame.height / frameRows

          // Draw inner region used for average RGB sampling in each cell.
          for (let row = 0; row < frameRows; row += 1) {
            for (let col = 0; col < frameCols; col += 1) {
              const x = frame.x + col * cellW + border
              const y = frameY + row * cellH + border
              const w = Math.max(1, cellW - border * 2)
              const h = Math.max(1, cellH - border * 2)
              ctx.strokeRect(x, y, w, h)
            }
          }

          for (let r = 1; r < frameRows; r += 1) {
            const y = frameY + (frame.height * r) / frameRows
            ctx.beginPath()
            ctx.moveTo(frame.x, y)
            ctx.lineTo(frame.x + frame.width, y)
            ctx.stroke()
          }
          for (let c = 1; c < frameCols; c += 1) {
            const x = frame.x + (frame.width * c) / frameCols
            ctx.beginPath()
            ctx.moveTo(x, frameY)
            ctx.lineTo(x, frameY + frame.height)
            ctx.stroke()
          }
          // draw the first detected tile (if any) with a special highlight
          if (_highlightedTiles && _highlightedTiles.length > 0) {
            const first = _highlightedTiles[0]
            ctx.save()
            ctx.strokeStyle = '#2563eb'
            ctx.lineWidth = 3
            ctx.setLineDash([6, 4])
            ctx.strokeRect(first.x, first.y + extra, first.width, first.height)
            // (badge removed)
            ctx.restore()
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
          offsetY = frame.y + extra
        } else {
          // When no frame, the visible image area is imageH tall and was drawn
          // starting at `extra` vertical offset inside the canvas.
          cellX = imageW / cols
          cellY = imageH / rows
          offsetX = 0
          offsetY = extra
        }

        // Neon-style path: layered strokes for outer glow, mid glow and inner core
        ctx.save()
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'

  // outer glow (red)
  ctx.shadowBlur = 24
  ctx.shadowColor = 'rgba(255,60,60,0.9)'
  ctx.strokeStyle = 'rgba(255,80,80,0.25)'
  ctx.lineWidth = 14
        ctx.beginPath()
        pair.path.forEach((p, i) => {
          const pp = p as SolverPoint
          const px = pp.c - 1
          const py = pp.r - 1
          const x = offsetX + px * cellX + cellX / 2
          const y = offsetY + py * cellY + cellY / 2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

  // mid glow (red)
  ctx.shadowBlur = 14
  ctx.shadowColor = 'rgba(255,90,90,0.95)'
  ctx.strokeStyle = 'rgba(255,100,100,0.95)'
  ctx.lineWidth = 7
        ctx.stroke()

        // core (sharp)
        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'
        ctx.lineWidth = 2
        ctx.stroke()

  // small neon endpoint dots (subtle)
  const start = pair.path[0] as SolverPoint
  const end = pair.path[pair.path.length - 1] as SolverPoint
  const sx = offsetX + (start.c - 1) * cellX + cellX / 2
  const sy = offsetY + (start.r - 1) * cellY + cellY / 2
  const ex = offsetX + (end.c - 1) * cellX + cellX / 2
  const ey = offsetY + (end.r - 1) * cellY + cellY / 2

  ctx.shadowBlur = 12
  ctx.shadowColor = 'rgba(255,80,80,0.95)'
  ctx.fillStyle = 'rgba(255,100,100,0.95)'
  ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
        ctx.restore()
      }
    }
  }, [frame, frameCols, frameRows, _highlightedTiles, imageUrl, showHighlightedTiles, pair])

  return <canvas className="board-canvas" ref={canvasRef} />
}

