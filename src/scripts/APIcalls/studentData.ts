import type {
  ClassActivity,
  FixedMarks,
  MarkedActivity,
  RedoActivity,
} from "../types";
import { backendURL } from "./shared";
import { studentFetch } from "./studentToken";

export type CampusSessionResult =
  | {
      status: "identified";
      token: string;
      student: { id: string; name: string; surname: string; course: string };
    }
  /** Campus knows who they are, we could not match them to a student of ours. */
  | { status: "unidentified" }
  /** Not signed in to campus, or campus/our backend is unreachable. */
  | { status: "unavailable" };

/**
 * Hand the campus session cookie to our backend so it can ask campus.ort.edu.ar
 * who owns it and mint a token. The browser is never trusted to *state* who the
 * student is — only to relay a credential the backend verifies itself.
 *
 * Only the PHPSESSID entries are relayed, in the order the browser produced
 * them: campus sets two cookies of that name (one on .ort.edu.ar, one
 * host-only) and PHP honours whichever comes last, so the order is meaningful
 * and both must go.
 */
function readCampusSessionCookies(): string {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith("PHPSESSID="))
    .join("; ");
}

export async function verifyCampusSession(
  course: string | undefined,
  year: number,
): Promise<CampusSessionResult> {
  const cookie = readCampusSessionCookies();
  if (!cookie) return { status: "unavailable" };
  try {
    const response = await fetch(`${backendURL}/auth/campus/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ cookie, course, year }),
    });
    if (response.status === 404 || response.status === 409) {
      return { status: "unidentified" };
    }
    if (!response.ok) return { status: "unavailable" };
    const data = await response.json();
    return { status: "identified", token: data.token, student: data.student };
  } catch (error) {
    console.error("Failed to verify campus session:", error);
    return { status: "unavailable" };
  }
}

/** Drops the student cookie server-side. Used when stopping an impersonation. */
export async function endStudentSession(): Promise<void> {
  try {
    await fetch(`${backendURL}/auth/campus/session`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to end student session:", error);
  }
}

/**
 * Mint a student token as a teacher or admin. The backend checks the actor is
 * allowed to view this student and records who they are in the token, so
 * impersonation is authorised and auditable rather than, as before, a value the
 * client simply wrote into a persisted store.
 */
export async function impersonateStudent(
  studentId: string,
  course: string,
  year: number,
): Promise<CampusSessionResult> {
  try {
    const { authFetch } = await import("./authToken");
    const response = await authFetch(`${backendURL}/auth/impersonate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ studentId: Number(studentId), course, year }),
    });
    if (!response.ok) return { status: "unidentified" };
    const data = await response.json();
    return { status: "identified", token: data.token, student: data.student };
  } catch (error) {
    console.error("Failed to impersonate student:", error);
    return { status: "unavailable" };
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
    const response = await studentFetch(
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
    const response = await studentFetch(
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
    const response = await studentFetch(`${backendURL}/revisionRequest`, {
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
      const errorBody = (await response.json()) || {
        message: "Error al enviar el pedido de revisión",
      };
      return {
        success: false,
        message: `${errorBody.message! || "Error al enviar el pedido de revisión"}`,
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
