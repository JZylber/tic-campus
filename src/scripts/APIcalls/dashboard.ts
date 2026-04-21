import type { ClassActivity, MarkedActivity, RedoActivity } from "../types";
import { backendURL } from "./shared";

export type Subject = {
  name: string;
  course: string;
  level: number;
  division: string;
  year: number;
  spreadsheetId: string;
  template: string;
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

type RevisionRequest = {
  revisionRequestId: string;
  activityId: string;
  bonusTasks: string | null;
  comment: string | null;
  courseName: string;
  courseYear: number;
  date: Date;
  reason: string;
  reviewed: boolean;
  studentId: string;
  studentName: string;
  studentSurname: string;
  subjectName: string;
};

export async function fetchRevisionsByTeacher(teacherId: string, year: number) {
  // For now, stuck at 1
  try {
    const response = await fetch(
      `${backendURL}/revisionRequests/teacher/${year}/${teacherId}`,
    );
    if (!response.ok) {
      throw new Error(
        `Error fetching revision requests: ${response.statusText}`,
      );
    }
    const data: RevisionRequest[] = await response.json().then((requests) =>
      requests
        .map((request: any) => ({
          ...request,
          date: new Date(request.date),
        }))
        .sort(
          (a: RevisionRequest, b: RevisionRequest) =>
            a.date.getTime() - b.date.getTime(),
        ),
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch revision requests:", error);
    return [];
  }
}

export async function fetchTeacherSubjects(teacherId: string) {
  try {
    const response = await fetch(`${backendURL}/subjects/teacher/${teacherId}`);
    if (!response.ok) {
      throw new Error(
        `Error fetching teacher subjects: ${response.statusText}`,
      );
    }
    const data: Subject[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch teacher subjects:", error);
    return [];
  }
}

type SubjectMarks = {
  marksByStudent: Record<
    string,
    {
      classActivities: Array<ClassActivity>;
      markedActivities: Array<MarkedActivity>;
      redoActivities: Array<RedoActivity>;
    }
  >;
  criteria: { proportion: number; specialActivities: string[] };
};

export async function fetchSubjectMarks(
  subject: string,
  year: number,
  course: string,
  dataSheetId?: string,
) {
  try {
    // "/marks/:subject/:course/:year"
    const response = await fetch(
      `${backendURL}/marks/${subject}/${course}/${year}${dataSheetId ? `?dataSheetId=${encodeURIComponent(dataSheetId)}` : ""}`,
    );
    if (!response.ok) {
      throw new Error(`Error fetching subject marks: ${response.statusText}`);
    }
    const data: SubjectMarks = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch subject marks:", error);
    return {
      marksByStudent: {},
      criteria: { proportion: 0, specialActivities: [] },
    };
  }
}
