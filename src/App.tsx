import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { detectBoardRegion, cropBoard } from './features/cv/boardDetect'
import { splitBoardIntoTiles, splitFrameIntoTiles } from './features/cv/gridSplit'
import { loadOpenCv } from './features/cv/opencvLoader'
import { preprocessImage } from './features/cv/preprocess'
import { detectOnetTiles, type TileDetection, type TileFrame } from './features/cv/tileDetect'
import { MatrixPanel } from './features/debug/MatrixPanel'
import { PairOverlay } from './features/overlay/PairOverlay'
import {
  buildAverageRgbMatrixFromTiles,
  tagRgbMatrix,
  type RgbMatrixBuildResult,
  type RgbValue,
} from './features/recognition/buildMatrix'
import type { ValidPair } from './features/solver/types'
import { ImageUploader } from './features/upload/ImageUploader'
import { BoardCanvas } from './features/preview/BoardCanvas'
import findPairs from './features/solver/findPairs'

const BOARD_ROWS = 9
const BOARD_COLS = 16

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [matrix, setMatrix] = useState<RgbValue[][]>([])
  const [tileTags, setTileTags] = useState<number[][]>([])
  const [confidence, setConfidence] = useState<number[][]>([])
  const [pairs, setPairs] = useState<ValidPair[]>([])
  const [pairIndex, setPairIndex] = useState(0)
  const [status, setStatus] = useState('Upload an image to start')
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedTiles, setDetectedTiles] = useState<TileDetection[]>([])
  const [showDetectedTiles, setShowDetectedTiles] = useState(false)
  const [detectedFrame, setDetectedFrame] = useState<TileFrame | null>(null)
  const [detectedRows, setDetectedRows] = useState(0)
  const [detectedCols, setDetectedCols] = useState(0)

  const imageUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])
  const currentPair = pairs[pairIndex] ?? null

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const processImage = async () => {
    if (!imageFile || isProcessing) return
    setIsProcessing(true)

    try {
      setStatus('Loading OpenCV...')
      const cvReady = await loadOpenCv()
      setStatus(cvReady ? 'OpenCV loaded. Processing image...' : 'OpenCV unavailable, using fallback.')

      const bitmap = await createImageBitmap(imageFile)
      const preprocessed = await preprocessImage(bitmap)
      await new Promise((resolve) => setTimeout(resolve, 0))
      const detected = cvReady ? detectOnetTiles(preprocessed) : null

      let built: RgbMatrixBuildResult
      if (detected && detected.tiles.length > 10) {
        const frameTiles = splitFrameIntoTiles(preprocessed, detected.frame, {
          rows: BOARD_ROWS,
          cols: BOARD_COLS,
        })
        built = buildAverageRgbMatrixFromTiles(frameTiles, BOARD_ROWS, BOARD_COLS)
        setDetectedTiles(detected.detections)
        setDetectedFrame(detected.frame)
        setDetectedRows(BOARD_ROWS)
        setDetectedCols(BOARD_COLS)
        setStatus(`Detected frame with fixed grid ${BOARD_ROWS} rows x ${BOARD_COLS} cols.`)
      } else {
        const boardRegion = detectBoardRegion(preprocessed)
        const boardCanvas = cropBoard(preprocessed, boardRegion)
        const tiles = splitBoardIntoTiles(boardCanvas, { rows: BOARD_ROWS, cols: BOARD_COLS })
        built = buildAverageRgbMatrixFromTiles(tiles, BOARD_ROWS, BOARD_COLS)
        setDetectedTiles([])
        setDetectedFrame(null)
        setDetectedRows(0)
        setDetectedCols(0)
        setStatus(`Fallback grid mode used (${BOARD_ROWS}x${BOARD_COLS}).`)
      }

      setMatrix(built.matrix)
      const tagM = tagRgbMatrix(built.matrix, 3)
      setTileTags(tagM)
      setConfidence(built.confidence)
      // Temporary safe mode: detect/classify tiles only, skip path solving.
      const p = findPairs(tagM)
      // eslint-disable-next-line no-debugger
      debugger;
      setPairs(p)
      setPairIndex(0)
      setStatus((prev) => `${prev} Tile-only mode complete.`)
    } catch {
      setDetectedTiles([])
      setDetectedFrame(null)
      setDetectedRows(0)
      setDetectedCols(0)
      setTileTags([])
      setStatus('Processing failed. Please try another screenshot.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="app">
      <h1>Onet Screenshot Solver</h1>
      <p className="status">{status}</p>

      <div className="toolbar">
        <ImageUploader onFileSelected={setImageFile} />
        <button type="button" onClick={processImage} disabled={!imageFile || isProcessing}>
          {isProcessing ? 'Processing...' : 'Process'}
        </button>
        <button
          type="button"
          onClick={() => setPairIndex((prev) => (pairs.length === 0 ? 0 : (prev + 1) % pairs.length))}
          disabled={pairs.length === 0}
        >
          Next hint
        </button>
        <button type="button" onClick={() => setShowDetectedTiles((prev) => !prev)} disabled={detectedTiles.length === 0}>
          {showDetectedTiles ? 'Hide RGB area' : 'Show RGB area'}
        </button>
      </div>

      <div className="grid">
        <section className="panel">
          <h2>Screenshot</h2>
          <BoardCanvas
            imageUrl={imageUrl}
            highlightedTiles={detectedTiles}
            showHighlightedTiles={showDetectedTiles}
            frame={detectedFrame}
            frameRows={detectedRows}
            frameCols={detectedCols}
            pair={currentPair}
          />
        </section>
        <section className="panel">
          <PairOverlay pair={currentPair} />
          <MatrixPanel matrix={matrix} tags={tileTags} confidence={confidence} />
        </section>
      </div>
    </main>
  )
}

export default App
