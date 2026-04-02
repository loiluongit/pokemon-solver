import type { ValidPair } from '../solver/types'

interface PairOverlayProps {
  pair: ValidPair | null
}

export const PairOverlay = ({ pair }: PairOverlayProps) => {
  if (!pair) return <p>No valid pair found yet.</p>

  return (
    <div className="overlay-panel">
      <h3>Current Pair</h3>
      <p>
        Tile {pair.id}
      </p>
      <p>Path nodes: {pair.path.length}</p>
    </div>
  )
}

