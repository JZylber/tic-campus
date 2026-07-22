import type { AlpineComponent } from "alpinejs";
import {
  fetchOfferings,
  addOfferingTimeSlot,
  updateOfferingTimeSlot,
  deleteOfferingTimeSlot,
  type OfferingWithSlots,
  type OfferingTimeSlot,
  type Semester,
} from "../../APIcalls/offeringTimeSlots";
import { matchesSemesterFilter } from "../../offeringSemester";
import { fetchCourses, type Course } from "../../APIcalls/dashboard";
import {
  DAY_TO_WEEKDAY,
  WEEKDAY_TO_DAY,
  getSlotsAtGridPos,
  type TimetableBySubject,
} from "../../timetableLayout";
import { getSubjectColorClass, getSubjectSecondaryTextClass } from "../../timetableColors";

type SlotDialogState = {
  mode: "create" | "edit";
  day: string;
  block: number;
  classroom: string;
  slotId: number | null;
};

type TimetableState = "empty" | "ready";

const offeringTimeSlotsPageData = () =>
  ({
    loading: true,
    saving: false,
    error: null as string | null,
    year: new Date().getFullYear(),
    level: NaN as number,
    semesterFilter: "FIRST" as Semester,
    offeringId: NaN as number,
    offerings: [] as OfferingWithSlots[],
    allCourses: [] as Course[],
    slotDialog: {
      mode: "create",
      day: "",
      block: 0,
      classroom: "",
      slotId: null,
    } as SlotDialogState,
    get yearOptions() {
      return [...new Set((this.allCourses as Course[]).map((c) => c.year))]
        .sort((a, b) => b - a)
        .map((year) => ({ value: year, label: year.toString() }));
    },
    get levelOptions() {
      const offerings = this.offerings as OfferingWithSlots[];
      return [3, 4, 5].map((level) => ({
        value: level,
        label: level.toString(),
        disabled: !offerings.some((o) => o.level === level),
      }));
    },
    get semesterFilterOptions() {
      return [
        { value: "FIRST", label: "1er Cuatrimestre" },
        { value: "SECOND", label: "2do Cuatrimestre" },
        { value: "BOTH", label: "Anual" },
      ];
    },
    get offeringOptions() {
      if (isNaN(this.level)) return [];
      return (this.offerings as OfferingWithSlots[])
        .filter(
          (o) =>
            o.level === this.level &&
            matchesSemesterFilter(o.semester, this.semesterFilter),
        )
        .map((o) => ({ value: o.id, label: o.displayName }));
    },
    get selectedOffering(): OfferingWithSlots | null {
      return (
        (this.offerings as OfferingWithSlots[]).find(
          (o) =>
            o.id === this.offeringId &&
            o.level === this.level &&
            matchesSemesterFilter(o.semester, this.semesterFilter),
        ) ?? null
      );
    },
    get state(): TimetableState {
      return this.selectedOffering ? "ready" : "empty";
    },
    get seminars() {
      return null;
    },
    get timetable(): TimetableBySubject {
      const offering = this.selectedOffering as OfferingWithSlots | null;
      if (!offering) return {};
      return {
        [offering.displayName]: offering.timeSlots.map((s: OfferingTimeSlot) => ({
          day: WEEKDAY_TO_DAY[s.day],
          block: s.slot,
          room: s.classroom ?? "",
          teacher: "",
        })),
      };
    },
    getTimetableByGridPos(row: number, col: number) {
      return getSlotsAtGridPos(this.timetable, row, col);
    },
    subjectColorClass: getSubjectColorClass,
    subjectSecondaryTextClass: getSubjectSecondaryTextClass,
    slotClasses: getSubjectColorClass,
    async init() {
      this.allCourses = await fetchCourses();
      await this.loadOfferingsForYear();
      this.loading = false;
      this.$watch("year", async () => {
        this.level = NaN;
        await this.loadOfferingsForYear();
      });
    },
    async loadOfferingsForYear() {
      this.error = null;
      this.offerings = await fetchOfferings(this.year);
    },
    openSlotDialog({
      day,
      block,
      slots,
    }: {
      day: string;
      block: number;
      slots: Array<{ subject: string }>;
    }) {
      const offering = this.selectedOffering as OfferingWithSlots | null;
      const existing =
        slots.length > 0 && offering
          ? offering.timeSlots.find(
              (s: OfferingTimeSlot) => WEEKDAY_TO_DAY[s.day] === day && s.slot === block,
            )
          : undefined;
      this.slotDialog = existing
        ? {
            mode: "edit",
            day,
            block,
            classroom: existing.classroom ?? "",
            slotId: existing.id,
          }
        : { mode: "create", day, block, classroom: "", slotId: null };
      this.error = null;
    },
    async submitSlotDialog(): Promise<boolean> {
      const offering = this.selectedOffering as OfferingWithSlots | null;
      if (!offering) return false;
      const dialog = this.slotDialog as SlotDialogState;
      const classroom = dialog.classroom.trim();
      this.saving = true;
      this.error = null;
      if (dialog.mode === "create") {
        const created = await addOfferingTimeSlot(offering.id, {
          day: DAY_TO_WEEKDAY[dialog.day] as OfferingTimeSlot["day"],
          slot: dialog.block,
          classroom: classroom || undefined,
        });
        this.saving = false;
        if (!created) {
          this.error = "No se pudo agregar el horario. Puede que ya exista uno para ese día y bloque.";
          return false;
        }
        offering.timeSlots.push(created);
        return true;
      }
      const updated = await updateOfferingTimeSlot(offering.id, dialog.slotId as number, {
        classroom: classroom || null,
      });
      this.saving = false;
      if (!updated) {
        this.error = "No se pudo guardar el cambio.";
        return false;
      }
      const idx = offering.timeSlots.findIndex((s: OfferingTimeSlot) => s.id === updated.id);
      if (idx !== -1) offering.timeSlots[idx] = updated;
      return true;
    },
    async deleteSlot(): Promise<boolean> {
      if (!window.confirm("¿Eliminar este horario?")) return false;
      const offering = this.selectedOffering as OfferingWithSlots | null;
      const dialog = this.slotDialog as SlotDialogState;
      if (!offering || dialog.slotId === null) return false;
      this.saving = true;
      this.error = null;
      const ok = await deleteOfferingTimeSlot(offering.id, dialog.slotId);
      this.saving = false;
      if (!ok) {
        this.error = "No se pudo eliminar.";
        return false;
      }
      offering.timeSlots = offering.timeSlots.filter(
        (s: OfferingTimeSlot) => s.id !== dialog.slotId,
      );
      return true;
    },
  }) as AlpineComponent<any>;

export default offeringTimeSlotsPageData;
