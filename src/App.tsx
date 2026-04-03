import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { type TileDetection, type TileFrame } from './features/cv/tileDetect'
import { MatrixPanel } from './features/debug/MatrixPanel'
import { PairOverlay } from './features/overlay/PairOverlay'
import { type RgbValue } from './features/recognition/buildMatrix'
import runPipeline, { type PipelineResult } from './features/processing/runPipeline'
import type { ValidPair } from './features/solver/types'
import { ImageUploader } from './features/upload/ImageUploader'
import { BoardCanvas } from './features/preview/BoardCanvas'

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
      setStatus('Processing image...')
      const result: PipelineResult = await runPipeline(imageFile, boardRows, boardCols)

      setMatrix(result.matrix)
      setTileTags(result.tags)
      setPairs(result.pairs)
      setPairIndex(0)

      setDetectedTiles(result.detectedTiles)
      setDetectedFrame(result.detectedFrame)
      setDetectedRows(result.detectedRows)
      setDetectedCols(result.detectedCols)

      // update the global board rows/cols so downstream UI and splitting use the detected size
      if (result.detectedRows && result.detectedCols) {
        setBoardRows(result.detectedRows)
        setBoardCols(result.detectedCols)
      }

      setStatus(result.status)
    } catch (err) {
      console.error(err)
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
      <h1>Pokémon Solver</h1>
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
