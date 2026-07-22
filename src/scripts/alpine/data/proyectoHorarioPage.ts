import type { AlpineComponent } from "alpinejs";
import { fetchPublicOfferingSchedule, type OfferingWithSlots, type Semester } from "../../APIcalls/offeringTimeSlots";
import { matchesSemesterFilter, defaultCuatrimestre } from "../../offeringSemester";
import { WEEKDAY_TO_DAY, getSlotsAtGridPos, type TimetableBySubject } from "../../timetableLayout";
import { resolveOfferingsTimetable } from "../../timetableResolve";
import { getSubjectColorClass, getSubjectSecondaryTextClass } from "../../timetableColors";
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
    studentCourse: "",
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
    // Scoped to the student's own course and enrollment, then stepped
    // through the same overlap-resolution rules as the Docentes/Tutores
    // per-student lookup (see studentSchedulePage.ts). Scoping `mandatory`
    // to the student's course matters because a level can have multiple
    // MANDATORY "Proyecto" offerings, one per division/rotation group.
    get personalizedTimetable(): TimetableBySubject {
      if (!this.studentDetected) return {};
      const offerings = this.visibleOfferings as OfferingWithSlots[];
      const mandatory = offerings.filter(
        (o) => o.kind === "MANDATORY" && o.courses.some((c) => c.courseName === this.studentCourse),
      );
      const optional = offerings.filter((o) => o.kind === "OPTIONAL" && o.enrolled);
      return resolveOfferingsTimetable([...mandatory, ...optional]);
    },
    get state(): State {
      return this.loading ? "loading" : "ready";
    },
    getTimetableByGridPos(row: number, col: number, personalized = false) {
      return getSlotsAtGridPos(personalized ? this.personalizedTimetable : this.timetable, row, col);
    },
    subjectColorClass: getSubjectColorClass,
    subjectSecondaryTextClass: getSubjectSecondaryTextClass,
    slotClasses: getSubjectColorClass,
    async init() {
      const studentStore = Alpine.store("student") as AlpineStudentStore;
      await studentStore.getStudentData("Proyecto", this.year);
      this.studentDetected = studentStore.id !== "";
      this.studentCourse = studentStore.course;
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
