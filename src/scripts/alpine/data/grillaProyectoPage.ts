import type { AlpineComponent } from "alpinejs";
import { fetchOfferings, type OfferingWithSlots, type Semester } from "../../APIcalls/offeringTimeSlots";
import { matchesSemesterFilter, defaultCuatrimestre } from "../../offeringSemester";
import { getSlotsAtGridPos } from "../../timetableLayout";
import { getSubjectColorClass, getSubjectSecondaryTextClass } from "../../timetableColors";
import { mandatoryOfferingsOf, groupTabsOf, groupTimetableOf } from "../../proyectoTimetableGroups";

type State = "loading" | "ready";

// Backs the dashboard's Información › Grilla view — the staff-facing
// counterpart of the student's per-level Proyecto horario page
// (alpine/data/proyectoHorarioPage.ts), reusing the same rotation-group
// logic but without any individual-student personalization: there's no
// "Propios" tab here (TimetableGrid's showPersonalizedTab={false}), and
// both levels are reachable from one page via a level toggle instead of
// one page per (year, level).
const grillaProyectoPageData = () =>
  ({
    loading: true,
    year: new Date().getFullYear(),
    level: 3,
    cuatrimestre: defaultCuatrimestre() as Semester,
    offerings: [] as OfferingWithSlots[],
    get levelOptions() {
      return [3, 4].map((level) => ({ value: level, label: level.toString() }));
    },
    get cuatrimestreOptions() {
      return [
        { value: "FIRST", label: "1er Cuatrimestre" },
        { value: "SECOND", label: "2do Cuatrimestre" },
      ];
    },
    // fetchOfferings(year) returns every offering for the year, not just
    // Proyecto's — the public per-level endpoint proyectoHorarioPage.ts uses
    // scopes this server-side instead, but that endpoint doesn't accept a
    // JWT-authenticated caller's role the way this dashboard view needs to
    // reuse the same fetch pattern as the rest of Información, so it's
    // filtered client-side here.
    get visibleOfferings(): OfferingWithSlots[] {
      return (this.offerings as OfferingWithSlots[]).filter(
        (o) => o.subjectName === "Proyecto" && matchesSemesterFilter(o.semester, this.cuatrimestre),
      );
    },
    get levelOfferings(): OfferingWithSlots[] {
      return (this.visibleOfferings as OfferingWithSlots[]).filter((o) => o.level === this.level);
    },
    get mandatoryOfferings(): OfferingWithSlots[] {
      return mandatoryOfferingsOf(this.levelOfferings as OfferingWithSlots[]);
    },
    get levelTabs() {
      return groupTabsOf(this.mandatoryOfferings as OfferingWithSlots[]);
    },
    getTimetableByGridPos(row: number, col: number, _personalized: boolean, activeTab: string | null) {
      const timetable = groupTimetableOf(
        activeTab,
        this.mandatoryOfferings as OfferingWithSlots[],
        this.levelOfferings as OfferingWithSlots[],
      );
      return getSlotsAtGridPos(timetable, row, col);
    },
    // No "Propios" tab in this view (showPersonalizedTab={false}), but
    // TimetableGrid's x-effect calls this unconditionally regardless, so it
    // must exist.
    getSeminars(): string[] {
      return [];
    },
    get state(): State {
      return this.loading ? "loading" : "ready";
    },
    subjectColorClass: getSubjectColorClass,
    subjectSecondaryTextClass: getSubjectSecondaryTextClass,
    slotClasses: getSubjectColorClass,
    async init() {
      this.offerings = await fetchOfferings(this.year);
      this.loading = false;
    },
  }) as AlpineComponent<any>;

export default grillaProyectoPageData;
