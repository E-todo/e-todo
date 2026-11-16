import { useCallback, useEffect, useState, type DragEvent } from "react";
import { Plus, Search } from "iconoir-react";
import GlassSkeleton from "../components/GlassSkeleton";
import TaskCalendar from "../components/TaskCalendar";
import TaskCard from "../components/TaskCard";
import TaskForm, { type TaskValues } from "../components/TaskForm";
import { useDialog } from "../components/useDialog";
import { localDate } from "../utils/dates";
import { matchesTaskFilters } from "../utils/taskFilters";
import { createTask, deleteTask, getTasks, updateTask } from "../api/tasks";
import type { Task, TaskStatus } from "../types/task";

const sections: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "À faire" },
  { status: "in_progress", title: "En cours" },
  { status: "completed", title: "Terminées" },
];

export default function Dashboard() {
  const [today, setToday] = useState(localDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const closeForm = useCallback(() => setFormOpen(false), []);
  const closeDelete = useCallback(() => {
    if (!deleting) setDeleteId(null);
  }, [deleting]);
  useDialog(deleteId !== null, ".delete-dialog", closeDelete);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Chargement impossible.",
        ),
      )
      .finally(() => setLoading(false));
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
      const updated = await updateTask(editingTask.id, values);
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      );
    } else {
      const created = await createTask(values);
      setTasks((current) => [...current, created]);
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
      const updated = await updateTask(id, { status });
      setTasks((current) =>
        current.map((task) => (task.id === id ? updated : task)),
      );
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Modification impossible.",
      );
    }
  }
  async function removeTask() {
    if (deleteId === null || deleting) return;
    setDeleting(true);
    try {
      await deleteTask(deleteId);
      setTasks((current) => current.filter((task) => task.id !== deleteId));
      setDeleteId(null);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    } finally {
      setDeleting(false);
    }
  }
  function dragStart(event: DragEvent<HTMLElement>, id: number) {
    setDraggedId(id);
    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "move";
  }
  function dragEnd() {
    setDraggedId(null);
    setDropTarget(null);
  }
  function drop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isSafeInteger(id) && id > 0) void changeStatus(id, status);
    dragEnd();
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
  const taskGroups = sections.map((section) => ({
    ...section,
    tasks: visibleTasks.filter((task) => task.status === section.status),
  }));

  let progressLabel = `${remaining} tâche${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`;
  if (loading) progressLabel = "Chargement…";

  return (
    <main
      className={`main-content refreshed-dashboard ${view === "calendar" ? "calendar-view" : ""}`}
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
          <div className="v23-view-switch" data-view={view} aria-label="Vue des t?ches">
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
            <label className="v2-search">
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
          <>
            <div
              className="mobile-status-tabs"
              aria-label="Colonnes du tableau"
            >
              {taskGroups.map((section) => (
                <button
                  key={section.status}
                  type="button"
                  aria-pressed={mobileStatus === section.status}
                  onClick={() => setMobileStatus(section.status)}
                >
                  {section.title}
                </button>
              ))}
            </div>
            <div className="task-groups">
              {taskGroups.map((section) => {
                const sectionTasks = section.tasks;
                return (
                  <section
                    key={section.status}
                    className={`task-group task-group-${section.status} ${mobileStatus === section.status ? "mobile-active" : ""} ${dropTarget === section.status ? "is-drop-target" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggedId !== null) setDropTarget(section.status);
                    }}
                    onDragLeave={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node | null,
                        )
                      )
                        setDropTarget(null);
                    }}
                    onDrop={(event) => drop(event, section.status)}
                  >
                    <div className="task-group-heading">
                      <h3>{section.title}</h3>
                    </div>
                    {dropTarget === section.status && (
                      <div className="drop-placeholder">
                        Déposer dans « {section.title} »
                      </div>
                    )}
                    {sectionTasks.length ? (
                      <div className="task-list">
                        {sectionTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            today={today}
                            onEdit={openForm}
                            onDelete={setDeleteId}
                            onStatusChange={changeStatus}
                            onDragStart={dragStart}
                            onDragEnd={dragEnd}
                            isDragging={draggedId === task.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="task-group-empty illustrated-empty">
                        <strong>Aucune tâche ici</strong>
                        <p>
                          {tasks.length
                            ? "Aucune tâche ne correspond à ces filtres."
                            : "Ajoutez votre première tâche."}
                        </p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
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
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDelete();
          }}
        >
          <section
            className="task-form delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Supprimer cette tâche ?</h2>
            <p>
              « {tasks.find((task) => task.id === deleteId)?.title} » sera
              définitivement supprimée.
            </p>
            <div className="task-form-actions">
              <button
                type="button"
                className="cancel-task-button"
                disabled={deleting}
                onClick={closeDelete}
              >
                Annuler
              </button>
              <button
                type="button"
                className="delete-confirm"
                disabled={deleting}
                onClick={removeTask}
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </section>
        </div>
      )}
    </main>
  );
}
