export type BoardMatrix = number[][]

export interface Point {
  r: number
  c: number
}

export interface ValidPair {
  id: number
  path: Point[]
}

