import { backendURL } from "./shared";

type Student = {
  id: string;
  name: string;
  surname: string;
  dni: string;
  email: string;
  year: number;
  course: string;
};

export async function fetchStudents() {
  try {
    const response = await fetch(`${backendURL}/students`);
    if (!response.ok) {
      throw new Error(`Error fetching students: ${response.statusText}`);
    }
    const data: Student[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return [];
  }
}
