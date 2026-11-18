import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "iconoir-react";
import GlassSkeleton from "../components/GlassSkeleton";
import TaskCalendar from "../components/TaskCalendar";
import TaskBoard from "../components/TaskBoard";
import DeleteTaskDialog from "../components/DeleteTaskDialog";
import TaskForm, { type TaskValues } from "../components/TaskForm";
import { useTasks } from "../hooks/useTasks";
import { localDate } from "../utils/dates";
import { matchesTaskFilters } from "../utils/taskFilters";
import { getErrorMessage } from "../utils/errors";
import type { Task, TaskStatus } from "../types/task";

export default function Dashboard() {
  const [today, setToday] = useState(localDate);
  const {
    tasks,
    loading,
    error,
    setError,
    addTask,
    editTask,
    removeTask: deleteTask,
  } = useTasks();
  const [view, setView] = useState<"board" | "calendar">("board");
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("todo");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const closeForm = useCallback(() => setFormOpen(false), []);
  const closeDelete = useCallback(() => {
    if (!deleting) setDeleteId(null);
  }, [deleting]);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDate()), 60000);
    return () => clearInterval(timer);
  }, []);

  function openForm(task: Task | null) {
    setSelectedDate(null);
    setEditingTask(task);
    setFormOpen(true);
  }
  async function saveTask(values: TaskValues) {
    if (editingTask) {
      await editTask(editingTask.id, values);
    } else {
      const created = await addTask(values);
      setSearch("");
      setOverdueOnly(false);
      setMobileStatus(created.status);
      setMonth(created.dueDate.slice(0, 7));
      if (view === "calendar") setSelectedDate(created.dueDate);
    }
    setError("");
  }
  async function changeStatus(id: number, status: TaskStatus) {
    if (!tasks.some((task) => task.id === id && task.status !== status)) return;
    try {
      await editTask(id, { status });
      setError("");
    } catch (error) {
      setError(getErrorMessage(error, "Modification impossible."));
    }
  }
  async function removeTask() {
    if (deleteId === null || deleting) return;
    setDeleting(true);
    try {
      await deleteTask(deleteId);
      setDeleteId(null);
      setError("");
    } catch (error) {
      setError(getErrorMessage(error, "Suppression impossible."));
    } finally {
      setDeleting(false);
    }
  }
  const visibleTasks = tasks
    .filter((task) =>
      matchesTaskFilters(task, today, {
        search,
        overdueOnly,
      }),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completed = tasks.filter((task) => task.status === "completed").length;
  const remaining = tasks.length - completed;
  let progressLabel = `${remaining} tâche${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`;
  if (loading) progressLabel = "Chargement…";

  return (
    <main
      className={`main-content dashboard-page ${view === "calendar" ? "calendar-view" : ""}`}
    >
      <section className="tasks-panel">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              {new Intl.DateTimeFormat("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(new Date(`${today}T12:00:00`))}
            </p>
            <h2>Mes tâches</h2>
          </div>
          <div
            className="view-switch"
            data-view={view}
            aria-label="Vue des tâches"
          >
            <button
              type="button"
              className={view === "board" ? "active" : ""}
              aria-pressed={view === "board"}
              onClick={() => setView("board")}
            >
              Kanban
            </button>
            <button
              type="button"
              className={view === "calendar" ? "active" : ""}
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
            >
              Calendrier
            </button>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="new-task"
              onClick={() => openForm(null)}
            >
              <Plus width={18} />
              Nouvelle tâche
            </button>
          </div>
        </header>
        <div className="task-progress">
          <div className="task-progress-label">
            <span id="task-progress-label">{progressLabel}</span>
          </div>
          <progress
            max={tasks.length || 1}
            value={completed}
            aria-labelledby="task-progress-label"
            aria-valuetext={`${completed} tâches terminées sur ${tasks.length}`}
          />
        </div>
        {error && deleteId === null && (
          <p className="dashboard-error" role="alert">
            {error}
          </p>
        )}
        {loading && <GlassSkeleton />}
        <div className="dashboard-controls">
          <div className="task-toolbar">
            <label className="task-search">
              <Search width={19} aria-hidden="true" />
              <input
                type="search"
                aria-label="Rechercher une tâche"
                placeholder="Rechercher une tâche…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="overdue-filter"
              aria-pressed={overdueOnly}
              onClick={() => {
                setOverdueOnly((current) => !current);
                if (!overdueOnly && mobileStatus === "completed")
                  setMobileStatus("todo");
              }}
            >
              En retard
            </button>
          </div>
        </div>
        {!loading && view === "calendar" && (
          <TaskCalendar
            tasks={visibleTasks}
            month={month}
            today={today}
            onMonthChange={setMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEdit={(id) => {
              const task = tasks.find((task) => task.id === id);
              if (task) openForm(task);
            }}
          />
        )}
        {!loading && view === "board" && (
          <TaskBoard
            tasks={visibleTasks}
            totalTasks={tasks.length}
            today={today}
            mobileStatus={mobileStatus}
            onStatusSelect={setMobileStatus}
            onEdit={openForm}
            onDelete={setDeleteId}
            onStatusChange={changeStatus}
          />
        )}
        <div className="add-task-container">
          <button
            type="button"
            className="add-task-button"
            aria-label="Ajouter une tâche"
            onClick={() => openForm(null)}
          >
            <Plus width={24} />
          </button>
        </div>
      </section>
      {formOpen && (
        <TaskForm task={editingTask} onSave={saveTask} onClose={closeForm} />
      )}
      {deleteId !== null && (
        <DeleteTaskDialog
          title={tasks.find((task) => task.id === deleteId)?.title ?? ""}
          deleting={deleting}
          error={error}
          onClose={closeDelete}
          onConfirm={removeTask}
        />
      )}
    </main>
  );
}
