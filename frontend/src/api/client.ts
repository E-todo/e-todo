const API_URL = (
  import.meta.env?.VITE_API_URL ||
  (import.meta.env?.DEV ? "http://localhost:3000" : "https://e-todo-api.vercel.app")
).replace(/\/+$/, "");

export async function request(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const token = localStorage.getItem("my-e-todo-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      isObject(data) && typeof data.msg === "string"
        ? data.msg
        : "Une erreur est survenue.";
    throw new Error(message);
  }
  return data;
}
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
