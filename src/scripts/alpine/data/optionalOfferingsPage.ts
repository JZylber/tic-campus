import type { AlpineComponent } from "alpinejs";
import {
  fetchOptionalOfferings,
  fetchSubjectsCatalog,
  createOptionalOffering,
  updateOptionalOffering,
  deleteOptionalOffering,
} from "../../APIcalls/optionalOfferings";
import { fetchCourses } from "../../APIcalls/dashboard";

type Offerings = Awaited<ReturnType<typeof fetchOptionalOfferings>>;
type Offering = Offerings[number];
type SubjectsCatalog = Awaited<ReturnType<typeof fetchSubjectsCatalog>>;
type Courses = Awaited<ReturnType<typeof fetchCourses>>;
type Course = Courses[number];

const optionalOfferingsPageData = () =>
  ({
    loading: true,
    saving: false,
    error: null as string | null,
    year: new Date().getFullYear(),
    activeLevel: 3 as number,
    offerings: [] as Offerings,
    subjectsCatalog: [] as SubjectsCatalog,
    allCourses: [] as Courses,
    createForm: {
      subjectId: NaN as number,
      courseIds: [] as number[],
      name: "" as string,
      semester: "FIRST" as Offering["semester"],
    },
    editForm: {
      offering: null as Offering | null,
      courseIds: [] as number[],
      name: "" as string,
      semester: "FIRST" as Offering["semester"],
    },
    get levelOptions() {
      return [
        { value: 3, label: "3" },
        { value: 4, label: "4" },
      ];
    },
    get semesterOptions() {
      return [
        { value: "FIRST", label: "1er Cuatrimestre" },
        { value: "SECOND", label: "2do Cuatrimestre" },
        { value: "BOTH", label: "Anual" },
      ];
    },
    get subjectOptions() {
      return (this.subjectsCatalog as SubjectsCatalog).map((s) => ({
        value: s.id,
        label: s.name,
      }));
    },
    get coursesForActiveLevel() {
      return (this.allCourses as Course[])
        .filter((c) => {
          if (Number(c.name[2]) !== this.activeLevel || c.year !== this.year) {
            return false;
          }
          // NI4 is a different specialty from NR4 — only NR courses take part
          // in TIC Campus optional offerings at level 4.
          if (this.activeLevel === 4 && !c.name.startsWith("NR")) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
    },
    get offeringsForActiveLevel() {
      return (this.offerings as Offerings).filter(
        (o) => o.level === this.activeLevel,
      );
    },
    courseNamesList(offering: Offering): string {
      return [...offering.courses]
        .map((c) => c.courseName)
        .sort((a, b) => a.localeCompare(b, "es"))
        .join(", ");
    },
    semesterLabel(semester: Offering["semester"]): string {
      return this.semesterOptions.find((o: { value: string }) => o.value === semester)?.label ?? "";
    },
    init() {
      Promise.all([
        fetchOptionalOfferings(this.year),
        fetchSubjectsCatalog(),
        fetchCourses(),
      ]).then(([offerings, subjects, courses]) => {
        this.offerings = offerings;
        this.subjectsCatalog = subjects;
        this.allCourses = courses;
        this.loading = false;
      });
    },
    openCreate() {
      this.createForm = { subjectId: NaN, courseIds: [], name: "", semester: "FIRST" };
      this.error = null;
    },
    toggleCreateCourse(courseId: number) {
      const idx = this.createForm.courseIds.indexOf(courseId);
      if (idx === -1) this.createForm.courseIds.push(courseId);
      else this.createForm.courseIds.splice(idx, 1);
    },
    async submitCreate() {
      if (isNaN(this.createForm.subjectId) || this.createForm.courseIds.length === 0) {
        return false;
      }
      this.saving = true;
      this.error = null;
      const created = await createOptionalOffering({
        subjectId: this.createForm.subjectId,
        year: this.year,
        courseIds: this.createForm.courseIds,
        name: this.createForm.name.trim() || null,
        semester: this.createForm.semester,
      });
      this.saving = false;
      if (!created) {
        this.error = "No se pudo crear la optativa. Intentá nuevamente.";
        return false;
      }
      this.offerings.push(created);
      return true;
    },
    openEdit(offering: Offering) {
      this.editForm = {
        offering,
        courseIds: offering.courses.map((c) => c.courseId),
        name: offering.name ?? "",
        semester: offering.semester,
      };
      this.error = null;
    },
    toggleEditCourse(courseId: number) {
      const idx = this.editForm.courseIds.indexOf(courseId);
      if (idx === -1) this.editForm.courseIds.push(courseId);
      else this.editForm.courseIds.splice(idx, 1);
    },
    async saveEdit() {
      if (!this.editForm.offering || this.editForm.courseIds.length === 0) {
        return false;
      }
      this.saving = true;
      this.error = null;
      const updated = await updateOptionalOffering(this.editForm.offering.id, {
        courseIds: this.editForm.courseIds,
        name: this.editForm.name.trim() || null,
        semester: this.editForm.semester,
      });
      this.saving = false;
      if (!updated) {
        this.error =
          "No se pudo guardar. Puede que haya alumnos inscriptos en algún curso que intentaste quitar.";
        return false;
      }
      const idx = (this.offerings as Offerings).findIndex(
        (o) => o.id === updated.id,
      );
      if (idx !== -1) this.offerings[idx] = updated;
      return true;
    },
    async removeOffering(id: number) {
      if (!window.confirm("¿Eliminar esta optativa?")) return;
      this.error = null;
      const ok = await deleteOptionalOffering(id);
      if (!ok) {
        this.error =
          "No se pudo eliminar. Puede que haya alumnos inscriptos o revisiones asociadas.";
        return;
      }
      this.offerings = (this.offerings as Offerings).filter((o) => o.id !== id);
    },
  }) as AlpineComponent<any>;

export default optionalOfferingsPageData;
