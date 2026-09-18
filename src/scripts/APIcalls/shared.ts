export const backendURL =
  import.meta.env.PUBLIC_BACKEND_URL ?? "https://tic-campus-backend.vercel.app";

type ApiInit<T> = RequestInit & {
  fetcher?: typeof fetch;
  read?: (response: Response) => Promise<T>;
};

// Every backend wrapper fails soft: a non-2xx or network error is logged and
// resolves to `fallback`, so a backend hiccup renders an empty state instead
// of breaking the page.
export async function api<T>(
  path: string,
  fallback: T,
  { fetcher = fetch, read = (r) => r.json(), ...init }: ApiInit<T> = {},
): Promise<T> {
  try {
    const response = await fetcher(`${backendURL}${path}`, init);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await read(response);
  } catch (error) {
    console.error(`${init.method ?? "GET"} ${path} failed:`, error);
    return fallback;
  }
}

export const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// For endpoints whose success response has no body worth reading.
export const succeeded = async () => true;
