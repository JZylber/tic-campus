import type { AlpineComponent } from "alpinejs";
import {
  fetchSubjectsCatalog,
  createOffering,
  updateOffering,
  deleteOffering,
  type Offering,
  type OfferingKind,
} from "../../APIcalls/offerings";
import { fetchOfferings } from "../../APIcalls/offeringTimeSlots";
import { fetchCourses } from "../../APIcalls/dashboard";

type Offerings = Offering[];
type SubjectsCatalog = Awaited<ReturnType<typeof fetchSubjectsCatalog>>;
type Courses = Awaited<ReturnType<typeof fetchCourses>>;
type Course = Courses[number];

const LEVELS = [3, 4, 5];

const offeringsPageData = () =>
  ({
    loading: true,
    saving: false,
    error: null as string | null,
    year: new Date().getFullYear(),
    activeKind: "MANDATORY" as OfferingKind,
    activeLevel: 3 as number,
    offerings: [] as Offerings,
    subjectsCatalog: [] as SubjectsCatalog,
    allCourses: [] as Courses,
    createForm: {
      subjectId: NaN as number,
      kind: "MANDATORY" as OfferingKind,
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
    get kindOptions() {
      return [
        { value: "MANDATORY", label: "Obligatorias" },
        { value: "OPTIONAL", label: "Optativas" },
      ];
    },
    get levelOptions() {
      return LEVELS.map((level) => ({ value: level, label: String(level) }));
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
    coursesForKind(kind: OfferingKind) {
      return (this.allCourses as Course[])
        .filter((c) => {
          if (Number(c.name[2]) !== this.activeLevel || c.year !== this.year) {
            return false;
          }
          // NI4 is a different specialty from NR4 — only NR courses take part
          // in TIC Campus optional seminars at level 4. Mandatory subjects
          // apply to every specialty, so this exclusion is optional-only.
          if (kind === "OPTIONAL" && this.activeLevel === 4 && !c.name.startsWith("NR")) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
    },
    get createCourses() {
      return this.coursesForKind(this.createForm.kind);
    },
    get editCourses() {
      return this.coursesForKind(this.editForm.offering?.kind ?? "MANDATORY");
    },
    get offeringsForActiveLevel() {
      return (this.offerings as Offerings).filter(
        (o) => o.level === this.activeLevel && o.kind === this.activeKind,
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
        fetchOfferings(this.year),
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
      this.createForm = {
        subjectId: NaN,
        kind: this.activeKind,
        courseIds: [],
        name: "",
        semester: "FIRST",
      };
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
      const created = await createOffering({
        subjectId: this.createForm.subjectId,
        kind: this.createForm.kind,
        year: this.year,
        courseIds: this.createForm.courseIds,
        name: this.createForm.name.trim() || null,
        semester: this.createForm.semester,
      });
      this.saving = false;
      if (!created) {
        this.error = "No se pudo crear la materia. Intentá nuevamente.";
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
      const updated = await updateOffering(this.editForm.offering.id, {
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
      if (!window.confirm("¿Eliminar esta materia?")) return;
      this.error = null;
      const ok = await deleteOffering(id);
      if (!ok) {
        this.error =
          "No se pudo eliminar. Puede que haya alumnos inscriptos o revisiones asociadas.";
        return;
      }
      this.offerings = (this.offerings as Offerings).filter((o) => o.id !== id);
    },
  }) as AlpineComponent<any>;

export default offeringsPageData;
