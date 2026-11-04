import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('La connexion sera activée lors du branchement du backend.')
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
            Se connecter
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </section>
    </main>
  )
}