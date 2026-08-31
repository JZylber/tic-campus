import type { Alpine } from "alpinejs";
import type { PageDataStore } from "./pageData";
import type { AlpineCourseStore } from "./course";
import {
  endStudentSession,
  impersonateStudent,
  verifyCampusSession,
} from "../../APIcalls/studentData";
import {
  clearStudentToken,
  getStudentToken,
  readStudentTokenClaims,
  setStudentToken,
} from "../../APIcalls/studentToken";

/**
 * Who the page is showing marks for.
 *
 * Identity is no longer state the client can simply assert: it is derived from
 * a backend-signed token, either minted from the campus session (embedded) or
 * from an authorised impersonation (dashboard). Nothing here is persisted
 * except that token, so writing to this store from devtools buys nothing — the
 * backend re-verifies the signature on every request.
 */
const studentStore = (Alpine: Alpine) => ({
  name: "",
  surname: "",
  course: "",
  /** The identifier used in request URLs (User.id, or DNI on 2025 pages). */
  id: "",
  loading: false,
  /**
   * Campus told us who is logged in but we could not match them to a student.
   * Distinct from "not checked yet" and from "not signed in", because only this
   * case is worth telling the visitor about — course pages are public and an
   * unrelated visitor simply not getting marks is correct behaviour.
   */
  unidentified: false,
  /** True while a teacher or admin is viewing someone else's page. */
  actingAs: false,

  init() {
    this.applyToken(getStudentToken());
  },

  clear() {
    this.name = "";
    this.surname = "";
    this.course = "";
    this.id = "";
    this.actingAs = false;
  },

  /** Adopt a token as the current identity. Returns false if it is unusable. */
  applyToken(token: string | null): boolean {
    const claims = readStudentTokenClaims(token);
    if (!claims || !token) {
      clearStudentToken();
      this.clear();
      return false;
    }
    setStudentToken(token);
    this.name = claims.name ?? "";
    this.surname = claims.surname ?? "";
    this.course = claims.course;
    this.id = claims.publicId;
    this.actingAs = claims.src === "impersonation";
    this.unidentified = false;
    return true;
  },

  /** A live token for this year means we already have a session; no relay needed. */
  hasSessionFor(year: number): boolean {
    const claims = readStudentTokenClaims(getStudentToken());
    return claims !== null && claims.year === year && this.id !== "";
  },

  async getStudentData(subject: string, year: number) {
    this.loading = true;
    try {
      if (this.hasSessionFor(year)) return;

      // Re-adopting handles a fresh page load in the same tab, where the store
      // is new but the token is not.
      const stored = getStudentToken();
      if (stored && this.applyToken(stored) && this.hasSessionFor(year)) return;

      const onCampus = (Alpine.store("pageData") as PageDataStore).onCampus;
      if (!onCampus) {
        // Standalone: identity only ever comes from an impersonation token,
        // and there isn't a usable one.
        this.clear();
        return;
      }

      // Scope the match to the course whose page we are on — a ~30 person pool
      // where two students sharing a name is far less likely than year-wide.
      // Set by the setCourse(...) that runs immediately before this in x-init;
      // the subject index pages have no course yet and pass undefined.
      const course =
        (Alpine.store("course") as AlpineCourseStore).course || undefined;
      const result = await verifyCampusSession(course, year);
      if (result.status === "identified") {
        this.applyToken(result.token);
      } else {
        this.clear();
        clearStudentToken();
        this.unidentified = result.status === "unidentified";
      }
    } finally {
      this.loading = false;
    }
  },

  /** Teacher/admin: view a student's pages as them. */
  async impersonate(
    studentId: string,
    course: string,
    year: number,
  ): Promise<boolean> {
    const result = await impersonateStudent(studentId, course, year);
    if (result.status !== "identified") return false;
    return this.applyToken(result.token);
  },

  async stopImpersonating() {
    clearStudentToken();
    this.clear();
    this.unidentified = false;
    await endStudentSession();
  },

  isLoading() {
    return this.loading;
  },
});

export type AlpineStudentStore = ReturnType<typeof studentStore>;
export default studentStore;
