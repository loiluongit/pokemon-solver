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

// Defaults: 16 columns x 9 rows

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [matrix, setMatrix] = useState<RgbValue[][]>([])
  const [tileTags, setTileTags] = useState<number[][]>([])
  const [boardRows, setBoardRows] = useState<number>(9)
  const [boardCols, setBoardCols] = useState<number>(16)
  
  const [pairs, setPairs] = useState<ValidPair[]>([])
  const [pairIndex, setPairIndex] = useState(0)
  const [status, setStatus] = useState('Ready — upload a screenshot to begin')
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedTiles, setDetectedTiles] = useState<TileDetection[]>([])
  const [showDetectedTiles, setShowDetectedTiles] = useState(false)
  const [detectedFrame, setDetectedFrame] = useState<TileFrame | null>(null)
  const [detectedRows, setDetectedRows] = useState(0)
  const [detectedCols, setDetectedCols] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  const imageUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])
  const currentPair = pairs[pairIndex] ?? null

  // read debug flag from localStorage (controls debug UI visibility)
  const debug = typeof window !== 'undefined' && localStorage.getItem('debug') === 'true'

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  // Auto-process when a new image is selected
  useEffect(() => {
    if (imageFile) {
      // kick off processing automatically
      void processImage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile])

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
        // Auto-calc rows/cols based on average detected tile size and frame bounds
      const dets = detected.detections
      // Use the first detected tile's size as representative. Add a small
      // margin to account for detection shrinkage so we don't undercount tiles.
      const first = dets[0]
      const tileW = Math.max(1, Math.round(first.width) + 7)
      const tileH = Math.max(1, Math.round(first.height) + 5)
        const frameW = Math.max(1, detected.frame.width)
        const frameH = Math.max(1, detected.frame.height)

      let autoCols = Math.max(1, Math.round(frameW / tileW))
      let autoRows = Math.max(1, Math.round(frameH / tileH))

        // sanity checks: fall back to detector's cluster counts if results look wrong
        if (detected.cols && detected.cols > 0 && (autoCols > detected.cols * 2 || autoCols < 1)) autoCols = detected.cols
        if (detected.rows && detected.rows > 0 && (autoRows > detected.rows * 2 || autoRows < 1)) autoRows = detected.rows

        // limit unreasonable sizes
        autoCols = Math.min(autoCols, 64)
        autoRows = Math.min(autoRows, 64)

        const frameTiles = splitFrameIntoTiles(preprocessed, detected.frame, {
          rows: autoRows,
          cols: autoCols,
        })
        built = buildAverageRgbMatrixFromTiles(frameTiles, autoRows, autoCols)
        setDetectedTiles(detected.detections)
        setDetectedFrame(detected.frame)
        setDetectedRows(autoRows)
        setDetectedCols(autoCols)
        // update the global board rows/cols so downstream UI and splitting use the detected size
        setBoardRows(autoRows)
        setBoardCols(autoCols)
        setStatus(`Auto-detected grid: ${autoRows} rows × ${autoCols} cols — tile-only processing complete.`)
      } else {
        const boardRegion = detectBoardRegion(preprocessed)
        const boardCanvas = cropBoard(preprocessed, boardRegion)
        const tiles = splitBoardIntoTiles(boardCanvas, { rows: boardRows, cols: boardCols })
        built = buildAverageRgbMatrixFromTiles(tiles, boardRows, boardCols)
        setDetectedTiles([])
        setDetectedFrame(null)
        setDetectedRows(0)
        setDetectedCols(0)
        setStatus(`Fallback grid used: ${boardRows} rows × ${boardCols} cols — tile-only processing complete.`)
      }

      setMatrix(built.matrix)
      const tagM = tagRgbMatrix(built.matrix, 3)
      setTileTags(tagM)
      const p = findPairs(tagM)
  setPairs(p)
  setPairIndex(0)
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
      <h1>Onet Solver — Screenshot Assistant</h1>
      <p className="status">{status}</p>

      <div className="toolbar">
        <ImageUploader onFileSelected={setImageFile} />
        {/* Processing is automatic after upload */}
        <button
          type="button"
          onClick={() => setPairIndex((prev) => (pairs.length === 0 ? 0 : (prev + 1) % pairs.length))}
          disabled={pairs.length === 0}
        >
          Next hint
        </button>
        {debug && (
          <>
            <button type="button" onClick={() => setShowDetectedTiles((prev) => !prev)} disabled={detectedTiles.length === 0}>
              {showDetectedTiles ? 'Hide RGB area' : 'Show RGB area'}
            </button>
            <button type="button" onClick={() => setShowDetails((prev) => !prev)}>
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          </>
        )}
      </div>

      <div className="grid">
        <BoardCanvas
          imageUrl={imageUrl}
          highlightedTiles={detectedTiles}
          showHighlightedTiles={showDetectedTiles}
          frame={detectedFrame}
          frameRows={detectedRows}
          frameCols={detectedCols}
          pair={currentPair}
        />
        {showDetails && (
          <section className="panel">
            <PairOverlay pair={currentPair} />
            <MatrixPanel matrix={matrix} tags={tileTags} />
          </section>
        )}
      </div>
    </main>
  )
}

export default App
