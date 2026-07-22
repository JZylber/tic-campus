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
