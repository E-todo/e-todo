import GlassSkeleton from "../components/GlassSkeleton";
import { ArrowRight } from "iconoir-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTasks } from "../api/tasks";
import type { Task } from "../types/task";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => { getTasks().then(setTasks).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  if (loading) return <main className="main-content home-main"><section className="welcome-panel"><GlassSkeleton compact /></section></main>;
  const todo = tasks.filter(t => t.status === "todo").length;
  const progress = tasks.filter(t => t.status === "in_progress").length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const total = tasks.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  return <main className="main-content home-main">
    <section className="welcome-panel premium-home home-v21">
      <header className="home-v21-header"><h1>Votre espace, à votre rythme.</h1><p>Retrouvez vos priorités et avancez sereinement.</p></header>
      <div className="home-v21-stats" aria-label="Résumé des tâches">
        <div><strong>{todo}</strong><span>En attente</span></div>
        <div><strong>{progress}</strong><span>En cours</span></div>
        <div><strong>{completed}</strong><span>Terminées</span></div>
      </div>
      <div className="home-v21-bottom"><div className="home-v21-progress"><div className="home-v21-progress-heading"><strong>Progression</strong><span>{percent} %</span></div><div className="home-v21-track"><div style={{width: `${percent}%`}} /></div><p>{completed} sur {total} tâches terminées</p></div>
      <Link className="welcome-cta" to="/dashboard">Mes tâches <ArrowRight width={19} height={19}/></Link></div>
      {error && <p role="alert">Impossible de charger les tâches pour le moment.</p>}
    </section>
  </main>;
}
