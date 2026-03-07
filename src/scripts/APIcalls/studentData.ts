import type {
  ClassActivity,
  FixedMarks,
  MarkedActivity,
  RedoActivity,
} from "../types";
import { backendURL } from "./shared";

export async function fetchStudentData(
  name: string,
  surname: string,
  year: number,
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
  datasheetId?: string,
): Promise<{
  criteria: { proportion: number; specialActivities: string[] };
  marks: Array<MarkedActivity>;
  activities: Array<ClassActivity>;
  redos: Array<RedoActivity>;
  fixedMarks: FixedMarks;
}> {
  try {
    const response = await fetch(
      `${backendURL}/marks/${encodeURIComponent(subject)}/${encodeURIComponent(
        course,
      )}/${year}/${encodeURIComponent(studentId)}${
        datasheetId ? `?datasheetId=${encodeURIComponent(datasheetId)}` : ""
      }`,
    );
    if (!response.ok) {
      throw new Error(`Error fetching student marks: ${response.statusText}`);
    }
    const {
      criteria,
      markedActivities,
      classActivities,
      redoActivities,
      fixedMarks,
    } = await response.json();
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
      fixedMarks,
    };
  } catch (error) {
    console.error("Failed to fetch student marks:", error);
    return {
      criteria: { proportion: 1, specialActivities: [] },
      marks: [],
      activities: [],
      redos: [],
      fixedMarks: {
        "1B": undefined,
        "1C": undefined,
        "3B": undefined,
        F: undefined,
      },
    };
  }
}

export async function fetchRevisionRequests(
  subject: string,
  course: string,
  year: number,
  id: string,
): Promise<string[]> {
  try {
    // URL is subject/course/year and datasheetId, name and surname go as query params
    const response = await fetch(
      `${backendURL}/revisionRequests/${encodeURIComponent(
        subject,
      )}/${encodeURIComponent(course)}/${year}/${encodeURIComponent(id)}`,
    );
    if (!response.ok) {
      throw new Error(
        `Error fetching revision requests: ${response.statusText}`,
      );
    }
    const data: string[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch revision requests:", error);
    return [];
  }
}

type RevisionResponse = {
  success: boolean;
  message: string;
};

export async function submitRevisionRequest(
  subject: string,
  course: string,
  year: number,
  studentIds: string[],
  activityId: string,
  reason: string,
  bonusTasks: string,
  comment: string,
): Promise<RevisionResponse> {
  try {
    // URL is subject/course/year and datasheetId, name and surname go as query params
    const response = await fetch(`${backendURL}/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        course,
        year,
        studentIds,
        activityId,
        reason,
        bonusTasks,
        comment,
      }),
    });
    if (!response.ok) {
      return {
        success: false,
        message: `${response.statusText}`,
      };
    }
    return {
      success: true,
      message: "¡Pedido de revisión enviado con éxito!",
    };
  } catch (error) {
    console.error("Failed to fetch revision requests:", error);
    return {
      success: false,
      message:
        "Error al enviar el pedido de revisión. Por favor, inténtalo de nuevo.",
    };
  }
}
