import type { Semester } from "./APIcalls/offeringTimeSlots";

// An offering tagged BOTH runs all year, so it matches every semester filter
// except the BOTH filter itself, which is used to isolate full-year offerings.
export function matchesSemesterFilter(offeringSemester: Semester, filter: Semester): boolean {
  if (filter === "BOTH") return offeringSemester === "BOTH";
  return offeringSemester === filter || offeringSemester === "BOTH";
}

// Cuatrimestre toggles default to whichever term is actually current, using
// July 25th as the cutover point (school's informal 1er/2do boundary).
export function defaultCuatrimestre(now: Date = new Date()): "FIRST" | "SECOND" {
  const month = now.getMonth(); // 0-indexed, 6 = July
  const isAfterCutover = month > 6 || (month === 6 && now.getDate() > 25);
  return isAfterCutover ? "SECOND" : "FIRST";
}
