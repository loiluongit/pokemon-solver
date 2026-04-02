import type { RgbValue } from '../recognition/buildMatrix'

interface MatrixPanelProps {
  matrix: RgbValue[][]
  tags: number[][]
}

export const MatrixPanel = ({ matrix, tags }: MatrixPanelProps) => {
  if (matrix.length === 0) return <p>Matrix not generated yet.</p>

  return (
    <div className="matrix-panel">
      <h3>Average RGB Matrix (rows x cols)</h3>
      <div className="matrix-table-wrap">
        <table className="matrix-table">
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={`m-${rowIndex}`}>
                {row.map((value, colIndex) => (
                  <td key={`m-${rowIndex}-${colIndex}`}>
                    <div className="rgb-cell">
                      <div className="rgb-tag">{tags[rowIndex]?.[colIndex] ?? ''}</div>
                      <div className="rgb-r">{value.r}</div>
                      <div className="rgb-g">{value.g}</div>
                      <div className="rgb-b">{value.b}</div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

