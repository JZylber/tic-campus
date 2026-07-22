import { backendURL } from "./shared";
import { authFetch } from "./authToken";

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
export type Semester = "FIRST" | "SECOND" | "BOTH";

export type OfferingTimeSlot = {
  id: number;
  day: Weekday;
  slot: number;
  classroom: string | null;
};

export type OfferingWithSlots = {
  id: number;
  subjectId: number;
  subjectName: string;
  name: string | null;
  kind: "MANDATORY" | "OPTIONAL";
  year: number;
  level: number;
  templateId: string;
  spreadsheetId: string | null;
  semester: Semester;
  displayName: string;
  courses: Array<{ courseId: number; courseName: string; division: string }>;
  timeSlots: OfferingTimeSlot[];
  // Only present on fetchPublicOfferingSchedule results; fetchOfferings
  // (the admin endpoint) doesn't compute this. Only meaningful for OPTIONAL
  // offerings when a real studentId was resolved.
  enrolled?: boolean;
};

export async function fetchOfferings(year: number): Promise<OfferingWithSlots[]> {
  try {
    const response = await authFetch(`${backendURL}/offerings?year=${year}`);
    if (!response.ok) {
      throw new Error(`Error fetching offerings: ${response.statusText}`);
    }
    return (await response.json()) as OfferingWithSlots[];
  } catch (error) {
    console.error("Failed to fetch offerings:", error);
    return [];
  }
}

// Public counterpart of fetchOfferings — no JWT, scoped to one subject and
// level, for the campus-embedded student-facing timetable pages. studentId
// may be "0"/unknown when no student was identified via SSO; the backend
// tolerates that gracefully (every offering just comes back unenrolled).
export async function fetchPublicOfferingSchedule(
  subject: string,
  year: number,
  level: number,
  studentId: string,
): Promise<OfferingWithSlots[]> {
  try {
    const response = await fetch(
      `${backendURL}/offerings/${encodeURIComponent(subject)}/${year}/${level}/${encodeURIComponent(studentId)}`,
    );
    if (!response.ok) {
      throw new Error(`Error fetching public offering schedule: ${response.statusText}`);
    }
    return (await response.json()) as OfferingWithSlots[];
  } catch (error) {
    console.error("Failed to fetch public offering schedule:", error);
    return [];
  }
}

// Distinct (year, level) pairs where a MANDATORY offering of `subject` exists —
// unlike fetchSubjects()/GET /subjects, not filtered by templateId, since Proyecto's
// static path generation (the only current caller) isn't template-driven.
export async function fetchSubjectLevels(
  subject: string,
): Promise<Array<{ year: number; level: number }>> {
  try {
    const response = await fetch(`${backendURL}/offerings/${encodeURIComponent(subject)}/levels`);
    if (!response.ok) {
      throw new Error(`Error fetching subject levels: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch subject levels:", error);
    return [];
  }
}

export async function addOfferingTimeSlot(
  offeringId: number,
  data: { day: Weekday; slot: number; classroom?: string },
): Promise<OfferingTimeSlot | null> {
  try {
    const response = await authFetch(`${backendURL}/offerings/${offeringId}/timeSlots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error creating time slot: ${response.statusText}`);
    }
    return (await response.json()) as OfferingTimeSlot;
  } catch (error) {
    console.error("Failed to create time slot:", error);
    return null;
  }
}

export async function updateOfferingTimeSlot(
  offeringId: number,
  slotId: number,
  data: { classroom: string | null },
): Promise<OfferingTimeSlot | null> {
  try {
    const response = await authFetch(
      `${backendURL}/offerings/${offeringId}/timeSlots/${slotId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      throw new Error(`Error updating time slot: ${response.statusText}`);
    }
    return (await response.json()) as OfferingTimeSlot;
  } catch (error) {
    console.error("Failed to update time slot:", error);
    return null;
  }
}

export async function deleteOfferingTimeSlot(
  offeringId: number,
  slotId: number,
): Promise<boolean> {
  try {
    const response = await authFetch(
      `${backendURL}/offerings/${offeringId}/timeSlots/${slotId}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      throw new Error(`Error deleting time slot: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete time slot:", error);
    return false;
  }
}
