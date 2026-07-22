import type { AlpineComponent } from "alpinejs";
import { fetchOfferings, type OfferingWithSlots, type Semester } from "../../APIcalls/offeringTimeSlots";
import { matchesSemesterFilter, defaultCuatrimestre } from "../../offeringSemester";
import { fetchCourses, fetchStudents, type Course, type Student } from "../../APIcalls/dashboard";
import { getSlotsAtGridPos, type TimetableBySubject } from "../../timetableLayout";
import { resolveOfferingsTimetable } from "../../timetableResolve";
import { getSubjectColorClass, getSubjectSecondaryTextClass } from "../../timetableColors";

type TimetableState = "empty" | "ready";

const studentSchedulePageData = () =>
  ({
    loading: true,
    year: new Date().getFullYear(),
    level: NaN as number,
    courseId: NaN as number,
    studentId: NaN as number,
    cuatrimestre: defaultCuatrimestre() as Semester,
    offerings: [] as OfferingWithSlots[],
    allCourses: [] as Course[],
    allStudents: [] as Student[],
    get levelOptions() {
      const courses = (this.allCourses as Course[]).filter((c) => c.year === this.year);
      return [3, 4, 5].map((level) => ({
        value: level,
        label: level.toString(),
        disabled: !courses.some((c) => Number(c.name[2] || 0) === level),
      }));
    },
    get courseOptions() {
      if (isNaN(this.level)) return [];
      return (this.allCourses as Course[])
        .filter((c) => c.year === this.year && Number(c.name[2] || 0) === this.level)
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .map((c) => ({ value: c.id, label: c.name }));
    },
    get studentOptions() {
      if (isNaN(this.courseId)) return [];
      return (this.allStudents as Student[])
        .filter((s) => s.courses.some((c) => c.courseId === this.courseId))
        .sort((a, b) => a.surname.localeCompare(b.surname, "es"))
        .map((s) => ({ value: Number(s.id), label: `${s.surname}, ${s.name}` }));
    },
    get cuatrimestreOptions() {
      return [
        { value: "FIRST", label: "1er Cuatrimestre" },
        { value: "SECOND", label: "2do Cuatrimestre" },
      ];
    },
    get selectedStudent(): Student | null {
      return (
        (this.allStudents as Student[]).find((s) => Number(s.id) === this.studentId) ?? null
      );
    },
    get state(): TimetableState {
      return this.selectedStudent ? "ready" : "empty";
    },
    get seminars() {
      return null;
    },
    get resolvedTimetable(): TimetableBySubject {
      const student = this.selectedStudent as Student | null;
      if (!student) return {};

      const mandatory = (this.offerings as OfferingWithSlots[]).filter(
        (o) =>
          o.kind === "MANDATORY" &&
          o.courses.some((c) => c.courseId === this.courseId) &&
          matchesSemesterFilter(o.semester, this.cuatrimestre),
      );
      const optional = (this.offerings as OfferingWithSlots[]).filter(
        (o) =>
          o.kind === "OPTIONAL" &&
          student.optionalOfferingIds.includes(o.id) &&
          matchesSemesterFilter(o.semester, this.cuatrimestre),
      );

      return resolveOfferingsTimetable([...mandatory, ...optional]);
    },
    getTimetableByGridPos(row: number, col: number) {
      return getSlotsAtGridPos(this.resolvedTimetable, row, col);
    },
    subjectColorClass: getSubjectColorClass,
    subjectSecondaryTextClass: getSubjectSecondaryTextClass,
    slotClasses: getSubjectColorClass,
    async init() {
      const [courses, students, offerings] = await Promise.all([
        fetchCourses(),
        fetchStudents(),
        fetchOfferings(this.year),
      ]);
      this.allCourses = courses;
      this.allStudents = students;
      this.offerings = offerings;
      this.loading = false;
      this.$watch("level", () => {
        this.courseId = NaN;
        this.studentId = NaN;
      });
      this.$watch("courseId", () => {
        this.studentId = NaN;
      });
    },
  }) as AlpineComponent<any>;

export default studentSchedulePageData;
