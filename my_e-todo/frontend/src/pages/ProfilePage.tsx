import { useState } from 'react'
export default function ProfilePage() {
  const [firstname, setFirstname] = useState('Otman')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const initials = `${firstname.slice(0, 1)}${lastname.slice(0, 1)}`.toUpperCase()
  return <main className="main-content"><section className="profile-panel">
    <p className="dashboard-eyebrow">ESPACE PERSONNEL</p><h1>Mon profil</h1>
    <div className="profile-heading"><div className="profile-initials">{initials || 'O'}</div><div><h2>{firstname} {lastname}</h2><p>Gère tes informations personnelles</p></div></div>
    <form className="profile-form" onSubmit={event => { event.preventDefault(); window.alert('Les informations seront enregistrées lorsque la gestion des comptes sera connectée au backend.') }}>
      <label htmlFor="profile-firstname">Prénom</label><input id="profile-firstname" value={firstname} onChange={event => setFirstname(event.target.value)} />
      <label htmlFor="profile-lastname">Nom</label><input id="profile-lastname" value={lastname} onChange={event => setLastname(event.target.value)} placeholder="Ton nom" />
      <label htmlFor="profile-email">Adresse e-mail</label><input id="profile-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="exemple@email.com" />
      <button className="welcome-cta" type="submit">Enregistrer les modifications</button>
    </form>
    <p className="profile-note">La modification réelle de l'adresse e-mail et du mot de passe nécessitera une connexion sécurisée au backend. Elle n'est pas simulée ici.</p>
  </section></main>
}
