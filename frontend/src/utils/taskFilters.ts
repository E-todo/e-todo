import type { Task } from "../types/task";
export type TaskFilters = { search: string; overdueOnly: boolean };
export function matchesTaskFilters(
  task: Task,
  today: string,
  filters: TaskFilters,
): boolean {
  const query = filters.search.trim().toLocaleLowerCase("fr");
  if (
    query &&
    !`${task.title} ${task.description}`.toLocaleLowerCase("fr").includes(query)
  )
    return false;
  return (
    !filters.overdueOnly ||
    (task.dueDate < today && task.status !== "completed")
  );
}
