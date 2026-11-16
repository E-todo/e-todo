import type { Task, TaskStatus } from "../types/task";
import { request, isObject } from "./client.ts";
type ApiTask = {
  id: number;
  title: string;
  description: string;
  due_time: string;
  status: string;
};
function statusFromApi(status: string): TaskStatus {
  if (status === "in progress") return "in_progress";
  if (status === "done") return "completed";
  return "todo";
}
function statusToApi(status: TaskStatus) {
  if (status === "in_progress") return "in progress";
  if (status === "completed") return "done";
  return "todo";
}
function convert(value: unknown): Task {
  if (
    !isObject(value) ||
    typeof value.id !== "number" ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.due_time !== "string" ||
    !/^\d{4}-\d{2}-\d{2}/.test(value.due_time) ||
    typeof value.status !== "string" ||
    !["not started", "todo", "in progress", "done"].includes(value.status)
  ) {
    throw new Error("Réponse de tâche invalide.");
  }
  const todo = value as ApiTask;
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description || "",
    status: statusFromApi(todo.status),
    dueDate: todo.due_time.slice(0, 10),
  };
}
function dateForApi(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error("Une échéance est obligatoire.");
  return `${date} 23:59:59`;
}
export async function getTasks(): Promise<Task[]> {
  const data = await request("/todos");
  if (!Array.isArray(data)) throw new Error("Liste de tâches invalide.");
  return data.map(convert);
}
export async function createTask(task: Omit<Task, "id">) {
  const todo = (await request("/todos", {
    method: "POST",
    body: JSON.stringify({
      title: task.title,
      description: task.description,
      due_time: dateForApi(task.dueDate),
      status: statusToApi(task.status),
    }),
  })) as ApiTask;
  return convert(todo);
}
export async function updateTask(id: number, task: Partial<Task>) {
  const values: Record<string, string> = {};
  if (task.title !== undefined) values.title = task.title;
  if (task.description !== undefined) values.description = task.description;
  if (task.dueDate !== undefined) values.due_time = dateForApi(task.dueDate);
  if (task.status !== undefined) values.status = statusToApi(task.status);
  const updated = (await request(`/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify(values),
  })) as ApiTask;
  return convert(updated);
}
export async function deleteTask(id: number) {
  await request(`/todos/${id}`, { method: "DELETE" });
}
