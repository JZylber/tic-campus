import type { AlpineComponent } from "alpinejs";
import { BLOCK_TO_ROW, DAYS } from "../../timetableLayout";
import { getSlotClasses, getSubjectColorClass } from "../../timetableColors";

export type TimetableEntry = {
  day: string;
  block: number;
  room: string;
  teacher: string;
};

export type TimetableBySubject = Record<string, TimetableEntry[]>;

type TimetableState = "loading" | "error" | "empty" | "ready";

type AlpineTimetableData = AlpineComponent<{
  timetable: TimetableBySubject | null;
  seminars: Array<string> | null;
  error: boolean;
  readonly state: TimetableState;
  setTimetable: (timetable: TimetableBySubject) => void;
  setSeminars: (seminars: Array<string>) => void;
  setError: () => void;
  getTimetableByGridPos: (
    row: number,
    col: number
  ) => Array<{ subject: string; room: string; teacher: string }>;
  subjectColorClass: (subject: string) => string;
  slotClasses: (
    subject: string,
    personalized: boolean,
    isProjectSlot: boolean
  ) => string;
}>;

// Holds the reactive timetable/seminars data and exposes it to
// TimetableGrid. It does not fetch anything itself: whatever loads the data
// (Sheets today, the database once the migration lands) should call
// setTimetable/setSeminars/setError once it has a result.
const timetableData = () => {
  return {
    timetable: null,
    seminars: null,
    error: false,
    get state() {
      if (this.error) return "error";
      if (this.timetable === null) return "loading";
      if (Object.keys(this.timetable).length === 0) return "empty";
      return "ready";
    },
    setTimetable(timetable: TimetableBySubject) {
      this.timetable = timetable;
    },
    setSeminars(seminars: Array<string>) {
      this.seminars = seminars;
    },
    setError() {
      this.error = true;
    },
    getTimetableByGridPos(row: number, col: number) {
      if (this.timetable === null) return [];
      const day = DAYS[col - 1];
      return Object.entries(this.timetable)
        .flatMap(([subject, entries]) =>
          entries
            .filter(
              (entry) => entry.day === day && BLOCK_TO_ROW[entry.block] === row
            )
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
    },
    subjectColorClass: getSubjectColorClass,
    slotClasses: getSlotClasses,
  } as AlpineTimetableData;
};

export default timetableData;
