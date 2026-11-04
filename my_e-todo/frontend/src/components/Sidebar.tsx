import { NavLink } from 'react-router-dom'

type Theme = 'blue' | 'lavender' | 'peach' | 'sage'
type SidebarProps = { theme: Theme; onThemeChange: (theme: Theme) => void }
const themes: { id: Theme; label: string; color: string }[] = [
  { id: 'blue', label: 'Bleu', color: '#7299C8' },
  { id: 'lavender', label: 'Violet', color: '#B1B2FF' },
  { id: 'sage', label: 'Vert', color: '#41ab5d' },
  { id: 'peach', label: 'Orange', color: '#E9A46A' },
]
function Icon({ name }: { name: 'home' | 'tasks' }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    tasks: <><rect x="4" y="4" width="16" height="17" rx="2"/><path d="m8 9 1.5 1.5L12 8M14 9h3M8 15h9"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
export default function Sidebar({ theme, onThemeChange }: SidebarProps) {
  return <aside className="sidebar">
    <NavLink to="/home" className="sidebar-brand">MY E-TODO</NavLink>
    <nav className="sidebar-nav" aria-label="Navigation principale">
      <NavLink to="/home" title="Accueil" aria-label="Accueil"><Icon name="home" /></NavLink>
      <NavLink to="/dashboard" title="Mes tâches" aria-label="Mes tâches"><Icon name="tasks" /></NavLink>
    </nav>
    <div className="sidebar-footer">
      <div className="theme-picker">
        <span className="theme-picker-label">Thème</span>
        <div className="theme-options" role="group" aria-label="Choisir un thème">
          {themes.map(item => <button key={item.id} type="button" className={`theme-option ${theme === item.id ? 'selected' : ''}`} title={item.label} aria-label={`Thème ${item.label}`} aria-pressed={theme === item.id} onClick={() => onThemeChange(item.id)}><span className="theme-option-swatch" style={{ backgroundColor: item.color }} /></button>)}
        </div>
      </div>
    </div>
  </aside>
}
