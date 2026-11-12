export type TaskStatus = 'todo' | 'in_progress' | 'completed'
export type TaskPriority = 'high' | 'medium' | 'low'

export type Task = {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
}
export const statusLabels = { todo: "\u00c0 faire", in_progress: "En cours", completed: "Termin\u00e9e" } as const;
