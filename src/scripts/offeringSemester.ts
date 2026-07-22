import type { Semester } from "./APIcalls/offeringTimeSlots";

// An offering tagged BOTH runs all year, so it matches every semester filter
// except the BOTH filter itself, which is used to isolate full-year offerings.
export function matchesSemesterFilter(offeringSemester: Semester, filter: Semester): boolean {
  if (filter === "BOTH") return offeringSemester === "BOTH";
  return offeringSemester === filter || offeringSemester === "BOTH";
}
