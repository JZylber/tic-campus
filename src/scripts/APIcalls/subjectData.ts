import type { Material, Unit } from "../types";

const backendURL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://tic-campus-backend.vercel.app";

type TemplatesResponse = Array<{
  Materia: string;
  Curso: string;
  Año: string;
  "Spreadsheet ID": string;
  "Id Template": string;
}>;

export async function fetchTemplateSubjects(templateId: string): Promise<
  Array<{
    params: { subject: string; course: string; year: number };
    props: { dataSheetId: string };
  }>
> {
  try {
    const response = await fetch(
      `${backendURL}/subjects/${encodeURIComponent(templateId)}`
    );
    if (!response.ok) {
      throw new Error(
        `Error fetching template subjects: ${response.statusText}`
      );
    }
    const data: TemplatesResponse = await response.json();
    // Convert to the required format and filter those without any of params
    const cleanData = data
      .map((item) => ({
        params: {
          subject: item.Materia,
          course: item.Curso,
          year: Number(item.Año),
        },
        props: { dataSheetId: item["Spreadsheet ID"] },
      }))
      .filter(
        (item) => item.params.subject && item.params.course && item.params.year
      );
    return cleanData;
  } catch (error) {
    console.error("Failed to fetch template subjects:", error);
    return [];
  }
}

export async function fetchSubjectData(
  subject: string,
  course: string,
  year: number,
  dataSheetId?: string
): Promise<Unit[]> {
  try {
    const response = await fetch(
      `${backendURL}/articles/${encodeURIComponent(
        subject
      )}/${encodeURIComponent(course)}/${year}${
        dataSheetId ? `?dataSheetId=${encodeURIComponent(dataSheetId)}` : ""
      }`
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

export async function fetchRedoLinks(
  subject: string,
  course: string,
  year: number
): Promise<{
  activities: string;
  markedActivities: string;
}> {
  try {
    const response = await fetch(
      `${backendURL}/redoLinks/${encodeURIComponent(
        subject
      )}/${encodeURIComponent(course)}/${year}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching redo links: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch redo links:", error);
    return { activities: "", markedActivities: "" };
  }
}

export async function fetchSubjectMaterial(
  subject: string,
  course: string,
  year: number,
  dataSheetId?: string
): Promise<Material[]> {
  try {
    const response = await fetch(
      `${backendURL}/material/${encodeURIComponent(
        subject
      )}/${encodeURIComponent(course)}/${year}${
        dataSheetId ? `?dataSheetId=${encodeURIComponent(dataSheetId)}` : ""
      }`
    );
    if (!response.ok) {
      throw new Error(
        `Error fetching subject material: ${response.statusText}`
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch subject material:", error);
    return [];
  }
}
