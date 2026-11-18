import { useRef, useState, type DragEvent } from "react";
import { EditPencil, Trash, CheckCircle, Calendar } from "iconoir-react";
import type { Task, TaskStatus } from "../types/task";

export default function TaskCard({
  task,
  today,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  task: Task;
  today: string;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: TaskStatus) => Promise<void>;
  onDragStart: (event: DragEvent<HTMLElement>, id: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const [pending, setPending] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const overdue =
    !!task.dueDate && task.dueDate < today && task.status !== "completed";
  async function toggleComplete() {
    if (pending) return;
    setPending(true);
    try {
      await onStatusChange(
        task.id,
        task.status === "completed" ? "todo" : "completed",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <article
      className={`task-card task-card-surface status-${task.status} ${isDragging ? "is-dragging" : ""} ${pending ? "is-completing" : ""}`}
      draggable={!pending}
      onDragStart={(event) => onDragStart(event, task.id)}
      onDragEnd={onDragEnd}
    >
      <div className="card-topline">
        <button
          className="task-check"
          type="button"
          role="checkbox"
          aria-checked={task.status === "completed"}
          aria-label={`${task.status === "completed" ? "Réouvrir" : "Terminer"} : ${task.title}`}
          disabled={pending}
          onClick={toggleComplete}
        >
          <CheckCircle width={21} aria-hidden="true" />
        </button>
        <details
          className="task-menu"
          ref={menu}
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              event.currentTarget.open = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && menu.current) {
              menu.current.open = false;
              menu.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label={`Actions pour ${task.title}`}>⋯</summary>
          <div className="task-menu-popup">
            <button
              type="button"
              onClick={() => {
                if (menu.current) menu.current.open = false;
                onEdit(task);
              }}
            >
              <EditPencil width={16} />
              Modifier
            </button>
            <button
              type="button"
              className="card-delete"
              onClick={() => {
                if (menu.current) menu.current.open = false;
                onDelete(task.id);
              }}
            >
              <Trash width={16} />
              Supprimer
            </button>
          </div>
        </details>
      </div>
      <button type="button" className="card-open" onClick={() => onEdit(task)}>
        <h3>{task.title}</h3>
        {task.description && (
          <p className="card-description">{task.description}</p>
        )}
        <span className={`card-date ${overdue ? "is-overdue" : ""}`}>
          <Calendar width={14} aria-hidden="true" />
          {task.dueDate
            ? task.dueDate === today
              ? "Aujourd’hui"
              : new Intl.DateTimeFormat("fr-FR", {
                  day: "numeric",
                  month: "short",
                }).format(new Date(`${task.dueDate}T12:00:00`))
            : "Sans échéance"}
          {overdue && " · En retard"}
        </span>
      </button>
    </article>
  );
}
