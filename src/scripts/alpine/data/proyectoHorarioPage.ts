import type { AlpineComponent } from "alpinejs";
import { fetchPublicOfferingSchedule, type OfferingWithSlots, type Semester } from "../../APIcalls/offeringTimeSlots";
import { matchesSemesterFilter, defaultCuatrimestre } from "../../offeringSemester";
import { WEEKDAY_TO_DAY, getSlotsAtGridPos, type TimetableBySubject } from "../../timetableLayout";
import { resolveOfferingsTimetable } from "../../timetableResolve";
import { getSubjectColorClass, getSubjectSecondaryTextClass } from "../../timetableColors";
import type { AlpineStudentStore } from "../stores/student";

type State = "loading" | "ready";

// buildDisplayName (backend) renders "Proyecto (AC)" for an offering that only
// covers part of the level's courses, and bare "Proyecto" for one covering the
// whole level — this is the inverse, turning that into a tab label.
function groupLabelFor(displayName: string): string {
  const match = displayName.match(/\(([^)]+)\)\s*$/);
  return match ? match[1] : "Todos";
}

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
    // Distinct MANDATORY offerings for the level — a level can have several
    // (e.g. level 4's AC/BD rotation groups), each rendered as its own tab
    // instead of merged into one grid.
    get mandatoryOfferings() {
      return (this.visibleOfferings as OfferingWithSlots[]).filter((o) => o.kind === "MANDATORY");
    },
    get groupTabs() {
      return (this.mandatoryOfferings as OfferingWithSlots[])
        .map((o) => ({ id: String(o.id), label: groupLabelFor(o.displayName) }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    // Each group tab is exactly one MANDATORY offering — seminars are shown
    // separately above (the "Seminarios Avanzados" pills), so they aren't
    // repeated here, and the label is the bare subject name (not
    // displayName's "(AC)"/"(BD)" suffix) since the active tab already says
    // which group this is.
    getGroupTimetable(groupId: string | null): TimetableBySubject {
      const offering = (this.visibleOfferings as OfferingWithSlots[]).find(
        (o) => o.kind === "MANDATORY" && String(o.id) === groupId,
      );
      if (!offering) return {};
      return {
        [offering.subjectName]: offering.timeSlots.map((slot) => ({
          day: WEEKDAY_TO_DAY[slot.day],
          block: slot.slot,
          room: slot.classroom ?? "",
          teacher: "",
        })),
      };
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
    getTimetableByGridPos(
      row: number,
      col: number,
      personalized = false,
      groupId: string | null = null,
    ) {
      const timetable = personalized
        ? this.personalizedTimetable
        : this.getGroupTimetable(groupId ?? (this.groupTabs[0]?.id ?? null));
      return getSlotsAtGridPos(timetable, row, col);
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
