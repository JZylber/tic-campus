import { api, jsonBody, succeeded } from "./shared";
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

export const fetchAvanzadoStudents = (year: number) =>
  api<AvanzadoStudent[]>(`/avanzados/students?year=${year}`, [], {
    fetcher: authFetch,
  });

export const matchStudentAvanzado = (
  studentId: number,
  offeringId: number,
  courseId: number,
) =>
  api<AvanzadoMatch | null>(`/avanzados/students/${studentId}/matches`, null, {
    fetcher: authFetch,
    ...jsonBody("POST", { offeringId, courseId }),
  });

export const unmatchStudentAvanzado = (studentId: number, offeringId: number) =>
  api(`/avanzados/students/${studentId}/matches/${offeringId}`, false, {
    fetcher: authFetch,
    method: "DELETE",
    read: succeeded,
  });
