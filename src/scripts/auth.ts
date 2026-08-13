import { backendURL } from "./APIcalls/shared";
import { authFetch } from "./APIcalls/authToken";
import type { CurrentUserStore } from "./alpine/stores/currentUser";
import type { DashboardRole } from "./dashboardSections";

type UserInfo = {
  id: number;
  name: string | null;
  surname: string | null;
  role: string;
};

const unauthorizedURL = `${import.meta.env.BASE_URL}dashboard/unauthorized`;

export async function fetchCurrentUser(): Promise<UserInfo | null> {
  try {
    const response = await authFetch(`${backendURL}/user/info`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Single dashboard auth guard: fetches the current user, sends them through
// Google OAuth if they're not logged in, sends them to /dashboard/unauthorized
// if their role isn't in `allowed`, and otherwise populates the currentUser
// store and returns the user. `allowed` is the same role list a page's nav
// section declares in dashboardSections.ts, so the guard and the nav can
// never drift apart.
export async function requireAuth(
  allowed: DashboardRole[],
): Promise<UserInfo | null> {
  try {
    const response = await authFetch(`${backendURL}/user/info`);
    if (!response.ok) {
      window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
      return null;
    }
    const user: UserInfo = await response.json();
    if (!allowed.includes(user.role as DashboardRole)) {
      window.location.href = unauthorizedURL;
      return null;
    }
    (Alpine.store("currentUser") as CurrentUserStore).set(user.id, user.name, user.surname, user.role);
    return user;
  } catch {
    window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
    return null;
  }
}
