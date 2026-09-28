import type { ClassActivity, MarkedActivity, RedoActivity } from "../types";
import { api, jsonBody } from "./shared";
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

// An optional-offering match the student lost because the offering does not
// serve the course they moved into, or because they left the course entirely.
export type DroppedOffering = {
  offeringId: number;
  displayName: string;
};

export type CourseMoveResult = CourseEnrollment & {
  droppedOfferings: DroppedOffering[];
};

type StudentSubject = {
  subject: string;
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
  optionalOfferingIds: number[];
};

export const fetchSubjects = () => api<Subject[]>("/subjects", []);

export const fetchStudents = () =>
  api<Student[]>("/students", [], { fetcher: authFetch });

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
  const requests = await api<Array<Omit<RevisionRequest, "date"> & { date: string }>>(
    `/revisionRequests/teacher/${year}/${teacherId}`,
    [],
    { fetcher: authFetch },
  );
  return requests
    .map((request): RevisionRequest => ({ ...request, date: new Date(request.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const toggleRevisionReviewed = (id: string, reviewed: boolean) =>
  api<{ id: number; reviewed: boolean } | null>(
    `/revisionRequests/${id}/reviewed`,
    null,
    { fetcher: authFetch, ...jsonBody("PATCH", { reviewed }) },
  );

export const fetchTeacherSubjects = (teacherId: string) =>
  api<Subject[]>(`/subjects/teacher/${teacherId}`, [], { fetcher: authFetch });

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

export const fetchCourses = () =>
  api<Course[]>("/courses", [], { fetcher: authFetch });

export const updateStudent = (
  studentId: string,
  data: Partial<{ name: string; surname: string; email: string; dni: string }>,
) =>
  api<Student | null>(`/students/${studentId}`, null, {
    fetcher: authFetch,
    ...jsonBody("PATCH", data),
  });

export const enrollStudentInCourse = (studentId: string, courseId: number) =>
  api<CourseEnrollment | null>(`/students/${studentId}/course`, null, {
    fetcher: authFetch,
    ...jsonBody("POST", { courseId }),
  });

export const moveStudentCourse = (
  studentId: string,
  oldCourseId: number,
  newCourseId: number,
) =>
  api<CourseMoveResult | null>(`/students/${studentId}/course`, null, {
    fetcher: authFetch,
    ...jsonBody("PATCH", { oldCourseId, newCourseId }),
  });

// Resolves to the offerings the student lost along with the course (possibly
// empty), or null if the removal failed.
export const removeStudentFromCourse = (studentId: string, courseId: number) =>
  api<DroppedOffering[] | null>(`/students/${studentId}/course/${courseId}`, null, {
    fetcher: authFetch,
    method: "DELETE",
    read: async (r) =>
      ((await r.json()) as { droppedOfferings?: DroppedOffering[] })
        .droppedOfferings ?? [],
  });

export const fetchSubjectMarks = (
  subject: string,
  year: number,
  course: string,
  dataSheetId?: string,
) =>
  api<SubjectMarks>(
    `/marks/${subject}/${course}/${year}${dataSheetId ? `?dataSheetId=${encodeURIComponent(dataSheetId)}` : ""}`,
    { marksByStudent: {}, criteria: { proportion: 0, specialActivities: [] } },
    { fetcher: authFetch },
  );
