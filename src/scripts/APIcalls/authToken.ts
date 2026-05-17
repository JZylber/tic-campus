const STORAGE_KEY = "ticCampusAccessToken";

export function captureTokenFromHash(): void {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (hash.length < 2) return;

  const params = new URLSearchParams(hash.slice(1));
  const token = params.get("token");
  if (!token) return;

  localStorage.setItem(STORAGE_KEY, token);
  params.delete("token");
  const remaining = params.toString();
  const cleanUrl =
    window.location.pathname +
    window.location.search +
    (remaining ? `#${remaining}` : "");
  history.replaceState({}, "", cleanUrl);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    clearAuthToken();
  }
  return response;
}
