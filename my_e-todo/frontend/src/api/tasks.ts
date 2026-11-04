import type { Task, TaskStatus } from '../types/task'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
type ApiTask = { id: number; title: string; description: string; due_time: string; status: string }
function statusFromApi(status: string): TaskStatus {
  if (status === 'in progress') return 'in_progress'
  if (status === 'done') return 'completed'
  return 'todo'
}
function statusToApi(status: TaskStatus) {
  if (status === 'in_progress') return 'in progress'
  if (status === 'completed') return 'done'
  return 'todo'
}
async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('my-e-todo-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.msg || 'Une erreur est survenue.')
  return data
}
function convert(todo: ApiTask): Task {
  return { id: todo.id, title: todo.title, description: todo.description || '', status: statusFromApi(todo.status), priority: 'medium', dueDate: todo.due_time ? String(todo.due_time).slice(0, 10) : undefined }
}
function dateForApi(date?: string) {
  return `${date || new Date().toISOString().slice(0, 10)} 23:59:59`
}
export async function getTasks(): Promise<Task[]> { return (await request('/todos') as ApiTask[]).map(convert) }
export async function createTask(task: Omit<Task, 'id'>) {
  const todo = await request('/todos', { method: 'POST', body: JSON.stringify({ title: task.title, description: task.description, due_time: dateForApi(task.dueDate), status: statusToApi(task.status) }) }) as ApiTask
  return convert(todo)
}
export async function updateTask(id: number, task: Partial<Task>) {
  const values: Record<string, string> = {}
  if (task.title !== undefined) values.title = task.title
  if (task.description !== undefined) values.description = task.description
  if (task.dueDate !== undefined) values.due_time = dateForApi(task.dueDate)
  if (task.status !== undefined) values.status = statusToApi(task.status)
  return convert(await request(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(values) }) as ApiTask)
}
export async function deleteTask(id: number) { await request(`/todos/${id}`, { method: 'DELETE' }) }
