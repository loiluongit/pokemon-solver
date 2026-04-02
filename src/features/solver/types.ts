export type BoardMatrix = number[][]

export interface Point {
  row: number
  col: number
}

export interface ValidPair {
  from: Point
  to: Point
  value: number
  path: Point[]
}

