import './styles/App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div className="app">
      <Sidebar firstname="Otman" />
      <Dashboard />
    </div>
  )
}