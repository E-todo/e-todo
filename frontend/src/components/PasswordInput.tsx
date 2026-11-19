import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeClosed } from "iconoir-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input {...props} type={visible ? "text" : "password"} disabled={disabled} />
      <button
        type="button"
        className="password-input-toggle"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
      >
        {visible ? <EyeClosed aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  );
}
