import { api, jsonBody, succeeded } from "./shared";
import { studentFetch } from "./studentToken";
import { authFetch } from "./authToken";
import type { Offering } from "./offerings";

export type { Semester } from "./offerings";
export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

export type OfferingTimeSlot = {
  id: number;
  day: Weekday;
  slot: number;
  classroom: string | null;
};

export type OfferingWithSlots = Offering & {
  timeSlots: OfferingTimeSlot[];
  // Only present on fetchPublicOfferingSchedule results; fetchOfferings
  // (the admin endpoint) doesn't compute this. Only meaningful for OPTIONAL
  // offerings when a real studentId was resolved.
  enrolled?: boolean;
};

export const fetchOfferings = (year: number) =>
  api<OfferingWithSlots[]>(`/offerings?year=${year}`, [], { fetcher: authFetch });

// Public counterpart of fetchOfferings — no JWT, scoped to one subject and
// level, for the campus-embedded student-facing timetable pages. studentId
// may be "0"/unknown when no student was identified via SSO; the backend
// tolerates that gracefully (every offering just comes back unenrolled).
export const fetchPublicOfferingSchedule = (
  subject: string,
  year: number,
  level: number,
  studentId: string,
) =>
  api<OfferingWithSlots[]>(
    `/offerings/${encodeURIComponent(subject)}/${year}/${level}/${encodeURIComponent(studentId)}`,
    [],
    { fetcher: studentFetch },
  );

// Distinct (year, level) pairs where a MANDATORY offering of `subject` exists —
// unlike fetchSubjects()/GET /subjects, not filtered by templateId, since Proyecto's
// static path generation (the only current caller) isn't template-driven.
export const fetchSubjectLevels = (subject: string) =>
  api<Array<{ year: number; level: number }>>(
    `/offerings/${encodeURIComponent(subject)}/levels`,
    [],
  );

export const addOfferingTimeSlot = (
  offeringId: number,
  data: { day: Weekday; slot: number; classroom?: string },
) =>
  api<OfferingTimeSlot | null>(`/offerings/${offeringId}/timeSlots`, null, {
    fetcher: authFetch,
    ...jsonBody("POST", data),
  });

export const updateOfferingTimeSlot = (
  offeringId: number,
  slotId: number,
  data: { classroom: string | null },
) =>
  api<OfferingTimeSlot | null>(
    `/offerings/${offeringId}/timeSlots/${slotId}`,
    null,
    { fetcher: authFetch, ...jsonBody("PATCH", data) },
  );

export const deleteOfferingTimeSlot = (offeringId: number, slotId: number) =>
  api(`/offerings/${offeringId}/timeSlots/${slotId}`, false, {
    fetcher: authFetch,
    method: "DELETE",
    read: succeeded,
  });
