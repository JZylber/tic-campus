import type { AlpineComponent } from "alpinejs";
import { fetchOfferings, type OfferingWithSlots, type Semester } from "../../APIcalls/offeringTimeSlots";
import { matchesSemesterFilter, defaultCuatrimestre } from "../../offeringSemester";
import { getSlotsAtGridPos } from "../../timetableLayout";
import { getSubjectColorClass, getSubjectSecondaryTextClass } from "../../timetableColors";
import { mandatoryOfferingsOf, groupTabsOf, fullGroupTimetableOf } from "../../proyectoTimetableGroups";

type State = "loading" | "ready";

// Backs the dashboard's Información › Grilla view: the whole weekly
// timetable for a level, every subject included, split into rotation-group
// tabs (AC/BD) — the same complete schedule a student in that group sees,
// just without picking an individual student first. There's no "Propios"
// tab here (TimetableGrid's showPersonalizedTab={false}); both levels are
// reachable from one page via a level toggle instead of one page per
// (year, level).
//
// "Proyecto" is the only subject that actually splits a level into rotation
// groups (its own MANDATORY offerings are what define "AC"/"BD"), so its
// offerings are still what groupTabs is built from. Every other subject —
// whole-level offerings like Matemática as well as scoped seminars — gets
// merged into whichever rotation group(s) its courses overlap, via
// fullGroupTimetableOf. This is the distinction from proyectoHorarioPage.ts
// (the student's per-level Proyecto-only page), which deliberately shows
// just the Proyecto+seminars slice via groupTimetableOf.
const grillaPageData = () =>
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
    get visibleOfferings(): OfferingWithSlots[] {
      return (this.offerings as OfferingWithSlots[]).filter((o) =>
        matchesSemesterFilter(o.semester, this.cuatrimestre),
      );
    },
    get levelOfferings(): OfferingWithSlots[] {
      return (this.visibleOfferings as OfferingWithSlots[]).filter((o) => o.level === this.level);
    },
    // Proyecto-only, and only its MANDATORY (rotation-defining) offerings —
    // the anchor used purely to derive the tabs themselves, not the grid
    // content.
    get proyectoMandatoryOfferings(): OfferingWithSlots[] {
      return mandatoryOfferingsOf(
        (this.levelOfferings as OfferingWithSlots[]).filter((o) => o.subjectName === "Proyecto"),
      );
    },
    get levelTabs() {
      return groupTabsOf(this.proyectoMandatoryOfferings as OfferingWithSlots[]);
    },
    getTimetableByGridPos(row: number, col: number, _personalized: boolean, activeTab: string | null) {
      const timetable = fullGroupTimetableOf(
        activeTab,
        this.proyectoMandatoryOfferings as OfferingWithSlots[],
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

export default grillaPageData;
