const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type User = {
    id: number;
    email: string;
    name: string;
    firstname: string;
    created_at: string;
};

async function request(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("my-e-todo-token");
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.msg || "Une erreur est survenue.");
    return data;
}

export async function login(email: string, password: string) {
    const data = await request("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("my-e-todo-token", data.token);
}

export async function register(
    firstname: string,
    name: string,
    email: string,
    password: string,
) {
    const data = await request("/register", {
        method: "POST",
        body: JSON.stringify({ firstname, name, email, password }),
    });
    localStorage.setItem("my-e-todo-token", data.token);
}

export function getUser() {
    return request("/user") as Promise<User>;
}
export function updateUser(
    id: number,
    values: Partial<Pick<User, "firstname" | "name" | "email">> & {
        password?: string;
    },
) {
    return request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(values),
    }) as Promise<User>;
}
export function deleteUser(id: number) {
    return request(`/users/${id}`, { method: "DELETE" });
}
export function logout() {
    localStorage.removeItem("my-e-todo-token");
}
export function isLoggedIn() {
    return Boolean(localStorage.getItem("my-e-todo-token"));
}
