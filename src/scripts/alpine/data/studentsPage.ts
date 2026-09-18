import type { AlpineComponent } from "alpinejs";
import type { AlpineStudentStore } from "../stores/student";
import {
  fetchStudents,
  fetchCourses,
  updateStudent,
  enrollStudentInCourse,
  moveStudentCourse,
  removeStudentFromCourse,
} from "../../APIcalls/dashboard";
import type { DroppedOffering } from "../../APIcalls/dashboard";

type Students = Awaited<ReturnType<typeof fetchStudents>>;
type Student = Students[number];
type CourseEnrollment = Student["courses"][number];
type Courses = Awaited<ReturnType<typeof fetchCourses>>;
type Course = Courses[number];

const listOfferingNames = (offerings: DroppedOffering[]) =>
  offerings.map((o) => o.displayName).join(", ");

const studentsPageData = () =>
  ({
    loading: true,
    students: [] as Students,
    allCourses: [] as Courses,
    filter: { courseId: NaN as number, text: "", year: NaN as number },
    selectedStudent: {
      student: null as Student | null,
      selectedCourse: null as CourseEnrollment | null,
      error: "",
    },
    get subjectsForCourse() {
      const { student, selectedCourse } = this.selectedStudent;
      if (!student || !selectedCourse) return [];
      const courseId = selectedCourse.courseId;
      return student.subjects.filter(
        (s: Student["subjects"][number]) => s.id_course === courseId,
      );
    },
    editStudent: {
      student: null as Student | null,
      form: { name: "", surname: "", dni: "", email: "" },
      saving: false,
      error: null as string | null,
      courseAction: null as
        | { type: "add" }
        | { type: "change"; oldCourseId: number }
        | null,
      courseActionId: NaN as number,
      // Optional subjects a course move or removal just took away. Not an
      // error — the change went through — but the admin has to see it.
      notice: null as string | null,
    },
    get yearFilterOptions() {
      return [{ value: NaN, label: "Todos" }].concat(
        [...new Set((this.allCourses as Course[]).map((c) => c.year))]
          .sort((a, b) => b - a)
          .map((year) => ({ value: year, label: year.toString() })),
      );
    },
    get courseFilterOptions() {
      const pool = isNaN(this.filter.year)
        ? (this.allCourses as Course[])
        : (this.allCourses as Course[]).filter((c) => c.year === this.filter.year);
      return [{ value: NaN, label: "Todos" }].concat(
        [...pool]
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
          .map((c) => ({ value: c.id, label: c.name })),
      );
    },
    get enrolledCourseIds() {
      if (!this.editStudent.student) return new Set<number>();
      return new Set(
        this.editStudent.student.courses.map((c: CourseEnrollment) => c.courseId),
      );
    },
    get availableCoursesForAction() {
      const enrolled = this.enrolledCourseIds;
      return (this.allCourses as Course[]).filter((c) => !enrolled.has(c.id));
    },
    init() {
      Promise.all([fetchStudents(), fetchCourses()]).then(([students, courses]) => {
        this.allCourses = courses;
        this.students = students.sort((a, b) => {
          const aMaxYear = a.courses.length
            ? Math.max(...a.courses.map((c) => c.year))
            : 0;
          const bMaxYear = b.courses.length
            ? Math.max(...b.courses.map((c) => c.year))
            : 0;
          if (aMaxYear !== bMaxYear) return bMaxYear - aMaxYear;
          if (a.surname < b.surname) return -1;
          if (a.surname > b.surname) return 1;
          return 0;
        });
        this.filter.text = "";
        this.loading = false;
      });
    },
    get filteredStudents() {
      return this.students
        .filter((s: Student) => {
          let courseFilter = true;
          let textFilter = true;
          let yearFilter = true;
          const normalizedText = this.filter.text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "");
          if (this.filter.text !== "") {
            textFilter =
              s.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .includes(normalizedText) ||
              s.surname
                .toLowerCase()
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .includes(normalizedText);
          }
          if (!isNaN(this.filter.courseId)) {
            courseFilter = s.courses.some((c: CourseEnrollment) => c.courseId === this.filter.courseId);
          }
          if (!isNaN(this.filter.year)) {
            yearFilter = s.courses.some((c: CourseEnrollment) => c.year === this.filter.year);
          }
          return yearFilter && textFilter && courseFilter;
        })
        .sort((a: Student, b: Student) => {
          const aMaxYear = a.courses.length
            ? Math.max(...a.courses.map((c: CourseEnrollment) => c.year))
            : 0;
          const bMaxYear = b.courses.length
            ? Math.max(...b.courses.map((c: CourseEnrollment) => c.year))
            : 0;
          if (aMaxYear !== bMaxYear) return bMaxYear - aMaxYear;
          if (a.surname < b.surname) return -1;
          if (a.surname > b.surname) return 1;
          return 0;
        });
    },
    selectStudent(student: Student) {
      this.selectedStudent.student = student;
      this.selectedStudent.selectedCourse = null;
    },
    async selectCourse(course: CourseEnrollment) {
      // Minting the token is what actually grants the view; the backend checks
      // this admin is allowed to see this student. Only advance the dialog once
      // it succeeds, so a refusal is visible instead of producing a page with
      // no marks on it.
      const studentStore = Alpine.store("student") as AlpineStudentStore;
      this.selectedStudent.error = "";
      const granted = await studentStore.impersonate(
        String(this.selectedStudent.student!.id),
        course.course,
        course.year,
      );
      if (!granted) {
        this.selectedStudent.error =
          "No se pudo abrir la vista de este estudiante.";
        return;
      }
      this.selectedStudent.selectedCourse = course;
    },
    openEdit(student: Student) {
      this.editStudent.student = student;
      this.editStudent.form = {
        name: student.name,
        surname: student.surname,
        dni: student.dni,
        email: student.email,
      };
      this.editStudent.saving = false;
      this.editStudent.error = null;
      this.editStudent.notice = null;
      this.editStudent.courseAction = null;
      this.editStudent.courseActionId = NaN;
    },
    async savePersonalData() {
      this.editStudent.saving = true;
      this.editStudent.error = null;
      const updated = await updateStudent(
        this.editStudent.student!.id,
        this.editStudent.form,
      );
      this.editStudent.saving = false;
      if (!updated) {
        this.editStudent.error = "No se pudo guardar. Intentá de nuevo.";
        return;
      }
      const idx = this.students.findIndex(
        (s: Student) => s.id === this.editStudent.student!.id,
      );
      if (idx !== -1) {
        this.students[idx] = { ...this.students[idx], ...updated };
        this.editStudent.student = this.students[idx];
      }
    },
    async confirmCourseAction() {
      if (isNaN(this.editStudent.courseActionId)) return;
      this.editStudent.saving = true;
      this.editStudent.error = null;
      this.editStudent.notice = null;
      const action = this.editStudent.courseAction!;
      const student = this.editStudent.student!;
      let result: CourseEnrollment | null = null;

      if (action.type === "add") {
        result = await enrollStudentInCourse(student.id, this.editStudent.courseActionId);
        if (result) {
          const idx = this.students.findIndex((s: Student) => s.id === student.id);
          if (idx !== -1) {
            this.students[idx].courses.push(result);
            this.editStudent.student = this.students[idx];
          }
        } else {
          this.editStudent.error = "El alumno ya está inscripto en ese curso.";
        }
      } else {
        const oldCourseId = (action as { type: "change"; oldCourseId: number })
          .oldCourseId;
        const moved = await moveStudentCourse(
          student.id,
          oldCourseId,
          this.editStudent.courseActionId,
        );
        if (moved) {
          // The optionals that could not follow the student are gone from the
          // backend already; drop them here too so the schedule and the
          // avanzados list do not keep showing subjects the student no longer has.
          const { droppedOfferings, ...enrollment } = moved;
          result = enrollment;
          const idx = this.students.findIndex((s: Student) => s.id === student.id);
          if (idx !== -1) {
            const ci = this.students[idx].courses.findIndex(
              (c: CourseEnrollment) => c.courseId === oldCourseId,
            );
            if (ci !== -1) this.students[idx].courses[ci] = enrollment;
            this.students[idx].optionalOfferingIds = this.students[
              idx
            ].optionalOfferingIds.filter(
              (id: number) => !droppedOfferings.some((o) => o.offeringId === id),
            );
            this.editStudent.student = this.students[idx];
          }
          if (droppedOfferings.length) {
            this.editStudent.notice = `Se dieron de baja optativas que no se dictan en ${enrollment.course}: ${listOfferingNames(droppedOfferings)}.`;
          }
        } else {
          this.editStudent.error = "No se pudo cambiar el curso.";
        }
      }

      this.editStudent.saving = false;
      if (result) {
        this.editStudent.courseAction = null;
        this.editStudent.courseActionId = NaN;
      }
    },
    async removeCourse(courseId: number) {
      this.editStudent.saving = true;
      this.editStudent.error = null;
      this.editStudent.notice = null;
      // An empty array is a success with nothing lost; only null is a failure.
      const droppedOfferings = await removeStudentFromCourse(
        this.editStudent.student!.id,
        courseId,
      );
      this.editStudent.saving = false;
      if (!droppedOfferings) {
        this.editStudent.error = "No se pudo eliminar el curso.";
        return;
      }
      const idx = this.students.findIndex(
        (s: Student) => s.id === this.editStudent.student!.id,
      );
      if (idx !== -1) {
        this.students[idx].courses = this.students[idx].courses.filter(
          (c: CourseEnrollment) => c.courseId !== courseId,
        );
        this.students[idx].optionalOfferingIds = this.students[
          idx
        ].optionalOfferingIds.filter(
          (id: number) => !droppedOfferings.some((o) => o.offeringId === id),
        );
        this.editStudent.student = this.students[idx];
      }
      if (droppedOfferings.length) {
        this.editStudent.notice = `Al quitar el curso también se dieron de baja: ${listOfferingNames(droppedOfferings)}.`;
      }
    },
  }) as AlpineComponent<any>;

export default studentsPageData;
