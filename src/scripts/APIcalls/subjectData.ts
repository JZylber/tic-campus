import type { Unit } from "../types";

const backendURL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://tic-campus-backend.vercel.app";

export async function fetchSubjectData(
  subject: string,
  course: string,
  year: number
): Promise<Unit[]> {
  try {
    const response = await fetch(
      `${backendURL}/articles/${encodeURIComponent(
        subject
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

export async function fetchHomeLinks(
  subject: string,
  course: string,
  year: number
): Promise<{
  group: string;
  presentation: string;
}> {
  try {
    const response = await fetch(
      `${backendURL}/homeLinks/${encodeURIComponent(
        subject
      )}/${encodeURIComponent(course)}/${year}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching home links: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch home links:", error);
    return { group: "", presentation: "" };
  }
}
