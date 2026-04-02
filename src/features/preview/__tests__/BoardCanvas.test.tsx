/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, waitFor } from '@testing-library/react'
import { describe, test, beforeEach, afterEach, expect } from 'vitest'
import { BoardCanvas } from '../BoardCanvas'
import type { ValidPair } from '../../solver/types'
import type { TileFrame } from '../../cv/tileDetect'

// This test verifies the mapping from solver (padded) coordinates to canvas pixels.
// We mock globalThis.Image so the component's image onload handler runs and
// we can inspect the canvas pixels drawn by the component.

describe('BoardCanvas', () => {
  const RealImage = (globalThis as any).Image

  beforeEach(() => {
    // Minimal Image mock that triggers `onload` when `src` is set.
    class MockImage {
      width = 200
      height = 100
      onload: () => void = () => {}
      set src(_: string) {
        // call onload asynchronously to mimic browser behavior
        setTimeout(() => this.onload(), 0)
      }
    }
    ;(globalThis as any).Image = MockImage
  })

  afterEach(() => {
    ;(globalThis as any).Image = RealImage
  })

  test('draws endpoints at expected positions (accounts for solver padding)', async () => {
    const frame: TileFrame = { x: 0, y: 0, width: 160, height: 80 }
    const frameRows = 2
    const frameCols = 4

    // Solver uses a padded board; the component subtracts 1 when mapping.
    // Use a simple path: padded coords (r=1,c=1) -> visible (0,0) and (r=1,c=4)->(0,3)
    const pair: ValidPair = {
      id: 1,
      path: [
        { r: 1, c: 1 },
        { r: 1, c: 4 },
      ],
    }

    const { container } = render(
      <BoardCanvas
        imageUrl="data:"
        highlightedTiles={[]}
        showHighlightedTiles={false}
        frame={frame}
        frameRows={frameRows}
        frameCols={frameCols}
        pair={pair}
      />,
    )

    await waitFor(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      expect(canvas).toBeTruthy()
      const ctx = canvas.getContext('2d')!

      // Calculations must match the component's logic: cellX = frame.width / cols
      const cellX = frame.width / frameCols
      const cellY = frame.height / frameRows

      // After subtracting padding (1): start -> (0,0) center, end -> (0,3) center
      const startX = Math.round((0 + 0 * cellX + cellX / 2))
      const startY = Math.round((0 + 0 * cellY + cellY / 2))
      const endX = Math.round((0 + 3 * cellX + cellX / 2))
      const endY = Math.round((0 + 0 * cellY + cellY / 2))

      const startPx = ctx.getImageData(startX, startY, 1, 1).data
      const endPx = ctx.getImageData(endX, endY, 1, 1).data

      // Expect red-ish pixels at both endpoints
      expect(startPx[0]).toBeGreaterThan(150)
      expect(startPx[1]).toBeLessThan(120)
      expect(startPx[2]).toBeLessThan(120)

      expect(endPx[0]).toBeGreaterThan(150)
      expect(endPx[1]).toBeLessThan(120)
      expect(endPx[2]).toBeLessThan(120)
    })
  })
})
