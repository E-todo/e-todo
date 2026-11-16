import { request, isObject } from "./client";

export type User = {
  id: number;
  email: string;
  name: string;
  firstname: string;
  created_at: string;
};

function parseUser(value: unknown): User {
  if (
    !isObject(value) ||
    typeof value.id !== "number" ||
    typeof value.email !== "string" ||
    typeof value.name !== "string" ||
    typeof value.firstname !== "string" ||
    typeof value.created_at !== "string"
  )
    throw new Error("Réponse utilisateur invalide.");
  return {
    id: value.id,
    email: value.email,
    name: value.name,
    firstname: value.firstname,
    created_at: value.created_at,
  };
}
function saveToken(value: unknown) {
  if (!isObject(value) || typeof value.token !== "string" || !value.token)
    throw new Error("Réponse de connexion invalide.");
  localStorage.setItem("my-e-todo-token", value.token);
}

export async function login(email: string, password: string) {
  const data = await request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveToken(data);
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
  saveToken(data);
}

export function getUser() {
  return request("/user").then(parseUser);
}
export function updateUser(
  id: number,
  values: Partial<Pick<User, "firstname" | "name" | "email">>,
) {
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(values),
  }).then(parseUser);
}
export function deleteUser(id: number) {
  return request(`/users/${id}`, { method: "DELETE" });
}
export function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  return request("/user/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}
export function logout() {
  localStorage.removeItem("my-e-todo-token");
}
export function isLoggedIn() {
  return Boolean(localStorage.getItem("my-e-todo-token"));
}
