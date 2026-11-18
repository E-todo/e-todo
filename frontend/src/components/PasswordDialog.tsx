import { getErrorMessage } from "../utils/errors";
import { useCallback, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Xmark } from "iconoir-react";
import { changePassword } from "../api/auth";
import { useDialog } from "../hooks/useDialog";

type PasswordDialogProps = { onClose: () => void; onSuccess: () => void };

export default function PasswordDialog({
  onClose,
  onSuccess,
}: PasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const close = useCallback(() => {
    if (!saving) onClose();
  }, [saving, onClose]);
  useDialog(true, ".password-dialog", close);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (newPassword !== confirmPassword) {
      setError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      onSuccess();
    } catch (error) {
      setError(getErrorMessage(error, "Modification impossible."));
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form
        className="task-form password-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
        aria-describedby="password-dialog-help"
        onSubmit={submit}
      >
        <div className="task-form-header">
          <h2 id="password-dialog-title">Changer le mot de passe</h2>
          <button
            type="button"
            className="close-modal-button"
            aria-label="Fermer"
            onClick={close}
            disabled={saving}
          >
            <Xmark width={22} />
          </button>
        </div>
        <p id="password-dialog-help">
          Saisissez votre mot de passe actuel, puis le nouveau deux fois.
        </p>
        <label htmlFor="current-password">Mot de passe actuel</label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          disabled={saving}
        />
        <label htmlFor="new-password">Nouveau mot de passe</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="8 caractères minimum"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          disabled={saving}
        />
        <label htmlFor="confirm-password">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={saving}
          aria-invalid={newPassword !== confirmPassword && !!error}
        />
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
            {saving ? "Modification…" : "Modifier le mot de passe"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
