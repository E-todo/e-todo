export type TaskStatus = "todo" | "in_progress" | "completed";
export type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
};
export const statusLabels = {
  todo: "À faire",
  in_progress: "En cours",
  completed: "Terminée",
} as const;
