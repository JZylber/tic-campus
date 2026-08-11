import type { OfferingWithSlots } from "./APIcalls/offeringTimeSlots";
import { WEEKDAY_TO_DAY, type TimetableBySubject } from "./timetableLayout";

// Shared between the student-facing Proyecto horario pages
// (alpine/data/proyectoHorarioPage.ts) and the dashboard's Información ›
// Grilla view (alpine/data/grillaProyectoPage.ts) — both need to turn a
// level's MANDATORY "Proyecto" offerings into rotation-group tabs and each
// tab's timetable, they just wrap different personalization layers around
// it. Kept level-agnostic and personalization-agnostic on purpose: callers
// pass in whichever offerings are already scoped to their year/level/
// semester filter.

export type TimetableTab = { id: string; label: string };

// buildDisplayName (backend) renders "Proyecto (AC)" for an offering that only
// covers part of the level's courses, and bare "Proyecto" for one covering the
// whole level — this is the inverse, turning that into a tab label.
export function groupLabelFor(displayName: string): string {
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
export function groupSubjectKey(offering: OfferingWithSlots): string {
  return offering.name ? `${offering.subjectName}-${offering.name}` : offering.subjectName;
}

// Distinct MANDATORY offerings for the level — a level can have several
// (e.g. level 4's AC/BD rotation groups), each rendered as its own tab
// instead of merged into one grid.
export function mandatoryOfferingsOf(offerings: OfferingWithSlots[]): OfferingWithSlots[] {
  return offerings.filter((o) => o.kind === "MANDATORY");
}

export function groupTabsOf(mandatoryOfferings: OfferingWithSlots[]): TimetableTab[] {
  return mandatoryOfferings
    .map((o) => ({ id: String(o.id), label: groupLabelFor(o.displayName) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Seminars aren't level-wide either — one scoped to only part of the level
// (e.g. offered just to NR4A/NR4C) only belongs on that group's tab; one
// spanning the whole level (all its courses fall inside the group) belongs
// on every group's tab.
export function groupOptionalOfferingsOf(
  groupId: string | null,
  mandatoryOfferings: OfferingWithSlots[],
  visibleOfferings: OfferingWithSlots[],
): OfferingWithSlots[] {
  const groupOffering = mandatoryOfferings.find((o) => String(o.id) === groupId);
  if (!groupOffering) return [];
  const groupCourseIds = new Set(groupOffering.courses.map((c) => c.courseId));
  return visibleOfferings.filter(
    (o) => o.kind === "OPTIONAL" && o.courses.some((c) => groupCourseIds.has(c.courseId)),
  );
}

// A group tab is its own MANDATORY offering plus whichever seminars are
// scoped to it. The label is the bare subject name (not displayName's
// "(AC)"/"(BD)" suffix) since the active tab already says which group this
// is.
export function groupTimetableOf(
  groupId: string | null,
  mandatoryOfferings: OfferingWithSlots[],
  visibleOfferings: OfferingWithSlots[],
): TimetableBySubject {
  const groupOffering = mandatoryOfferings.find((o) => String(o.id) === groupId);
  if (!groupOffering) return {};
  const timetable: TimetableBySubject = {};
  const offerings: OfferingWithSlots[] = [
    groupOffering,
    ...groupOptionalOfferingsOf(groupId, mandatoryOfferings, visibleOfferings),
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
}
