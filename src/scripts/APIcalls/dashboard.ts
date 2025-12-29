import { backendURL } from "./shared";

export type Subject = {
  name: string;
  course: string;
  level: number;
  division: string;
  year: number;
};

type Student = {
  id: string;
  name: string;
  surname: string;
  dni: string;
  email: string;
  year: number;
  course: string;
  subjects: string[];
};

export async function fetchSubjects() {
  try {
    const response = await fetch(`${backendURL}/subjects`);
    if (!response.ok) {
      throw new Error(`Error fetching subjects: ${response.statusText}`);
    }
    const data: Subject[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return [];
  }
}

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
