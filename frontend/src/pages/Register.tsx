import { getErrorMessage } from "../utils/errors";
import BackButton from "../components/BackButton";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      await register(firstname, name, email, password);
      navigate("/home");
    } catch (error) {
      setMessage(getErrorMessage(error, "Inscription impossible."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <BackButton fallback="/login" />
          <Link to="/register" className="auth-brand">
            MY_E-TODO
          </Link>
        </div>

        <p className="auth-eyebrow">COMMENCE À T'ORGANISER</p>
        <h1>Créer un compte</h1>
        <p className="auth-description">
          Quelques informations pour commencer.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-name-fields">
            <div>
              <label htmlFor="firstname">Prénom</label>
              <input
                id="firstname"
                type="text"
                placeholder="Ton prénom"
                value={firstname}
                onChange={(event) => setFirstname(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="name">Nom</label>
              <input
                id="name"
                type="text"
                placeholder="Ton nom"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          </div>
          <label htmlFor="register-email">Adresse e-mail</label>
          <input
            id="register-email"
            type="email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="register-password">Mot de passe</label>
          <input
            id="register-password"
            type="password"
            placeholder="Choisis un mot de passe"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />

          {message && <p className="auth-message">{message}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-switch">
          Tu as déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </section>
    </main>
  );
}
