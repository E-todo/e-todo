import { useEffect, useState } from "react";
import { createTask, deleteTask, getTasks, updateTask } from "../api/tasks";
import type { Task } from "../types/task";
import { getErrorMessage } from "../utils/errors";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((error) =>
        setError(getErrorMessage(error, "Chargement impossible.")),
      )
      .finally(() => setLoading(false));
  }, []);

  async function addTask(values: Omit<Task, "id">) {
    const created = await createTask(values);
    setTasks((current) => [...current, created]);
    return created;
  }

  async function editTask(id: number, values: Partial<Task>) {
    const updated = await updateTask(id, values);
    setTasks((current) =>
      current.map((task) => (task.id === updated.id ? updated : task)),
    );
    return updated;
  }

  async function removeTask(id: number) {
    await deleteTask(id);
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return { tasks, loading, error, setError, addTask, editTask, removeTask };
}
