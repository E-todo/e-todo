import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            await login(email, password);
            navigate("/home");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Connexion impossible.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <Link to="/login" className="auth-brand">
                    MY_E-TODO
                </Link>

                <p className="auth-eyebrow">BON RETOUR</p>
                <h1>Connexion</h1>
                <p className="auth-description">
                    Connecte-toi pour retrouver toutes tes tâches.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="email">Adresse e-mail</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="exemple@email.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <label htmlFor="password">Mot de passe</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Ton mot de passe"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    {message && <p className="auth-message">{message}</p>}

                    <button type="submit" className="auth-submit">
                        {loading ? "Connexion..." : "Se connecter"}
                    </button>
                </form>

                <p className="auth-switch">
                    Pas encore de compte ?{" "}
                    <Link to="/register">Créer un compte</Link>
                </p>
            </section>
        </main>
    );
}
