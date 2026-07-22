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

// Key used to bucket an offering into a group timetable. Mirrors the backend's
// composeSubjectName ("Frontend-1"): it keeps the bare subject name (dropping
// displayName's "(AC)"/"(BD)" division suffix, which the active tab already
// conveys) but preserves the offering's own `name` so two variants of the same
// subject (e.g. "Frontend" split into 1/2) stay distinct instead of one
// overwriting the other. getBaseSubjectName in timetableColors strips the
// "-<name>" suffix, so every variant still resolves to the same color.
function groupSubjectKey(offering: OfferingWithSlots): string {
  return offering.name ? `${offering.subjectName}-${offering.name}` : offering.subjectName;
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
    // Seminars aren't level-wide either — one scoped to only part of the
    // level (e.g. offered just to NR4A/NR4C) only belongs on that group's
    // tab; one spanning the whole level (all its courses fall inside the
    // group) belongs on every group's tab.
    getGroupOptionalOfferings(groupId: string | null): OfferingWithSlots[] {
      const groupOffering = (this.mandatoryOfferings as OfferingWithSlots[]).find(
        (o) => String(o.id) === groupId,
      );
      if (!groupOffering) return [];
      const groupCourseIds = new Set(groupOffering.courses.map((c) => c.courseId));
      return (this.visibleOfferings as OfferingWithSlots[]).filter(
        (o) => o.kind === "OPTIONAL" && o.courses.some((c) => groupCourseIds.has(c.courseId)),
      );
    },
    // A group tab is its own MANDATORY offering plus whichever seminars are
    // scoped to it. The label is the bare subject name (not displayName's
    // "(AC)"/"(BD)" suffix) since the active tab already says which group
    // this is.
    getGroupTimetable(groupId: string | null): TimetableBySubject {
      const groupOffering = (this.mandatoryOfferings as OfferingWithSlots[]).find(
        (o) => String(o.id) === groupId,
      );
      if (!groupOffering) return {};
      const timetable: TimetableBySubject = {};
      const offerings: OfferingWithSlots[] = [
        groupOffering,
        ...(this.getGroupOptionalOfferings(groupId) as OfferingWithSlots[]),
      ];
      for (const offering of offerings) {
        timetable[groupSubjectKey(offering)] = offering.timeSlots.map((slot) => ({
          day: WEEKDAY_TO_DAY[slot.day],
          block: slot.slot,
          room: slot.classroom ?? "",
          teacher: "",
        }));
      }
      return timetable;
    },
    // The "Seminarios Avanzados" header always reflects the detected
    // student's own enrollment, regardless of which tab (Propios/AC/BD) is
    // active — TimetableGrid additionally hides the header entirely unless
    // personalizedAvailable (i.e. a student was detected).
    getSeminars(): string[] {
      return (this.visibleOfferings as OfferingWithSlots[])
        .filter((o) => o.kind === "OPTIONAL" && o.enrolled)
        .map((o) => o.subjectName);
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
      // resolveOfferingsTimetable keys by displayName, which carries the
      // "(AC)"/"(BD)" suffix — redundant on "Propios", since it's already
      // implicitly the student's own group. Strip it just for this view
      // (the shared Docentes/Tutores lookup in studentSchedulePage.ts still
      // wants it, since a teacher hasn't picked a group from a visible tab).
      const withoutGroupSuffix = [...mandatory, ...optional].map((o) => ({
        ...o,
        displayName: o.subjectName,
      }));
      return resolveOfferingsTimetable(withoutGroupSuffix);
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
