import type { AlpineComponent } from "alpinejs";
import {
  fetchAvanzadoStudents,
  matchStudentAvanzado,
  unmatchStudentAvanzado,
  type AvanzadoStudent,
  type AvanzadoMatch,
} from "../../APIcalls/avanzados";
import { fetchOfferings, type OfferingWithSlots } from "../../APIcalls/offeringTimeSlots";
import { fetchCourses } from "../../APIcalls/dashboard";
import { getSubjectColorClass } from "../../timetableColors";

type Students = AvanzadoStudent[];
type Offerings = OfferingWithSlots[];
type Courses = Awaited<ReturnType<typeof fetchCourses>>;
type Course = Courses[number];

const LEVELS = [3, 4];

const avanzadosPageData = () =>
  ({
    loading: true,
    saving: false,
    error: null as string | null,
    year: new Date().getFullYear(),
    activeLevel: 3 as number,
    filter: { courseId: NaN as number },
    students: [] as Students,
    allCourses: [] as Courses,
    allOfferings: [] as Offerings,
    editMatch: { student: null as AvanzadoStudent | null },
    get levelOptions() {
      return LEVELS.map((level) => ({ value: level, label: String(level) }));
    },
    get avanzadoOfferingsForLevel() {
      return (this.allOfferings as Offerings).filter(
        (o) => o.kind === "OPTIONAL" && o.semester === "SECOND" && o.level === this.activeLevel,
      );
    },
    get studentsForActiveLevel() {
      return (this.students as Students).filter((s) => s.level === this.activeLevel);
    },
    get courseFilterOptions() {
      return [{ value: NaN, label: "Todos" }].concat(
        (this.allCourses as Course[])
          .filter(
            (c) =>
              c.name.startsWith("NR") &&
              Number(c.name[2]) === this.activeLevel &&
              c.year === this.year,
          )
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
          .map((c) => ({ value: c.id, label: c.name })),
      );
    },
    get filteredStudents() {
      return (this.studentsForActiveLevel as Students).filter(
        (s) => isNaN(this.filter.courseId) || s.courseId === this.filter.courseId,
      );
    },
    availableOfferingsForStudent(student: AvanzadoStudent | null) {
      if (!student) return [];
      return (this.avanzadoOfferingsForLevel as Offerings).filter((o) =>
        o.courses.some((c) => c.courseId === student.courseId),
      );
    },
    isMatched(student: AvanzadoStudent | null, offeringId: number): boolean {
      if (!student) return false;
      return student.avanzados.some((a: AvanzadoMatch) => a.offeringId === offeringId);
    },
    colorClass(match: { displayName: string }): string {
      return getSubjectColorClass(match.displayName);
    },
    init() {
      Promise.all([
        fetchAvanzadoStudents(this.year),
        fetchCourses(),
        fetchOfferings(this.year),
      ]).then(([students, courses, offerings]) => {
        this.students = students;
        this.allCourses = courses;
        this.allOfferings = offerings;
        this.loading = false;
      });
    },
    openEdit(student: AvanzadoStudent) {
      this.editMatch.student = student;
      this.error = null;
    },
    async toggleMatch(offeringId: number) {
      const student = this.editMatch.student as AvanzadoStudent | null;
      if (!student) return;
      this.saving = true;
      this.error = null;

      if (this.isMatched(student, offeringId)) {
        const ok = await unmatchStudentAvanzado(student.studentId, offeringId);
        this.saving = false;
        if (!ok) {
          this.error = "No se pudo quitar el avanzado. Intentá nuevamente.";
          return;
        }
        student.avanzados = student.avanzados.filter((a) => a.offeringId !== offeringId);
      } else {
        const match = await matchStudentAvanzado(student.studentId, offeringId, student.courseId);
        this.saving = false;
        if (!match) {
          this.error = "No se pudo emparejar. Intentá nuevamente.";
          return;
        }
        student.avanzados.push(match);
      }

      const idx = (this.students as Students).findIndex((s) => s.studentId === student.studentId);
      if (idx !== -1) this.students[idx] = { ...student, avanzados: [...student.avanzados] };
    },
  }) as AlpineComponent<any>;

export default avanzadosPageData;
