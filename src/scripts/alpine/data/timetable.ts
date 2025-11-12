import type { AlpineComponent } from "alpinejs";
import { getStudentSeminars, getTimetable } from "../../fetchData";
import type { PageDataStore } from "../stores/pageData";

const daysOfWeek = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

type AlpineTimetableData = AlpineComponent<{
  timetable: {
    [key: string]: Array<{
      day: string;
      block: number;
      room: string;
      teacher: string;
    }>;
  } | null;
  seminars: Array<string> | null;
  setTimetable: (dataSheetId: string) => void;
  setSeminars: (dataSheetId: string, studentId: number) => Promise<void>;
  getTimetableByGridPos: (
    row: number,
    col: number
  ) => Array<{
    subject: string;
    room: string;
    teacher: string;
  }>;
}>;

const timetableData = () => {
  return {
    timetable: null,
    seminars: null,
    init() {
      this.$watch("$store.pageData.dataSheetId", (dataSheetId: string) => {
        this.setTimetable(dataSheetId);
      });
    },
    async setTimetable(dataSheetId: string) {
      this.timetable = await getTimetable(dataSheetId);
    },
    async setSeminars(dataSheetId: string, studentId: number) {
      this.seminars = await getStudentSeminars(studentId, dataSheetId);
    },
    getTimetableByGridPos(row: number, col: number) {
      const slots = [];
      if (this.timetable !== null) {
        for (const [subject, blocks] of Object.entries(this.timetable)) {
          for (const block of blocks) {
            slots.push({
              coordinates: [
                block.block + (block.block > 3 ? 1 : 0), // Adjust for the 4th block being a different row
                daysOfWeek.indexOf(block.day) + 1,
              ],
              data: {
                subject,
                room: block.room,
                teacher: block.teacher,
              },
            });
          }
        }
      }
      // Sort by "Proyecto" last
      return slots
        .filter((slot) => {
          return slot.coordinates[0] === row && slot.coordinates[1] === col;
        })
        .map((slot) => slot.data)
        .sort((a, b) => {
          if (a.subject === "Proyecto") return 1;
          if (b.subject === "Proyecto") return -1;
          return 0;
        });
    },
  } as AlpineTimetableData;
};

export default timetableData;
