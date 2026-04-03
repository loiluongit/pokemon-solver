import { loadOpenCv } from '../cv/opencvLoader'
import { preprocessImage } from '../cv/preprocess'
import { detectOnetTiles, type TileDetection, type TileFrame } from '../cv/tileDetect'
import { detectBoardRegion, cropBoard } from '../cv/boardDetect'
import { splitBoardIntoTiles, splitFrameIntoTiles } from '../cv/gridSplit'
import {
  buildAverageRgbMatrixFromTiles,
  tagRgbMatrix,
  type RgbMatrixBuildResult,
  type RgbValue,
} from '../recognition/buildMatrix'
import findPairs from '../solver/findPairs'
import type { ValidPair } from '../solver/types'

export interface PipelineResult {
  matrix: RgbValue[][]
  tags: number[][]
  pairs: ValidPair[]
  detectedTiles: TileDetection[]
  detectedFrame: TileFrame | null
  detectedRows: number
  detectedCols: number
  status: string
}

export const runPipeline = async (
  file: File,
  fallbackRows = 9,
  fallbackCols = 16,
): Promise<PipelineResult> => {
  // Load OpenCV and preprocess
  const cvReady = await loadOpenCv()

  const bitmap = await createImageBitmap(file)
  const preprocessed = await preprocessImage(bitmap)

  const detected = cvReady ? detectOnetTiles(preprocessed) : null

  let built: RgbMatrixBuildResult
  let detectedTiles: TileDetection[] = []
  let detectedFrame: TileFrame | null = null
  let detectedRows = 0
  let detectedCols = 0

  if (detected && detected.tiles.length > 10) {
    const dets = detected.detections
    const first = dets[0]
  	const tileW = Math.max(1, Math.round(first.width) + 7)
    const tileH = Math.max(1, Math.round(first.height) + 7)
    const frameW = Math.max(1, detected.frame.width)
    const frameH = Math.max(1, detected.frame.height)

		console.log(frameW / tileW, frameH / tileH)
    let autoCols = Math.max(1, Math.round(frameW / tileW))
    let autoRows = Math.max(1, Math.round(frameH / tileH))

    if (detected.cols && detected.cols > 0 && (autoCols > detected.cols * 2 || autoCols < 1)) autoCols = detected.cols
    if (detected.rows && detected.rows > 0 && (autoRows > detected.rows * 2 || autoRows < 1)) autoRows = detected.rows

    autoCols = Math.min(autoCols, 64)
    autoRows = Math.min(autoRows, 64)

    const frameTiles = splitFrameIntoTiles(preprocessed, detected.frame, {
      rows: autoRows,
      cols: autoCols,
    })
    built = buildAverageRgbMatrixFromTiles(frameTiles, autoRows, autoCols)
    detectedTiles = detected.detections
    detectedFrame = detected.frame
    detectedRows = autoRows
    detectedCols = autoCols

    const tagM = tagRgbMatrix(built.matrix, 3)
    const p = findPairs(tagM)

    return {
      matrix: built.matrix,
      tags: tagM,
      pairs: p,
      detectedTiles,
      detectedFrame,
      detectedRows,
      detectedCols,
      status: `Auto-detected grid: ${autoRows} rows × ${autoCols} cols — tile-only processing complete.`,
    }
  }

  // fallback region
  const boardRegion = detectBoardRegion(preprocessed)
  const boardCanvas = cropBoard(preprocessed, boardRegion)
  const tiles = splitBoardIntoTiles(boardCanvas, { rows: fallbackRows, cols: fallbackCols })
  built = buildAverageRgbMatrixFromTiles(tiles, fallbackRows, fallbackCols)
  const tagM = tagRgbMatrix(built.matrix, 3)
  const p = findPairs(tagM)

  return {
    matrix: built.matrix,
    tags: tagM,
    pairs: p,
    detectedTiles: [],
    detectedFrame: null,
    detectedRows: 0,
    detectedCols: 0,
    status: `Fallback grid mode used (${fallbackRows}×${fallbackCols}). Tile-only processing complete.`,
  }
}

export default runPipeline
