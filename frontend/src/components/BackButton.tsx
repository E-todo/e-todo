import { useNavigate } from "react-router-dom";
import { NavArrowLeft } from "iconoir-react";

export default function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate();

  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }

  return (
    <button type="button" className="auth-back" onClick={goBack}>
      <NavArrowLeft width={18} aria-hidden="true" />
      Retour
    </button>
  );
}
