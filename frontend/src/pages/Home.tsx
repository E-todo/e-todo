import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTasks } from "../api/tasks";
import type { Task } from "../types/task";
export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    useEffect(() => {
        getTasks()
            .then(setTasks)
            .catch(() => setTasks([]));
    }, []);
    const todo = tasks.filter((task) => task.status === "todo").length;
    const progress = tasks.filter(
        (task) => task.status === "in_progress",
    ).length;
    const completed = tasks.filter(
        (task) => task.status === "completed",
    ).length;
    return (
        <main className="main-content">
            <section className="welcome-panel">
                <p className="dashboard-eyebrow">TON ESPACE PERSONNEL</p>
                <h1>Bonjour !</h1>
                <p className="welcome-copy">
                    Prends le temps d'organiser tes idées. Chaque petite étape
                    te rapproche de tes objectifs.
                </p>
                <Link className="welcome-cta" to="/dashboard">
                    Voir mes tâches <span aria-hidden="true">→</span>
                </Link>
                <div className="home-stats" aria-label="Résumé des tâches">
                    <article className="home-stat stat-todo">
                        <span>À faire</span>
                        <strong>{todo}</strong>
                        <small>tâches à commencer</small>
                    </article>
                    <article className="home-stat stat-progress">
                        <span>En cours</span>
                        <strong>{progress}</strong>
                        <small>tâches en progression</small>
                    </article>
                    <article className="home-stat stat-completed">
                        <span>Terminées</span>
                        <strong>{completed}</strong>
                        <small>tâches accomplies</small>
                    </article>
                </div>
            </section>
        </main>
    );
}
