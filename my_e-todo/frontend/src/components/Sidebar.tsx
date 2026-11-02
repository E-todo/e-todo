type SidebarProps = {
  firstname: string
}

export default function Sidebar({ firstname }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>MY_E-TODO</h1>
      </div>

      <div className="sidebar-greeting">
        <p>Bonjour,</p>
        <strong>{firstname}</strong>
      </div>

      <nav className="sidebar-nav">
        <a href="#" className="active">
          Accueil
        </a>
        <a href="#">
          Mes tâches
        </a>
        <a href="#">
          Mon profil
        </a>
      </nav>

      <div className="sidebar-footer">
        <button type="button">Déconnexion</button>
      </div>
    </aside>
  )
}