import type { Material, Unit } from "../types";
import { api } from "./shared";

type TemplatesResponse = Array<{
  name: string;
  course: string;
  year: string;
  spreadsheet: string;
  templateId: string;
  marks: boolean;
}>;

const sheetQuery = (dataSheetId?: string) =>
  dataSheetId ? `?dataSheetId=${encodeURIComponent(dataSheetId)}` : "";

const coursePath = (subject: string, course: string, year: number) =>
  `${encodeURIComponent(subject)}/${encodeURIComponent(course)}/${year}`;

// Static paths for every course of a subject template, skipping rows with
// any param missing.
export async function fetchTemplateSubjects(template: string) {
  const data = await api<TemplatesResponse>(
    `/subjects/${encodeURIComponent(template)}`,
    [],
  );
  return data
    .filter(
      (item) =>
        item.name !== "" &&
        item.course !== "" &&
        item.year !== "" &&
        !isNaN(Number(item.year)),
    )
    .map((item) => ({
      params: {
        subject: item.name,
        course: item.course,
        year: String(Number(item.year)),
      },
      props: { dataSheetId: item.spreadsheet, template },
    }));
}

export const fetchSubjectData = (
  subject: string,
  course: string,
  year: number,
  dataSheetId?: string,
) =>
  api<Unit[]>(
    `/articles/${coursePath(subject, course, year)}${sheetQuery(dataSheetId)}`,
    [],
  );

export const fetchHomeLinks = (subject: string, course: string, year: number) =>
  api<{ group: string; presentation: string }>(
    `/links/${coursePath(subject, course, year)}`,
    { group: "", presentation: "" },
  );

export const fetchSubjectMaterial = (
  subject: string,
  course: string,
  year: number,
  dataSheetId?: string,
) =>
  api<Material[]>(
    `/material/${coursePath(subject, course, year)}${sheetQuery(dataSheetId)}`,
    [],
  );

export const fetchSubjectStudents = (
  subject: string,
  course: string,
  year: number,
) =>
  api<
    Array<{
      name: string;
      surname: string;
      id: string;
      course: string;
      year: number;
    }>
  >(`/students/${coursePath(subject, course, year)}`, []);
