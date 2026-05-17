import { backendURL } from "./APIcalls/shared";
import { authFetch } from "./APIcalls/authToken";
import type { CurrentUserStore } from "./alpine/stores/currentUser";

type UserInfo = {
  id: number;
  name: string | null;
  surname: string | null;
  role: string;
};

export async function fetchCurrentUser(): Promise<UserInfo | null> {
  try {
    const response = await authFetch(`${backendURL}/user/info`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function requireAuth() {
  try {
    const response = await authFetch(`${backendURL}/user/info`);
    if (!response.ok) {
      window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
      return;
    }
    const user: UserInfo = await response.json();
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
    }
  } catch {
    window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
  }
}

export async function requireTeacherAuth() {
  try {
    const response = await authFetch(`${backendURL}/user/info`);
    if (!response.ok) {
      window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
      return;
    }
    const user: UserInfo = await response.json();
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      window.location.href = "/tic-campus/dashboard/unauthorized";
      return;
    }
    (Alpine.store("currentUser") as CurrentUserStore).set(user.id, user.name, user.surname, user.role);
  } catch {
    window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
  }
}

export async function requireAdminAuth() {
  try {
    const response = await authFetch(`${backendURL}/user/info`);
    if (!response.ok) {
      window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
      return;
    }
    const user: UserInfo = await response.json();
    if (user.role !== "ADMIN") {
      window.location.href = "/tic-campus/dashboard/unauthorized";
      return;
    }
    (Alpine.store("currentUser") as CurrentUserStore).set(user.id, user.name, user.surname, user.role);
  } catch {
    window.location.href = `${backendURL}/auth/google?returnTo=${encodeURIComponent(window.location.href)}`;
  }
}
