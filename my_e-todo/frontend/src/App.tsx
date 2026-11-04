import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './styles/App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import ProfilePage from './pages/ProfilePage'
import Login from './pages/Login'
import Register from './pages/Register'
type Theme = 'blue' | 'lavender' | 'peach' | 'sage'
function getInitialTheme(): Theme {
  const saved = window.localStorage.getItem('my-e-todo-theme')
  return saved === 'lavender' || saved === 'peach' || saved === 'sage' ? saved : 'blue'
}
function AppLayout({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const firstname = 'Otman'

  return <div className="app">
    <Sidebar theme={theme} onThemeChange={onThemeChange} />
    <div className="top-user-controls">
      <Link to="/profile" className="top-user-avatar" aria-label="Ouvrir le profil" title="Profil">
        {firstname.slice(0, 1).toUpperCase()}
      </Link>
      <button type="button" className="top-logout-button" onClick={() => navigate('/login')}>
        Déconnexion
      </button>
    </div>
    {location.pathname === '/home' && <Home />}
    {location.pathname === '/dashboard' && <Dashboard />}
    {location.pathname === '/profile' && <ProfilePage />}
  </div>
}
export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem('my-e-todo-theme', theme) }, [theme])
  return <BrowserRouter><Routes>
    <Route path="/" element={<Navigate to="/home" replace />} />
    <Route path="/home" element={<AppLayout theme={theme} onThemeChange={setTheme} />} />
    <Route path="/dashboard" element={<AppLayout theme={theme} onThemeChange={setTheme} />} />
    <Route path="/profile" element={<AppLayout theme={theme} onThemeChange={setTheme} />} />
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes></BrowserRouter>
}
