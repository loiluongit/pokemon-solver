import { addPadding } from "./pathCheck";
import { Point, ValidPair } from "./types";

/**
 * findValidPair
 * Scans a 2D board (matrix) to find the first matching pair of identical 
 * tiles that can be connected with a maximum of 2 turns (3 line segments).
 */
const findPairs = (boardData: number[][]): ValidPair[] => {

  // --- INITIALIZATION ---
  const rows = boardData.length;
  const cols = boardData[0].length;
  const board = addPadding(boardData); // Add padding to simplify edge cases

  // eslint-disable-next-line no-debugger
  debugger;

  // --- HELPER: CHECK IF A STRAIGHT LINE IS CLEAR ---
  const checkLineClear = (r1: number, c1: number, r2: number, c2: number) => {
    if (r1 !== r2 && c1 !== c2) return false;

    if (r1 === r2) { // Horizontal
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let c = minC + 1; c < maxC; c++) {
        if (board[r1][c] !== 0) return false;
      }
    } else { // Vertical
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      for (let r = minR + 1; r < maxR; r++) {
        if (board[r][c1] !== 0) return false;
      }
    }
    return true;
  };

  // --- HELPER: CONNECTION LOGIC WITH TURN PRIORITY ---
  const canConnect = (r1: number, c1: number, r2: number, c2: number): Point[] | null => {
    
    // 1. PRIORITY: 0 TURNS (Straight Line)
    if ((r1 === r2 || c1 === c2) && checkLineClear(r1, c1, r2, c2)) {
      return [{ r: r1, c: c1 }, { r: r2, c: c2 }];
    }

    // 2. PRIORITY: 1 TURN (L-Shape)
    // Corner A: Same row as P1, same col as P2
    if (board[r1][c2] === 0 && checkLineClear(r1, c1, r1, c2) && checkLineClear(r1, c2, r2, c2)) {
      return [{ r: r1, c: c1 }, { r: r1, c: c2 }, { r: r2, c: c2 }];
    }
    // Corner B: Same col as P1, same row as P2
    if (board[r2][c1] === 0 && checkLineClear(r1, c1, r2, c1) && checkLineClear(r2, c1, r2, c2)) {
      return [{ r: r1, c: c1 }, { r: r2, c: c1 }, { r: r2, c: c2 }];
    }

    // 3. PRIORITY: 2 TURNS (U-Shape / Z-Shape)
    // Horizontal Sweep: Check all columns to see if we can route through them
    for (let c = 0; c < cols; c++) {
      if (c === c1 || c === c2) continue;
      if (board[r1][c] === 0 && board[r2][c] === 0) {
        if (checkLineClear(r1, c1, r1, c) && checkLineClear(r1, c, r2, c) && checkLineClear(r2, c, r2, c2)) {
          return [{ r: r1, c: c1 }, { r: r1, c: c }, { r: r2, c: c }, { r: r2, c: c2 }];
        }
      }
    }
    // Vertical Sweep: Check all rows to see if we can route through them
    for (let r = 0; r < rows; r++) {
      if (r === r1 || r === r2) continue;
      if (board[r][c1] === 0 && board[r][c2] === 0) {
        if (checkLineClear(r1, c1, r, c1) && checkLineClear(r, c1, r, c2) && checkLineClear(r, c2, r2, c2)) {
          return [{ r: r1, c: c1 }, { r: r, c: c1 }, { r: r, c: c2 }, { r: r2, c: c2 }];
        }
      }
    }

    return null;
  };

  const validPairs: ValidPair[] = [];

  // --- MAIN SCAN: FIND MATCHING TILES ---
  for (let r1 = 0; r1 < rows; r1++) {
    for (let c1 = 0; c1 < cols; c1++) {
      const id1 = board[r1][c1];
      if (id1 === 0) continue;

      for (let r2 = 0; r2 < rows; r2++) {
        for (let c2 = 0; c2 < cols; c2++) {
          // Avoid matching a tile with itself or matching tiles in reverse order (efficiency)
          if (r1 === r2 && c1 === c2) continue;
          
          if (board[r2][c2] === id1) {
            const path = canConnect(r1, c1, r2, c2);
            if (path) validPairs.push({ id: id1, path });
          }
        }
      }
    }
  }

  return validPairs;
};

export default findPairs
