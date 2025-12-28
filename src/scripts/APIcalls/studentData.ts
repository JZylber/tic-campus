import type { ClassActivity, MarkedActivity, RedoActivity } from "../types";
import { backendURL } from "./shared";

export async function fetchStudentData(
  name: string,
  surname: string,
  year: number
): Promise<{
  course: string;
  id: string;
}> {
  try {
    // POST request with name, surname, and year in the body
    const response = await fetch(`${backendURL}/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, surname, year }),
    });
    if (!response.ok) {
      throw new Error(`Error fetching student data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("No student data found");
    return { course: "", id: "" };
  }
}

export async function fetchStudentMarksAndCriteria(
  subject: string,
  course: string,
  year: number,
  studentId: string,
  datasheetId?: string
): Promise<{
  criteria: { proportion: number; specialActivities: string[] };
  marks: Array<MarkedActivity>;
  activities: Array<ClassActivity>;
  redos: Array<RedoActivity>;
}> {
  try {
    const response = await fetch(
      `${backendURL}/marks/${encodeURIComponent(subject)}/${encodeURIComponent(
        course
      )}/${year}/${encodeURIComponent(studentId)}${
        datasheetId ? `?datasheetId=${encodeURIComponent(datasheetId)}` : ""
      }`
    );
    if (!response.ok) {
      throw new Error(`Error fetching student marks: ${response.statusText}`);
    }
    const { criteria, markedActivities, classActivities, redoActivities } =
      await response.json();
    // Make all marks, activities and redos have both madeUp and inRevision set to false
    markedActivities.forEach((mark: MarkedActivity) => {
      mark.madeUp = false;
      mark.inRevision = false;
    });
    classActivities.forEach((activity: ClassActivity) => {
      activity.madeUp = false;
      activity.inRevision = false;
      // Set compulsory to false for all activities
      activity.compulsory = false;
    });
    redoActivities.forEach((redo: RedoActivity) => {
      redo.madeUp = false;
      redo.inRevision = false;
    });

    return {
      criteria,
      marks: markedActivities,
      activities: classActivities,
      redos: redoActivities,
    };
  } catch (error) {
    console.error("Failed to fetch student marks:", error);
    return {
      criteria: { proportion: 1, specialActivities: [] },
      marks: [],
      activities: [],
      redos: [],
    };
  }
}
