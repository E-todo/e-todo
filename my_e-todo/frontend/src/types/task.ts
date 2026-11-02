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