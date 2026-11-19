import { getErrorMessage } from "../utils/errors";
import { useCallback, useState, type FormEvent } from "react";
import { Xmark } from "iconoir-react";
import { useDialog } from "../hooks/useDialog";
import { statusLabels, type Task, type TaskStatus } from "../types/task";

export type TaskValues = Omit<Task, "id">;
export default function TaskForm({
  task,
  onSave,
  onClose,
}: {
  task: Task | null;
  onSave: (values: TaskValues) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const close = useCallback(() => {
    if (!saving) onClose();
  }, [saving, onClose]);
  useDialog(true, ".task-editor", close);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim()) {
      setError("Le titre ne peut pas être vide.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        status,
      });
      onClose();
    } catch (error) {
      setError(getErrorMessage(error, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form
        className="task-form task-editor-form task-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onSubmit={submit}
      >
        <div className="task-form-header">
          <h2 id="task-form-title">
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </h2>
          <button
            type="button"
            className="close-modal-button"
            onClick={close}
            disabled={saving}
            aria-label="Fermer"
          >
            <Xmark width={22} />
          </button>
        </div>
        <label htmlFor="task-title">Titre</label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={255}
          disabled={saving}
        />
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          disabled={saving}
        />
        <label htmlFor="task-date">Date d’échéance</label>
        <input
          id="task-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          disabled={saving}
        />
        <label htmlFor="task-status">Statut</label>
        <select
          id="task-status"
          value={status}
          disabled={saving}
          onChange={(event) => {
            const value = event.target.value;
            if (
              value === "todo" ||
              value === "in_progress" ||
              value === "completed"
            )
              setStatus(value);
          }}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}
        <div className="task-form-actions">
          <button
            type="button"
            className="cancel-task-button"
            onClick={close}
            disabled={saving}
          >
            Annuler
          </button>
          <button type="submit" className="save-task-button" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
