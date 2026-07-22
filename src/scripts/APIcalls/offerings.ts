import { backendURL } from "./shared";
import { authFetch } from "./authToken";

export type Semester = "FIRST" | "SECOND" | "BOTH";
export type OfferingKind = "MANDATORY" | "OPTIONAL";

export type Offering = {
  id: number;
  subjectId: number;
  subjectName: string;
  name: string | null;
  kind: OfferingKind;
  year: number;
  level: number;
  templateId: string;
  spreadsheetId: string | null;
  semester: Semester;
  displayName: string;
  courses: Array<{ courseId: number; courseName: string; division: string }>;
};

export type SubjectCatalogEntry = { id: number; name: string };

export async function fetchSubjectsCatalog(): Promise<SubjectCatalogEntry[]> {
  try {
    const response = await authFetch(`${backendURL}/offerings/subjects`);
    if (!response.ok) {
      throw new Error(`Error fetching subjects catalog: ${response.statusText}`);
    }
    return (await response.json()) as SubjectCatalogEntry[];
  } catch (error) {
    console.error("Failed to fetch subjects catalog:", error);
    return [];
  }
}

export async function createOffering(data: {
  subjectId: number;
  kind: OfferingKind;
  year: number;
  courseIds: number[];
  name?: string | null;
  semester: Semester;
}): Promise<Offering | null> {
  try {
    const response = await authFetch(`${backendURL}/offerings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error creating offering: ${response.statusText}`);
    }
    return (await response.json()) as Offering;
  } catch (error) {
    console.error("Failed to create offering:", error);
    return null;
  }
}

export async function updateOffering(
  id: number,
  data: { courseIds?: number[]; name?: string | null; semester?: Semester },
): Promise<Offering | null> {
  try {
    const response = await authFetch(`${backendURL}/offerings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error updating offering: ${response.statusText}`);
    }
    return (await response.json()) as Offering;
  } catch (error) {
    console.error("Failed to update offering:", error);
    return null;
  }
}

export async function deleteOffering(id: number): Promise<boolean> {
  try {
    const response = await authFetch(`${backendURL}/offerings/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Error deleting offering: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete offering:", error);
    return false;
  }
}
