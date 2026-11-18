import GlassSkeleton from "../components/GlassSkeleton";
import { ArrowRight } from "iconoir-react";
import { Link } from "react-router-dom";
import { useTasks } from "../hooks/useTasks";

export default function Home() {
  const { tasks, loading, error } = useTasks();
  if (loading)
    return (
      <main className="main-content home-main">
        <section className="welcome-panel">
          <GlassSkeleton compact />
        </section>
      </main>
    );
  const todo = tasks.filter((t) => t.status === "todo").length;
  const progress = tasks.filter((t) => t.status === "in_progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return (
    <main className="main-content home-main">
      <section className="welcome-panel home-welcome home-overview">
        <header className="home-overview-header">
          <h1>Votre espace, à votre rythme.</h1>
          <p>Retrouvez vos priorités et avancez sereinement.</p>
        </header>
        <div className="home-overview-stats" aria-label="Résumé des tâches">
          <div>
            <strong>{todo}</strong>
            <span>En attente</span>
          </div>
          <div>
            <strong>{progress}</strong>
            <span>En cours</span>
          </div>
          <div>
            <strong>{completed}</strong>
            <span>Terminées</span>
          </div>
        </div>
        <div className="home-overview-bottom">
          <div className="home-overview-progress">
            <div className="home-overview-progress-heading">
              <strong>Progression</strong>
              <span>{percent} %</span>
            </div>
            <div className="home-overview-track">
              <div style={{ width: `${percent}%` }} />
            </div>
            <p>
              {completed} sur {total} tâches terminées
            </p>
          </div>
          <Link className="welcome-cta" to="/dashboard">
            Mes tâches <ArrowRight width={19} height={19} />
          </Link>
        </div>
        {error && (
          <p role="alert">Impossible de charger les tâches pour le moment.</p>
        )}
      </section>
    </main>
  );
}
