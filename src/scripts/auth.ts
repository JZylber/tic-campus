import { backendURL } from "./APIcalls/shared";

export async function requireAuth() {
  try {
    const response = await fetch(`${backendURL}/user/role`, {
      credentials: "include",
    });
    if (!response.ok) {
      window.location.href = `${backendURL}/auth/google`;
      return;
    }
    const { role } = await response.json();
    if (role !== "TEACHER" && role !== "ADMIN") {
      window.location.href = `${backendURL}/auth/google`;
    }
  } catch {
    window.location.href = `${backendURL}/auth/google`;
  }
}
