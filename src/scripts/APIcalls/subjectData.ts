import type { Unit } from "../types";

const backendURL = "http://localhost:3000";

export async function fetchSubjectData(
  subjectName: string,
  course: string,
  year: number
): Promise<Unit[]> {
  try {
    const response = await fetch(
      `${backendURL}/articles/${encodeURIComponent(
        subjectName
      )}/${encodeURIComponent(course)}/${year}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching subject data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch subject data:", error);
    return [];
  }
}
