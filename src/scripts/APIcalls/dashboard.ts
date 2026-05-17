import type { ClassActivity, MarkedActivity, RedoActivity } from "../types";
import { backendURL } from "./shared";
import { authFetch } from "./authToken";

export type Subject = {
  name: string;
  course: string;
  level: number;
  division: string;
  year: number;
  spreadsheetId: string;
  template: string;
};

export type Course = {
  id: number;
  name: string;
  specialty: string;
  year: number;
};

export type CourseEnrollment = {
  courseId: number;
  course: string;
  year: number;
};

type StudentSubject = {
  subject: string;
  id_subject: string;
  id_course: number;
};

export type Student = {
  id: string;
  name: string;
  surname: string;
  dni: string;
  email: string;
  courses: CourseEnrollment[];
  subjects: StudentSubject[];
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
    const response = await authFetch(`${backendURL}/students`);
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
    const response = await authFetch(
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

export async function toggleRevisionReviewed(id: string, reviewed: boolean) {
  try {
    const response = await authFetch(
      `${backendURL}/revisionRequests/${id}/reviewed`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed }),
      },
    );
    if (!response.ok) {
      throw new Error(
        `Error toggling revision reviewed: ${response.statusText}`,
      );
    }
    return (await response.json()) as { id: number; reviewed: boolean };
  } catch (error) {
    console.error("Failed to toggle revision reviewed:", error);
    return null;
  }
}

export async function fetchTeacherSubjects(teacherId: string) {
  try {
    const response = await authFetch(
      `${backendURL}/subjects/teacher/${teacherId}`,
    );
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
      name: string;
      surname: string;
    }
  >;
  criteria: { proportion: number; specialActivities: string[] };
};

export async function fetchCourses(): Promise<Course[]> {
  try {
    const response = await authFetch(`${backendURL}/courses`);
    if (!response.ok) {
      throw new Error(`Error fetching courses: ${response.statusText}`);
    }
    return (await response.json()) as Course[];
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

export async function updateStudent(
  studentId: string,
  data: Partial<{ name: string; surname: string; email: string; dni: string }>,
): Promise<Student | null> {
  try {
    const response = await authFetch(`${backendURL}/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error updating student: ${response.statusText}`);
    }
    return (await response.json()) as Student;
  } catch (error) {
    console.error("Failed to update student:", error);
    return null;
  }
}

export async function enrollStudentInCourse(
  studentId: string,
  courseId: number,
): Promise<CourseEnrollment | null> {
  try {
    const response = await authFetch(
      `${backendURL}/students/${studentId}/course`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      },
    );
    if (!response.ok) {
      throw new Error(`Error enrolling student in course: ${response.statusText}`);
    }
    return (await response.json()) as CourseEnrollment;
  } catch (error) {
    console.error("Failed to enroll student in course:", error);
    return null;
  }
}

export async function moveStudentCourse(
  studentId: string,
  oldCourseId: number,
  newCourseId: number,
): Promise<CourseEnrollment | null> {
  try {
    const response = await authFetch(
      `${backendURL}/students/${studentId}/course`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldCourseId, newCourseId }),
      },
    );
    if (!response.ok) {
      throw new Error(`Error moving student course: ${response.statusText}`);
    }
    return (await response.json()) as CourseEnrollment;
  } catch (error) {
    console.error("Failed to move student course:", error);
    return null;
  }
}

export async function removeStudentFromCourse(
  studentId: string,
  courseId: number,
): Promise<boolean> {
  try {
    const response = await authFetch(
      `${backendURL}/students/${studentId}/course/${courseId}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error(`Error removing student from course: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to remove student from course:", error);
    return false;
  }
}

export async function fetchSubjectMarks(
  subject: string,
  year: number,
  course: string,
  dataSheetId?: string,
) {
  try {
    // "/marks/:subject/:course/:year"
    const response = await authFetch(
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
