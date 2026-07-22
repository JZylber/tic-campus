import type { AlpineComponent } from "alpinejs";
import { fetchPublicOfferingSchedule, type OfferingWithSlots, type Semester } from "../../APIcalls/offeringTimeSlots";
import { matchesSemesterFilter, defaultCuatrimestre } from "../../offeringSemester";
import { WEEKDAY_TO_DAY, getSlotsAtGridPos, type TimetableBySubject } from "../../timetableLayout";
import {
  getSlotClasses,
  getSubjectColorClass,
  getSubjectSecondaryTextClass,
} from "../../timetableColors";
import type { AlpineStudentStore } from "../stores/student";

type State = "loading" | "ready";

const proyectoHorarioPageData = (year: number, level: number) =>
  ({
    loading: true,
    year,
    level,
    cuatrimestre: defaultCuatrimestre() as Semester,
    offerings: [] as OfferingWithSlots[],
    studentDetected: false,
    get cuatrimestreOptions() {
      return [
        { value: "FIRST", label: "1er Cuatrimestre" },
        { value: "SECOND", label: "2do Cuatrimestre" },
      ];
    },
    get visibleOfferings() {
      return (this.offerings as OfferingWithSlots[]).filter((o) =>
        matchesSemesterFilter(o.semester, this.cuatrimestre),
      );
    },
    get timetable(): TimetableBySubject {
      const timetable: TimetableBySubject = {};
      for (const offering of this.visibleOfferings as OfferingWithSlots[]) {
        timetable[offering.displayName] = offering.timeSlots.map((slot) => ({
          day: WEEKDAY_TO_DAY[slot.day],
          block: slot.slot,
          room: slot.classroom ?? "",
          teacher: "",
        }));
      }
      return timetable;
    },
    get seminars() {
      const optional = (this.visibleOfferings as OfferingWithSlots[]).filter(
        (o) => o.kind === "OPTIONAL",
      );
      const mine = optional.filter((o) => o.enrolled);
      return (this.studentDetected ? mine : optional).map((o) => o.displayName);
    },
    get personalizedAvailable() {
      return this.studentDetected;
    },
    get state(): State {
      return this.loading ? "loading" : "ready";
    },
    getTimetableByGridPos(row: number, col: number) {
      return getSlotsAtGridPos(this.timetable, row, col);
    },
    subjectColorClass: getSubjectColorClass,
    subjectSecondaryTextClass: getSubjectSecondaryTextClass,
    slotClasses: getSlotClasses,
    async init() {
      const studentStore = Alpine.store("student") as AlpineStudentStore;
      await studentStore.getStudentData("Proyecto", this.year);
      this.studentDetected = studentStore.id !== "";
      this.offerings = await fetchPublicOfferingSchedule(
        "Proyecto",
        this.year,
        this.level,
        studentStore.id || "0",
      );
      this.loading = false;
    },
  }) as AlpineComponent<any>;

export default proyectoHorarioPageData;
