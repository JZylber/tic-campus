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

// Two-way mapping between the Spanish day labels used throughout the grid
// and the backend's Weekday enum values, kept here (not imported from a
// backend type) so this file stays dependency-free.
export const DAY_TO_WEEKDAY: Record<string, string> = {
  Lunes: "MONDAY",
  Martes: "TUESDAY",
  Miércoles: "WEDNESDAY",
  Jueves: "THURSDAY",
  Viernes: "FRIDAY",
};

export const WEEKDAY_TO_DAY: Record<string, string> = Object.fromEntries(
  Object.entries(DAY_TO_WEEKDAY).map(([day, weekday]) => [weekday, day])
);

export type TimetableEntry = {
  day: string;
  block: number;
  room: string;
  teacher: string;
};

export type TimetableBySubject = Record<string, TimetableEntry[]>;

// Shared lookup used by every timetable Alpine data factory: which slots
// (across all subjects/offerings keyed in `timetable`) occupy a given grid
// cell. Kept here so the desktop/mobile grid rendering and every data
// source (student's own view, admin's single-offering view) share one
// implementation instead of re-deriving row/col from day/block separately.
export const getSlotsAtGridPos = (
  timetable: TimetableBySubject | null,
  row: number,
  col: number
): Array<{ subject: string; room: string; teacher: string }> => {
  if (timetable === null) return [];
  const day = DAYS[col - 1];
  return Object.entries(timetable)
    .flatMap(([subject, entries]) =>
      entries
        .filter((entry) => entry.day === day && BLOCK_TO_ROW[entry.block] === row)
        .map((entry) => ({
          subject,
          room: entry.room,
          teacher: entry.teacher,
        }))
    )
    .sort((a, b) => {
      if (a.subject === "Proyecto") return 1;
      if (b.subject === "Proyecto") return -1;
      return 0;
    });
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
