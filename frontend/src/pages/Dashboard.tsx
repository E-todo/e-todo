import { matchesTaskFilters } from "../utils/taskFilters";
import "../styles/dashboard-refresh.css";
import { Plus, Xmark, Search, CheckCircle, TaskList } from "iconoir-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import GlassSkeleton from "../components/GlassSkeleton";
import GlassToast from "../components/GlassToast";
import TaskCalendar from "../components/TaskCalendar";
import { useDialog } from "../components/useDialog";
import { localDate } from "../utils/dates";
import { readStorage, writeStorage } from "../utils/storage";
import TaskCard from "../components/TaskCard";
import TaskInfo from "../components/TaskInfo";
import type { FormEvent, DragEvent } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import type { Task, TaskStatus, TaskPriority } from "../types/task";

const sections: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "À faire" },
  { status: "in_progress", title: "En cours" },
  { status: "completed", title: "Terminées" },
];

const priorityOrder: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export default function Dashboard() {
  const [today, setToday] = useState(() => localDate());
  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDate()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [focusMode, setFocusMode] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("todo");
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [view, setView] = useState<"board" | "calendar">("board");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    localDate().slice(0, 7),
  );
  const [detailId, setDetailId] = useState<number | null>(null);
  const [tagFilter, setTagFilter] = useState("all");
  const [sortMode, setSortMode] = useState("priority");
  const [taskMeta, setTaskMeta] = useState<
    Record<string, { tags: string[]; rank: number }>
  >(() => {
    try {
      const parsed = JSON.parse(readStorage("my-e-todo-frontend-meta") || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return {};
      return Object.fromEntries(
        Object.entries(parsed).map(([id, value]) => {
          const meta = value as { tags?: unknown; rank?: unknown } | null;
          return [
            id,
            {
              tags: Array.isArray(meta?.tags)
                ? [
                    ...new Set(
                      meta.tags.filter(
                        (tag): tag is string => typeof tag === "string",
                      ),
                    ),
                  ]
                : [],
              rank:
                typeof meta?.rank === "number" && Number.isFinite(meta.rank)
                  ? meta.rank
                  : Number(id),
            },
          ];
        }),
      );
    } catch {
      return {};
    }
  });
  useEffect(() => {
    writeStorage("my-e-todo-frontend-meta", JSON.stringify(taskMeta));
  }, [taskMeta]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const allTags = useMemo(
    () =>
      [
        ...new Set(taskList.flatMap((task) => taskMeta[task.id]?.tags || [])),
      ].sort(),
    [taskMeta, taskList],
  );
  const detailTask = taskList.find((task) => task.id === detailId);
  function setMeta(id: number, tags: string[], rank?: number) {
    setTaskMeta((current) => ({
      ...current,
      [id]: { tags, rank: rank ?? current[id]?.rank ?? Date.now() },
    }));
  }
  function moveTask(id: number, direction: -1 | 1) {
    const currentTasks = sortedTasks.filter(
      (task) => task.status === taskList.find((t) => t.id === id)?.status,
    );
    const ordered = [...currentTasks].sort(
      (a, b) => (taskMeta[a.id]?.rank ?? a.id) - (taskMeta[b.id]?.rank ?? b.id),
    );
    const index = ordered.findIndex((t) => t.id === id),
      next = index + direction;
    if (next < 0 || next >= ordered.length) return;
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    setTaskMeta((current) => {
      const result = { ...current };
      ordered.forEach((task, i) => {
        result[task.id] = { tags: current[task.id]?.tags || [], rank: i + 1 };
      });
      return result;
    });
    setToast("Ordre des tâches mis à jour");
  }

  useEffect(() => {
    getTasks()
      .then(setTaskList)
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [formTags, setFormTags] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  // DRAG AND DROP

  function handleDragStart(event: DragEvent<HTMLElement>, id: number) {
    setDraggedTaskId(id);

    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggedTaskId(null);
    setDropTarget(null);
  }

  function handleDrop(event: DragEvent<HTMLElement>, newStatus: TaskStatus) {
    event.preventDefault();

    const id = Number(event.dataTransfer.getData("text/plain"));

    if (!Number.isInteger(id) || id <= 0) {
      setDraggedTaskId(null);
      setDropTarget(null);
      return;
    }

    handleStatusChange(id, newStatus);
    setDraggedTaskId(null);
    setDropTarget(null);
  }

  // FORMULAIRE

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setFormTags("");
    setTagDraft("");
    setEditingTaskId(null);
    setIsFormOpen(false);
  }, [
    setTitle,
    setDescription,
    setDueDate,
    setPriority,
    setFormTags,
    setEditingTaskId,
    setIsFormOpen,
  ]);
  const closeDetails = useCallback(() => setDetailId(null), []);
  useDialog(isFormOpen, ".task-form", resetForm);
  useDialog(detailId !== null, ".v23-detail", closeDetails);

  const closeDelete = useCallback(() => {
    if (!deleting) setDeleteId(null);
  }, [deleting]);
  useDialog(deleteId !== null, ".delete-dialog", closeDelete);
  function addTag() {
    const next = [
      ...new Set(
        [...formTags.split(","), ...tagDraft.split(",")]
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ].slice(0, 8);
    setFormTags(next.join(", "));
    setTagDraft("");
  }
  function openCreateForm() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setFormTags("");
    setTagDraft("");
    setEditingTaskId(null);
    setIsFormOpen(true);
  }

  function openEditForm(task: Task) {
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate ?? "");
    setPriority(task.priority);
    setFormTags((taskMeta[task.id]?.tags || []).join(", "));
    setTagDraft("");
    setEditingTaskId(task.id);
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
    };

    if (!taskData.title) {
      const input =
        event.currentTarget.querySelector<HTMLInputElement>("#task-title");
      input?.setCustomValidity(
        "Le titre ne peut pas contenir uniquement des espaces.",
      );
      input?.reportValidity();
      return;
    }
    setSaving(true);

    try {
      if (editingTaskId !== null) {
        const updated = await updateTask(editingTaskId, taskData);
        setMeta(
          editingTaskId,
          [
            ...new Set(
              `${formTags},${tagDraft}`
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            ),
          ].slice(0, 8),
        );
        setTaskList((current) =>
          current.map((task) =>
            task.id === editingTaskId
              ? { ...task, ...updated, priority }
              : task,
          ),
        );
      } else {
        const created = await createTask({
          ...taskData,
          status: "todo",
        });
        setTaskList((current) => [...current, { ...created, priority }]);
        setMeta(
          created.id,
          [
            ...new Set(
              `${formTags},${tagDraft}`
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            ),
          ].slice(0, 8),
        );
      }
      setMessage("");
      setToast(editingTaskId !== null ? "Tâche modifiée" : "Tâche créée");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
      return;
    } finally {
      setSaving(false);
    }

    resetForm();
  }

  // SUPPRESSION

  async function handleDelete(id: number) {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteTask(id);
      setMessage("");
      setToast("Tâche supprimée");
      setDeleteId(null);
      setTaskMeta((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setDetailId((current) => (current === id ? null : current));
      setTaskList((currentTasks) =>
        currentTasks.filter((task) => task.id !== id),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    } finally {
      setDeleting(false);
    }
  }

  // CHANGEMENT DE STATUT

  async function handleStatusChange(id: number, status: TaskStatus) {
    if (!taskList.some((task) => task.id === id && task.status !== status))
      return;
    try {
      const updated = await updateTask(id, { status });
      setMessage("");
      setToast(
        status === "completed"
          ? "Une tâche de moins, bien joué !"
          : "Statut mis à jour",
      );
      setTaskList((current) =>
        current.map((task) =>
          task.id === id ? { ...task, ...updated } : task,
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Modification impossible.",
      );
    }
  }

  // TRI DES TÂCHES PAR PRIORITÉ

  const sortedTasks = taskList
    .filter((task) =>
      matchesTaskFilters(task, taskMeta[task.id]?.tags || [], today, {
        search,
        status: statusFilter,
        priority: priorityFilter,
        date: dateFilter,
        tag: tagFilter,
        focus: focusMode,
      }),
    )
    .sort((a, b) =>
      sortMode === "custom"
        ? (taskMeta[a.id]?.rank ?? a.id) - (taskMeta[b.id]?.rank ?? b.id)
        : sortMode === "date"
          ? (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
          : sortMode === "title"
            ? a.title.localeCompare(b.title, "fr")
            : priorityOrder[a.priority] - priorityOrder[b.priority],
    );

  const dueToday = taskList.filter((task) => task.dueDate === today);
  const doneToday = dueToday.filter(
    (task) => task.status === "completed",
  ).length;
  const overdueCount = taskList.filter(
    (task) =>
      task.dueDate && task.dueDate < today && task.status !== "completed",
  ).length;
  const activeFilters = [
    {
      value: statusFilter,
      label: sections.find((s) => s.status === statusFilter)?.title,
      clear: () => setStatusFilter("all"),
    },
    {
      value: priorityFilter,
      label: `Priorité : ${{ high: "élevée", medium: "moyenne", low: "faible" }[priorityFilter]}`,
      clear: () => setPriorityFilter("all"),
    },
    {
      value: dateFilter,
      label: (
        {
          today: "Aujourd’hui",
          overdue: "En retard",
          upcoming: "À venir",
          "no-date": "Sans date",
        } as Record<string, string>
      )[dateFilter],
      clear: () => setDateFilter("all"),
    },
    { value: tagFilter, label: tagFilter, clear: () => setTagFilter("all") },
  ].filter((filter) => filter.value !== "all");
  return (
    <main
      className={`main-content refreshed-dashboard ${focusMode ? "focus-mode" : ""}`}
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
            <h2>{focusMode ? "Un jour, un pas à la fois" : "Mes tâches"}</h2>
          </div>

          <div className="v23-view-switch">
            <button
              type="button"
              aria-pressed={view === "board"}
              className={view === "board" ? "active" : ""}
              onClick={() => setView("board")}
            >
              Kanban
            </button>
            <button
              type="button"
              aria-pressed={view === "calendar"}
              className={view === "calendar" ? "active" : ""}
              onClick={() => setView("calendar")}
            >
              Calendrier
            </button>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="focus-toggle"
              aria-pressed={focusMode}
              onClick={() => setFocusMode(!focusMode)}
            >
              {focusMode ? "Quitter la concentration" : "Concentration"}
            </button>
            <button type="button" className="new-task" onClick={openCreateForm}>
              <Plus width={18} />
              Nouvelle tâche
            </button>
          </div>
          <span className="tasks-total">
            {taskList.length} tâche{taskList.length > 1 ? "s" : ""}
          </span>
        </header>

        <div className="daily-summary">
          <div>
            <strong>{dueToday.length - doneToday} à faire aujourd’hui</strong>
            <span> · {overdueCount} en retard</span>
          </div>
          <div className="daily-progress">
            <progress
              max={dueToday.length || 1}
              value={doneToday}
              aria-label="Progression des tâches du jour"
            />
            <span>
              {doneToday}/{dueToday.length} terminées
            </span>
          </div>
        </div>
        {message && (
          <p className="auth-message" role="alert">
            {message}
          </p>
        )}
        {loading && <GlassSkeleton />}
        <div className="dashboard-controls">
          <div className="task-toolbar">
            <label className="v2-search">
              <Search width={19} height={19} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une tâche…"
                aria-label="Rechercher une tâche"
              />
            </label>
            <label className="task-sort">
              Trier par
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
              >
                <option value="priority">Priorité</option>
                <option value="custom">Ordre personnalisé</option>
                <option value="date">Échéance</option>
                <option value="title">Titre</option>
              </select>
            </label>
          </div>
          <div className="quick-filters" aria-label="Filtres rapides">
            <button
              type="button"
              aria-pressed={dateFilter === "today"}
              onClick={() =>
                setDateFilter(dateFilter === "today" ? "all" : "today")
              }
            >
              Aujourd’hui
            </button>
            <button
              type="button"
              aria-pressed={dateFilter === "overdue"}
              onClick={() =>
                setDateFilter(dateFilter === "overdue" ? "all" : "overdue")
              }
            >
              En retard
            </button>
            <button
              type="button"
              aria-pressed={priorityFilter === "high"}
              onClick={() =>
                setPriorityFilter(priorityFilter === "high" ? "all" : "high")
              }
            >
              Priorité élevée
            </button>
          </div>
          <details className="task-filters">
            <summary>
              Filtres{" "}
              <span>
                {
                  [statusFilter, priorityFilter, dateFilter, tagFilter].filter(
                    (value) => value !== "all",
                  ).length
                }{" "}
                actif(s)
              </span>
            </summary>
            <div className="filter-fields">
              <label>
                Statut
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    if (e.target.value !== "all")
                      setMobileStatus(e.target.value as TaskStatus);
                  }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminées</option>
                </select>
              </label>
              <label>
                Priorité
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="high">Élevée</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Faible</option>
                </select>
              </label>
              <label>
                Échéance
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Toutes les dates</option>
                  <option value="today">Aujourd’hui</option>
                  <option value="upcoming">À venir</option>
                  <option value="overdue">En retard</option>
                  <option value="no-date">Sans date</option>
                </select>
              </label>
              {allTags.length > 0 && (
                <label>
                  Étiquette
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                  >
                    <option value="all">Toutes les étiquettes</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                className="v2-clear"
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setDateFilter("all");
                  setTagFilter("all");
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          </details>
          <div className="active-filters">
            {activeFilters.map((filter) => (
              <button
                type="button"
                key={filter.label}
                onClick={filter.clear}
                aria-label={`Retirer le filtre ${filter.label}`}
              >
                {filter.label}
                <Xmark width={14} />
              </button>
            ))}
          </div>
        </div>
        <p className="v2-results" aria-live="polite">
          {sortedTasks.length} tâche{sortedTasks.length > 1 ? "s" : ""} affichée
          {sortedTasks.length > 1 ? "s" : ""}
        </p>
        {!loading && !focusMode && view === "calendar" && (
          <TaskCalendar
            tasks={sortedTasks}
            month={calendarMonth}
            today={today}
            onMonthChange={setCalendarMonth}
            onDetails={setDetailId}
          />
        )}
        {!loading && (focusMode || view === "board") && (
          <>
            <div
              className="mobile-status-tabs"
              aria-label="Colonnes du tableau"
            >
              {sections.map((section) => (
                <button
                  type="button"
                  key={section.status}
                  aria-pressed={mobileStatus === section.status}
                  onClick={() => setMobileStatus(section.status)}
                >
                  {section.title}
                  <span>
                    {
                      sortedTasks.filter(
                        (task) => task.status === section.status,
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
            <div className="task-groups">
              {sections.map((section) => {
                const sectionTasks = sortedTasks.filter(
                  (task) => task.status === section.status,
                );

                return (
                  <section
                    className={`task-group task-group-${section.status} ${mobileStatus === section.status ? "mobile-active" : ""} ${dropTarget === section.status ? "is-drop-target" : ""}`}
                    key={section.status}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (draggedTaskId !== null) setDropTarget(section.status);
                    }}
                    onDragLeave={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node | null,
                        )
                      )
                        setDropTarget(null);
                    }}
                    onDrop={(event) => handleDrop(event, section.status)}
                  >
                    <div className="task-group-heading">
                      <h3>{section.title}</h3>
                      <span>{sectionTasks.length}</span>
                    </div>

                    {dropTarget === section.status && (
                      <div className="drop-placeholder">
                        Déposer dans « {section.title} »
                      </div>
                    )}
                    {sectionTasks.length > 0 ? (
                      <div className="task-list">
                        {sectionTasks.map((task) => (
                          <div className="v23-task-wrap" key={task.id}>
                            <TaskCard
                              key={task.id}
                              task={task}
                              tags={taskMeta[task.id]?.tags || []}
                              today={today}
                              onStatusChange={handleStatusChange}
                              onEdit={openEditForm}
                              onDetails={(task) => setDetailId(task.id)}
                              onDelete={setDeleteId}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedTaskId === task.id}
                            />
                            {sortMode === "custom" && (
                              <div className="v23-order">
                                <button
                                  type="button"
                                  onClick={() => moveTask(task.id, -1)}
                                  aria-label={`Monter ${task.title}`}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveTask(task.id, 1)}
                                  aria-label={`Descendre ${task.title}`}
                                >
                                  ↓
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="task-group-empty illustrated-empty">
                        <span className="empty-art" aria-hidden="true">
                          {section.status === "completed" ? (
                            <CheckCircle width={34} />
                          ) : (
                            <TaskList width={34} />
                          )}
                        </span>
                        <strong>
                          {section.status === "completed"
                            ? "Chaque petit pas compte"
                            : "Un peu de place pour vos idées"}
                        </strong>
                        <p>
                          {taskList.length
                            ? "Aucune tâche ne correspond ici."
                            : "Vos prochaines tâches trouveront leur place ici."}
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
            title="Ajouter une tâche"
            onClick={openCreateForm}
          >
            <Plus width={24} height={24} />
          </button>
        </div>
      </section>

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
              « {taskList.find((task) => task.id === deleteId)?.title} » sera
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
                onClick={() => handleDelete(deleteId)}
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </section>
        </div>
      )}
      {(message || toast) && (
        <GlassToast
          key={message || toast}
          message={message || toast}
          error={!!message}
          onDismiss={() => {
            setMessage("");
            setToast("");
          }}
        />
      )}
      {detailTask && (
        <div
          className="v23-detail-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailId(null);
          }}
        >
          <aside
            className="v23-detail"
            role="dialog"
            aria-modal="true"
            aria-label="Détails de la tâche"
          >
            <div className="v23-detail-top">
              <h2>Détails</h2>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                aria-label="Fermer"
              >
                <Xmark width={20} />
              </button>
            </div>
            <h3>{detailTask.title}</h3>
            <p>{detailTask.description || "Aucune description"}</p>
            <TaskInfo task={detailTask} today={today} />
            <dl>
              <dt>Changer le statut</dt>
              <dd>
                <select
                  aria-label="Statut de la tâche"
                  value={detailTask.status}
                  onChange={(event) =>
                    handleStatusChange(
                      detailTask.id,
                      event.target.value as TaskStatus,
                    )
                  }
                >
                  {sections.map((section) => (
                    <option key={section.status} value={section.status}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </dd>
              <dt>Étiquettes</dt>
              <dd>
                {(taskMeta[detailTask.id]?.tags || []).join(", ") || "Aucune"}
              </dd>
            </dl>
            <button
              type="button"
              className="save-task-button"
              onClick={() => {
                setDetailId(null);
                openEditForm(detailTask);
              }}
            >
              Modifier la tâche
            </button>
          </aside>
        </div>
      )}
      {isFormOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              resetForm();
            }
          }}
        >
          <form
            className="task-form v2-task-form"
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-label={
              editingTaskId !== null ? "Modifier la tâche" : "Nouvelle tâche"
            }
          >
            <div className="task-form-header">
              <h2>
                {editingTaskId !== null
                  ? "Modifier la tâche"
                  : "Nouvelle tâche"}
              </h2>

              <button
                type="button"
                className="close-modal-button"
                onClick={resetForm}
                aria-label="Fermer"
              >
                <Xmark width={22} height={22} />
              </button>
            </div>

            <p className="task-form-help">
              Seul le titre est obligatoire. Les autres informations sont
              facultatives.
            </p>
            <label htmlFor="task-title">Titre (obligatoire)</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(event) => {
                event.target.setCustomValidity("");
                setTitle(event.target.value);
              }}
              placeholder="Nom de la tâche"
              required
              maxLength={120}
            />

            <label htmlFor="task-description">Description (facultative)</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Que faut-il faire ? Ajoute les détails utiles pour t’y retrouver…"
              rows={5}
            />

            <label htmlFor="task-date">Date d'échéance (facultative)</label>
            <input
              id="task-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />

            <label htmlFor="task-tags">Étiquettes (8 maximum)</label>
            <div className="tag-editor">
              <div className="card-tags">
                {formTags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() =>
                        setFormTags(
                          formTags
                            .split(",")
                            .filter((value) => value.trim() !== tag)
                            .join(","),
                        )
                      }
                      aria-label={`Retirer ${tag}`}
                    >
                      {tag}
                      <Xmark width={13} />
                    </button>
                  ))}
              </div>
              <div className="tag-entry">
                <input
                  id="task-tags"
                  value={tagDraft}
                  maxLength={160}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Travail, Personnel…"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagDraft.trim()}
                >
                  Ajouter
                </button>
              </div>
            </div>
            <fieldset className="priority-picker">
              <legend>Priorité</legend>
              {(["low", "medium", "high"] as TaskPriority[]).map((value) => (
                <label key={value} className={`priority-${value}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={value}
                    checked={priority === value}
                    onChange={() => setPriority(value)}
                  />
                  <span>
                    {
                      { low: "Faible", medium: "Moyenne", high: "Élevée" }[
                        value
                      ]
                    }
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="task-form-actions">
              <button
                type="button"
                className="cancel-task-button"
                onClick={resetForm}
              >
                Annuler
              </button>

              {message && (
                <p className="auth-message" role="alert">
                  {message}
                </p>
              )}
              <button
                type="submit"
                className="save-task-button"
                disabled={saving}
              >
                {editingTaskId !== null ? "Enregistrer" : "Ajouter la tâche"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
