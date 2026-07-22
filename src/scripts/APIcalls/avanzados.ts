import { backendURL } from "./shared";
import { authFetch } from "./authToken";

export type AvanzadoMatch = {
  offeringId: number;
  subjectName: string;
  name: string | null;
  displayName: string;
};

export type AvanzadoStudent = {
  studentId: number;
  name: string;
  surname: string;
  courseId: number;
  courseName: string;
  level: number;
  avanzados: AvanzadoMatch[];
};

export async function fetchAvanzadoStudents(year: number): Promise<AvanzadoStudent[]> {
  try {
    const response = await authFetch(`${backendURL}/avanzados/students?year=${year}`);
    if (!response.ok) {
      throw new Error(`Error fetching avanzado students: ${response.statusText}`);
    }
    return (await response.json()) as AvanzadoStudent[];
  } catch (error) {
    console.error("Failed to fetch avanzado students:", error);
    return [];
  }
}

export async function matchStudentAvanzado(
  studentId: number,
  offeringId: number,
  courseId: number,
): Promise<AvanzadoMatch | null> {
  try {
    const response = await authFetch(`${backendURL}/avanzados/students/${studentId}/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offeringId, courseId }),
    });
    if (!response.ok) {
      throw new Error(`Error matching student to avanzado: ${response.statusText}`);
    }
    return (await response.json()) as AvanzadoMatch;
  } catch (error) {
    console.error("Failed to match student to avanzado:", error);
    return null;
  }
}

export async function unmatchStudentAvanzado(
  studentId: number,
  offeringId: number,
): Promise<boolean> {
  try {
    const response = await authFetch(
      `${backendURL}/avanzados/students/${studentId}/matches/${offeringId}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      throw new Error(`Error unmatching student from avanzado: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to unmatch student from avanzado:", error);
    return false;
  }
}
