import { useEffect, useRef } from 'react'
import type { TileDetection, TileFrame } from '../cv/tileDetect'

interface BoardCanvasProps {
  imageUrl: string | null
  highlightedTiles: TileDetection[]
  showHighlightedTiles: boolean
  frame: TileFrame | null
  frameRows: number
  frameCols: number
}

export const BoardCanvas = ({
  imageUrl,
  highlightedTiles: _highlightedTiles,
  showHighlightedTiles,
  frame,
  frameRows,
  frameCols,
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
    }
  }, [frame, frameCols, frameRows, _highlightedTiles, imageUrl, showHighlightedTiles])

  return <canvas className="board-canvas" ref={canvasRef} />
}

