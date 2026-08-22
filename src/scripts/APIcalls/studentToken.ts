// Student identity token — deliberately separate from authToken.ts.
//
// The two never share a channel: `Authorization: Bearer` always carries the
// *human actor* (a teacher or admin signed in with Google), while the cookie /
// X-Student-Token always carries the *subject* whose record is being read. A
// teacher impersonating a student holds both at once, so collapsing them into
// one header would make the request ambiguous.
//
// sessionStorage, not localStorage: an impersonation should not outlive the tab,
// and a student's identity should not linger on a shared school machine.

const STUDENT_TOKEN_KEY = "ticCampusStudentToken";

export type StudentTokenClaims = {
  sub: number;
  publicId: string;
  name: string | null;
  surname: string | null;
  course: string;
  year: number;
  src: "campus" | "impersonation";
  exp: number;
};

export function getStudentToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STUDENT_TOKEN_KEY);
}

export function setStudentToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STUDENT_TOKEN_KEY, token);
}

export function clearStudentToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STUDENT_TOKEN_KEY);
}

/**
 * Read the display claims out of a token. Purely for rendering — the backend
 * re-verifies the signature on every request, so nothing here is trusted.
 * Returns null for a malformed or expired token.
 */
export function readStudentTokenClaims(
  token: string | null,
): StudentTokenClaims | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(
      decodeURIComponent(
        Array.from(json)
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      ),
    ) as Partial<StudentTokenClaims>;
    if (typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now()) {
      return null;
    }
    if (typeof claims.publicId !== "string" || typeof claims.course !== "string") {
      return null;
    }
    return claims as StudentTokenClaims;
  } catch {
    return null;
  }
}

/**
 * fetch for student-scoped endpoints. Sends the cookie (credentials: "include")
 * and, when we hold one, the header copy — the header exists because the cookie
 * is third-party from campus.ort.edu.ar's point of view and Safari may drop it.
 */
export async function studentFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getStudentToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("X-Student-Token", token);
  }
  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
  if (response.status === 401) {
    clearStudentToken();
  }
  return response;
}
