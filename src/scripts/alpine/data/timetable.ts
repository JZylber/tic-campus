import type { AlpineComponent } from "alpinejs";
import {
  getSlotsAtGridPos,
  type TimetableBySubject,
  type TimetableEntry,
} from "../../timetableLayout";
import {
  getSubjectColorClass,
  getSubjectSecondaryTextClass,
} from "../../timetableColors";

export type { TimetableEntry, TimetableBySubject };

type TimetableState = "loading" | "error" | "empty" | "ready";

type AlpineTimetableData = AlpineComponent<{
  timetable: TimetableBySubject | null;
  seminars: Array<string> | null;
  error: boolean;
  readonly state: TimetableState;
  setTimetable: (timetable: TimetableBySubject) => void;
  setSeminars: (seminars: Array<string>) => void;
  setError: () => void;
  getSeminars: () => Array<string> | null;
  getTimetableByGridPos: (
    row: number,
    col: number,
    personalized?: boolean
  ) => Array<{ subject: string; room: string; teacher: string }>;
  subjectColorClass: (subject: string) => string;
  subjectSecondaryTextClass: (subject: string) => string;
  slotClasses: (subject: string) => string;
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
    getSeminars() {
      return this.seminars;
    },
    getTimetableByGridPos(row: number, col: number) {
      return getSlotsAtGridPos(this.timetable, row, col);
    },
    subjectColorClass: getSubjectColorClass,
    subjectSecondaryTextClass: getSubjectSecondaryTextClass,
    slotClasses: getSubjectColorClass,
  } as AlpineTimetableData;
};

export default timetableData;
