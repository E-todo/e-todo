import { useState } from "react";
import { tasks as initialTasks } from "../data/tasks";
import type { Task, TaskStatus, TaskPriority } from "../types/task";

const sections: { status: TaskStatus; title: string }[] = [
    { status: "todo", title: "À faire" },
    { status: "in_progress", title: "En cours" },
    { status: "completed", title: "Terminées" },
];

const priorityOrder: Record<TaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
};

const priorityLabels: Record<TaskPriority, string> = {
    high: "Élevée",
    medium: "Moyenne",
    low: "Faible",
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
    }).format(new Date(`${date}T12:00:00`));
}

function TaskItem({ task }: { task: Task }) {
    return (
        <article className={`task-item status-${task.status}`}>
            <div className="task-main">
                <div className="task-title-row">
                    <span
                        className={`priority-dot priority-dot-${task.priority}`}
                        title={`Priorité ${priorityLabels[task.priority].toLowerCase()}`}
                        aria-label={`Priorité ${priorityLabels[task.priority].toLowerCase()}`}
                    />
                    <h3>{task.title}</h3>
                </div>
                {task.description && <p>{task.description}</p>}
            </div>

            {task.dueDate && (
                <div className="task-details">
                    <span className="task-date">
                        {formatDate(task.dueDate)}
                    </span>
                </div>
            )}
        </article>
    );
}

export default function Dashboard() {
    const [taskList, setTaskList] = useState<Task[]>(initialTasks);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const newTask: Task = {
            id: Date.now(),
            title: title.trim(),
            description: description.trim(),
            status: "todo",
            priority,
            dueDate: dueDate || undefined,
        };

        setTaskList((currentTasks) => [...currentTasks, newTask]);

        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
        setIsFormOpen(false);
    }

    const sortedTasks = [...taskList].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    return (
        <main className="main-content">
            <section className="tasks-panel">
                <header className="dashboard-header">
                    <div>
                        <p className="dashboard-eyebrow">
                            MON ESPACE PERSONNEL
                        </p>
                        <h2>Mes tâches</h2>
                    </div>

                    <span className="tasks-total">
                        {taskList.length} tâches
                    </span>
                </header>

                <div className="task-groups">
                    {sections.map((section) => {
                        const sectionTasks = sortedTasks.filter(
                            (task) => task.status === section.status,
                        );

                        return (
                            <section
                                className={`task-group task-group-${section.status}`}
                                key={section.status}
                            >
                                <div className="task-group-heading">
                                    <h3>{section.title}</h3>
                                    <span>{sectionTasks.length}</span>
                                </div>

                                {sectionTasks.length > 0 ? (
                                    <div className="task-list">
                                        {sectionTasks.map((task) => (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="task-group-empty">
                                        Aucune tâche pour le moment.
                                    </p>
                                )}
                            </section>
                        );
                    })}
                </div>

                <div className="add-task-container">
                    <button
                        type="button"
                        className="add-task-button"
                        aria-label="Ajouter une tâche"
                        title="Ajouter une tâche"
                        onClick={() => setIsFormOpen(true)}
                    >
                        +
                    </button>
                </div>
            </section>

            {isFormOpen && (
                <div
                    className="modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsFormOpen(false);
                        }
                    }}
                >
                    <form className="task-form" onSubmit={handleSubmit}>
                        <div className="task-form-header">
                            <h2>Nouvelle tâche</h2>
                            <button
                                type="button"
                                className="close-modal-button"
                                onClick={() => setIsFormOpen(false)}
                                aria-label="Fermer"
                            >
                                ×
                            </button>
                        </div>

                        <label htmlFor="task-title">Titre</label>
                        <input
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Nom de la tâche"
                            required
                            maxLength={120}
                        />

                        <label htmlFor="task-description">Description</label>
                        <textarea
                            id="task-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Décris ta tâche..."
                            rows={3}
                        />

                        <label htmlFor="task-date">
                            Date d'échéance (facultative)
                        </label>
                        <input
                            id="task-date"
                            type="date"
                            value={dueDate}
                            onChange={(event) => setDueDate(event.target.value)}
                        />

                        <label htmlFor="task-priority">Priorité</label>
                        <select
                            id="task-priority"
                            value={priority}
                            onChange={(event) =>
                                setPriority(event.target.value as TaskPriority)
                            }
                        >
                            <option value="high">Élevée</option>
                            <option value="medium">Moyenne</option>
                            <option value="low">Faible</option>
                        </select>

                        <div className="task-form-actions">
                            <button
                                type="button"
                                className="cancel-task-button"
                                onClick={() => setIsFormOpen(false)}
                            >
                                Annuler
                            </button>
                            <button type="submit" className="save-task-button">
                                Ajouter la tâche
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
