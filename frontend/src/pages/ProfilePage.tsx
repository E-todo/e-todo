import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, updateUser, type User } from "../api/auth";
import PasswordDialog from "../components/PasswordDialog";

export default function ProfilePage({
  user,
  onUserChange,
}: {
  user: User;
  onUserChange: (user: User) => void;
}) {
  const [firstname, setFirstname] = useState(user.firstname);
  const [lastname, setLastname] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const closePassword = useCallback(() => setPasswordOpen(false), []);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const initials =
    `${firstname.slice(0, 1)}${lastname.slice(0, 1)}`.toUpperCase();
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const updated = await updateUser(user.id, {
        firstname,
        name: lastname,
        email,
      });
      setMessage("Profil mis à jour.");
      onUserChange(updated);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Modification impossible.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function removeAccount() {
    if (
      !window.confirm(
        "Supprimer définitivement ton compte et toutes tes tâches ?",
      )
    )
      return;
    try {
      await deleteUser(user.id);
      localStorage.removeItem("my-e-todo-token");
      navigate("/register");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }
  return (
    <main className="main-content">
      <section className="profile-panel">
        <p className="dashboard-eyebrow">ESPACE PERSONNEL</p>
        <h1>Mon profil</h1>
        <div className="profile-heading">
          <div className="profile-initials">{initials}</div>
          <div>
            <h2>
              {firstname} {lastname}
            </h2>
            <p>Gère tes informations personnelles</p>
          </div>
        </div>
        <form className="profile-form" onSubmit={save}>
          <label htmlFor="profile-firstname">Prénom</label>
          <input
            id="profile-firstname"
            value={firstname}
            onChange={(event) => setFirstname(event.target.value)}
            required
          />
          <label htmlFor="profile-lastname">Nom</label>
          <input
            id="profile-lastname"
            value={lastname}
            onChange={(event) => setLastname(event.target.value)}
            required
          />
          <label htmlFor="profile-email">Adresse e-mail</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}
          <button className="task-action-button" type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
        <button
          type="button"
          className="task-action-button profile-password-button"
          onClick={() => {
            setMessage("");
            setPasswordOpen(true);
          }}
        >
          Changer le mot de passe
        </button>
        <p className="profile-note">
          La suppression du compte entraîne également la suppression de toutes
          les tâches associées.
        </p>
        <button
          type="button"
          className="task-action-button task-delete-button"
          onClick={removeAccount}
        >
          Supprimer mon compte
        </button>
      </section>
      {passwordOpen && (
        <PasswordDialog
          onClose={closePassword}
          onSuccess={() => {
            setPasswordOpen(false);
            setMessage("Mot de passe modifi?.");
          }}
        />
      )}
    </main>
  );
}
