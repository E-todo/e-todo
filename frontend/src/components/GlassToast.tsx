import { CheckCircle, WarningTriangle, Xmark } from "iconoir-react";

export default function GlassToast({ message, error = false, onDismiss }: {
  message: string; error?: boolean; onDismiss: () => void;
}) {
  return <div className={`v23-toast glass-toast ${error ? "is-error" : ""}`} role={error ? "alert" : "status"}>
    {error ? <WarningTriangle width={21} aria-hidden="true" /> : <CheckCircle width={21} aria-hidden="true" />}
    <span>{message}</span>
    <button type="button" onClick={onDismiss} aria-label="Fermer la notification"><Xmark width={17} /></button>
    {!error && <span className="toast-lifetime" aria-hidden="true" />}
  </div>;
}
