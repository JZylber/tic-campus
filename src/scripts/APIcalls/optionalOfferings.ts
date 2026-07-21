import { backendURL } from "./shared";
import { authFetch } from "./authToken";

export type OptionalOffering = {
  id: number;
  subjectId: number;
  subjectName: string;
  year: number;
  level: number;
  templateId: string;
  spreadsheetId: string | null;
  displayName: string;
  courses: Array<{ courseId: number; courseName: string; division: string }>;
};

export type SubjectCatalogEntry = { id: number; name: string };

export async function fetchOptionalOfferings(year: number): Promise<OptionalOffering[]> {
  try {
    const response = await authFetch(`${backendURL}/offerings/optional?year=${year}`);
    if (!response.ok) {
      throw new Error(`Error fetching optional offerings: ${response.statusText}`);
    }
    return (await response.json()) as OptionalOffering[];
  } catch (error) {
    console.error("Failed to fetch optional offerings:", error);
    return [];
  }
}

export async function fetchSubjectsCatalog(): Promise<SubjectCatalogEntry[]> {
  try {
    const response = await authFetch(`${backendURL}/offerings/optional/subjects`);
    if (!response.ok) {
      throw new Error(`Error fetching subjects catalog: ${response.statusText}`);
    }
    return (await response.json()) as SubjectCatalogEntry[];
  } catch (error) {
    console.error("Failed to fetch subjects catalog:", error);
    return [];
  }
}

export async function createOptionalOffering(data: {
  subjectId: number;
  year: number;
  courseIds: number[];
}): Promise<OptionalOffering | null> {
  try {
    const response = await authFetch(`${backendURL}/offerings/optional`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error creating optional offering: ${response.statusText}`);
    }
    return (await response.json()) as OptionalOffering;
  } catch (error) {
    console.error("Failed to create optional offering:", error);
    return null;
  }
}

export async function updateOptionalOffering(
  id: number,
  data: { courseIds: number[] },
): Promise<OptionalOffering | null> {
  try {
    const response = await authFetch(`${backendURL}/offerings/optional/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error updating optional offering: ${response.statusText}`);
    }
    return (await response.json()) as OptionalOffering;
  } catch (error) {
    console.error("Failed to update optional offering:", error);
    return null;
  }
}

export async function deleteOptionalOffering(id: number): Promise<boolean> {
  try {
    const response = await authFetch(`${backendURL}/offerings/optional/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Error deleting optional offering: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete optional offering:", error);
    return false;
  }
}
