import { api, jsonBody, succeeded } from "./shared";
import { authFetch } from "./authToken";

export type Semester = "FIRST" | "SECOND" | "BOTH";
export type OfferingKind = "MANDATORY" | "OPTIONAL";

export type Offering = {
  id: number;
  subjectId: number;
  subjectName: string;
  name: string | null;
  kind: OfferingKind;
  year: number;
  level: number;
  templateId: string;
  spreadsheetId: string | null;
  semester: Semester;
  displayName: string;
  courses: Array<{ courseId: number; courseName: string; division: string }>;
};

export type SubjectCatalogEntry = { id: number; name: string };

export const fetchSubjectsCatalog = () =>
  api<SubjectCatalogEntry[]>("/offerings/subjects", [], { fetcher: authFetch });

export type OfferingStudent = {
  studentId: number;
  name: string;
  surname: string;
  email: string;
  dni: string;
  courseName: string;
};

export const fetchOfferingStudents = (offeringId: number) =>
  api<OfferingStudent[]>(`/offerings/${offeringId}/students`, [], {
    fetcher: authFetch,
  });

export const createOffering = (data: {
  subjectId: number;
  kind: OfferingKind;
  year: number;
  courseIds: number[];
  name?: string | null;
  semester: Semester;
}) =>
  api<Offering | null>("/offerings", null, {
    fetcher: authFetch,
    ...jsonBody("POST", data),
  });

export const updateOffering = (
  id: number,
  data: { courseIds?: number[]; name?: string | null; semester?: Semester },
) =>
  api<Offering | null>(`/offerings/${id}`, null, {
    fetcher: authFetch,
    ...jsonBody("PATCH", data),
  });

export const deleteOffering = (id: number) =>
  api(`/offerings/${id}`, false, {
    fetcher: authFetch,
    method: "DELETE",
    read: succeeded,
  });
