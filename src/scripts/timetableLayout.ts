export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Row 4 is left empty in the grid to create visual space for the lunch
// break between blocks 3 and 4.
export const BLOCK_TO_ROW: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 6,
  6: 7,
};

export interface TimetableGridCell {
  block: number;
  row: number;
  day: string;
  col: number;
}

export const getGridBlocks = () =>
  Object.entries(BLOCK_TO_ROW).map(([block, row]) => ({
    block: Number(block),
    row,
  }));

export const getGridCells = (): TimetableGridCell[] =>
  getGridBlocks().flatMap(({ block, row }) =>
    DAYS.map((day, index) => ({
      block,
      row,
      day,
      col: index + 1,
    }))
  );
