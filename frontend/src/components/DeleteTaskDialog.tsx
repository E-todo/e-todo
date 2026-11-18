import { useDialog } from "../hooks/useDialog";

type DeleteTaskDialogProps = {
  title: string;
  deleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};
export default function DeleteTaskDialog({
  title,
  deleting,
  error,
  onClose,
  onConfirm,
}: DeleteTaskDialogProps) {
  useDialog(true, ".delete-dialog", onClose);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="task-form delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >
        <h2 id="delete-title">Supprimer cette tâche ?</h2>
        <p>« {title} » sera définitivement supprimée.</p>
        <div className="task-form-actions">
          <button
            type="button"
            className="cancel-task-button"
            disabled={deleting}
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="delete-confirm"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  );
}
