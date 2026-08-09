import type { AlpineComponent } from "alpinejs";
import { fetchOfferings, type OfferingWithSlots, type Semester } from "../../APIcalls/offeringTimeSlots";
import { fetchOfferingStudents, type OfferingStudent } from "../../APIcalls/offerings";
import { matchesSemesterFilter, defaultCuatrimestre } from "../../offeringSemester";
import { toCsv, downloadCsv, slugify } from "../../csv";

type Offerings = OfferingWithSlots[];
type Students = OfferingStudent[];

// Avanzados/seminars are the only OPTIONAL offerings level 3/4 courses carry
// today, and rosters for those already have a dedicated screen — but this
// page doesn't special-case kind, it just lists whatever's on offer for the
// level/cuatrimestre so it keeps working if that changes.
const LEVELS = [3, 4];

const listadosPageData = () =>
  ({
    loading: true,
    loadingRoster: false,
    year: new Date().getFullYear(),
    semester: defaultCuatrimestre() as Semester,
    activeLevel: 3 as number,
    offeringId: NaN as number,
    allOfferings: [] as Offerings,
    students: [] as Students,
    get semesterOptions() {
      return [
        { value: "FIRST", label: "1er Cuatrimestre" },
        { value: "SECOND", label: "2do Cuatrimestre" },
      ];
    },
    get levelOptions() {
      return LEVELS.map((level) => ({ value: level, label: String(level) }));
    },
    get filteredOfferings() {
      return (this.allOfferings as Offerings)
        .filter(
          (o) =>
            o.level === this.activeLevel &&
            matchesSemesterFilter(o.semester, this.semester) &&
            // NR specialty only — NI3x/NI4x courses don't take part in these
            // listados, same exclusion as the avanzados admin tab.
            o.courses.length > 0 &&
            o.courses.every((c) => c.courseName.startsWith("NR")),
        )
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
    },
    get offeringOptions() {
      return (this.filteredOfferings as Offerings).map((o) => ({
        value: o.id,
        label: o.displayName,
      }));
    },
    get selectedOffering(): OfferingWithSlots | null {
      return (
        (this.filteredOfferings as Offerings).find((o) => o.id === this.offeringId) ?? null
      );
    },
    async loadRoster() {
      if (isNaN(this.offeringId)) {
        this.students = [];
        return;
      }
      this.loadingRoster = true;
      this.students = await fetchOfferingStudents(this.offeringId);
      this.loadingRoster = false;
    },
    async init() {
      this.allOfferings = await fetchOfferings(this.year);
      this.loading = false;
      this.$watch("offeringId", () => {
        this.loadRoster();
      });
    },
    download() {
      if ((this.students as Students).length === 0) return;
      const rows = (this.students as Students).map((s) => [
        s.surname,
        s.name,
        s.email,
        s.dni,
        s.courseName,
      ]);
      const csv = toCsv(["Apellido", "Nombre", "Email", "DNI", "Curso"], rows);
      const offering = this.selectedOffering as OfferingWithSlots | null;
      const label = offering ? offering.displayName : "listado";
      downloadCsv(`${slugify(label)}-nivel${this.activeLevel}-${this.year}.csv`, csv);
    },
  }) as AlpineComponent<any>;

export default listadosPageData;
