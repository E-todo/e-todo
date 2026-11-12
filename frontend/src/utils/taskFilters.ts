import type { Task } from '../types/task';

export type TaskFilters = {
  search: string;
  status: string;
  priority: string;
  date: string;
  tag: string;
  focus: boolean;
};

export function matchesTaskFilters(task: Task, tags: string[], today: string, filters: TaskFilters): boolean {
  // Concentration temporarily ignores saved filters; exiting restores them.
  if (filters.focus) return task.dueDate === today;
  const query = filters.search.trim().toLocaleLowerCase('fr');
  if (query && !`${task.title} ${task.description}`.toLocaleLowerCase('fr').includes(query)) return false;
  if (filters.status !== 'all' && task.status !== filters.status) return false;
  if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
  if (filters.tag !== 'all' && !tags.includes(filters.tag)) return false;
  switch (filters.date) {
    case 'today': return task.dueDate === today;
    case 'overdue': return !!task.dueDate && task.dueDate < today && task.status !== 'completed';
    case 'upcoming': return !!task.dueDate && task.dueDate >= today && task.status !== 'completed';
    case 'no-date': return !task.dueDate;
    default: return true;
  }
}
