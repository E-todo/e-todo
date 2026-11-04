
import { useEffect, useState } from "react";
import type { FormEvent, DragEvent } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";
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

type TaskItemProps = {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (id: number) => void;
    onDragStart: (event: DragEvent<HTMLElement>, id: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
};

function TaskItem({
    task,
    onEdit,
    onDelete,
    onDragStart,
    onDragEnd,
    isDragging,
}: TaskItemProps) {
    return (
        <article
            className={`task-item status-${task.status} ${
                isDragging ? "is-dragging" : ""
            }`}
            draggable
            onDragStart={(event) => onDragStart(event, task.id)}
            onDragEnd={onDragEnd}
        >
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

                {task.dueDate && (
                    <div className="task-details">
                        <span className="task-date">
                            Échéance : {formatDate(task.dueDate)}
                        </span>
                    </div>
                )}
            </div>

            <div className="task-actions">

                <button
                    type="button"
                    className="task-action-button"
                    onClick={() => onEdit(task)}
                    aria-label={`Modifier ${task.title}`}
                    title="Modifier"
                >
                    Modifier
                </button>

                <button
                    type="button"
                    className="task-action-button task-delete-button"
                    onClick={() => onDelete(task.id)}
                    aria-label={`Supprimer ${task.title}`}
                    title="Supprimer"
                >
                    Supprimer
                </button>
            </div>
        </article>
    );
}

export default function Dashboard() {
    const [taskList, setTaskList] = useState<Task[]>([]);
    const [message, setMessage] = useState("");
    useEffect(() => { getTasks().then(setTaskList).catch(error => setMessage(error.message)); }, []);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");

    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

    // DRAG AND DROP

    function handleDragStart(
        event: DragEvent<HTMLElement>,
        id: number,
    ) {
        setDraggedTaskId(id);

        event.dataTransfer.setData("text/plain", String(id));
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragEnd() {
        setDraggedTaskId(null);
    }

    function handleDrop(
        event: DragEvent<HTMLElement>,
        newStatus: TaskStatus,
    ) {
        event.preventDefault();

        const id = Number(event.dataTransfer.getData("text/plain"));

        if (!Number.isInteger(id) || id <= 0) {
            setDraggedTaskId(null);
            return;
        }

        handleStatusChange(id, newStatus);
        setDraggedTaskId(null);
    }

    // FORMULAIRE

    function resetForm() {
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
        setEditingTaskId(null);
        setIsFormOpen(false);
    }

    function openCreateForm() {
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
        setEditingTaskId(null);
        setIsFormOpen(true);
    }

    function openEditForm(task: Task) {
        setTitle(task.title);
        setDescription(task.description);
        setDueDate(task.dueDate ?? "");
        setPriority(task.priority);
        setEditingTaskId(task.id);
        setIsFormOpen(true);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const taskData = {
            title: title.trim(),
            description: description.trim(),
            dueDate: dueDate || undefined,
            priority,
        };

        if (!taskData.title) return;

        try {
            if (editingTaskId !== null) {
                const updated = await updateTask(editingTaskId, taskData);
                setTaskList(current => current.map(task => task.id === editingTaskId ? { ...task, ...updated, priority } : task));
            } else {
                const created = await createTask({ ...taskData, status: "todo" });
                setTaskList(current => [...current, created]);
            }
            setMessage("");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
            return;
        }

        resetForm();
    }

    // SUPPRESSION

    async function handleDelete(id: number) {
        const confirmed = window.confirm(
            "Voulez-vous vraiment supprimer cette tâche ?",
        );

        if (!confirmed) return;

        try { await deleteTask(id); setTaskList(currentTasks => currentTasks.filter(task => task.id !== id)); }
        catch (error) { setMessage(error instanceof Error ? error.message : "Suppression impossible."); }
    }

    // CHANGEMENT DE STATUT

    async function handleStatusChange(id: number, status: TaskStatus) {
        try { const updated = await updateTask(id, { status }); setTaskList(current => current.map(task => task.id === id ? { ...task, ...updated } : task)); }
        catch (error) { setMessage(error instanceof Error ? error.message : "Modification impossible."); }
    }

    // TRI DES TÂCHES PAR PRIORITÉ

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

                {message && <p className="auth-message">{message}</p>}
                <div className="task-groups">
                    {sections.map((section) => {
                        const sectionTasks = sortedTasks.filter(
                            (task) => task.status === section.status,
                        );

                        return (
                            <section
                                className={`task-group task-group-${section.status}`}
                                key={section.status}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = "move";
                                }}
                                onDrop={(event) =>
                                    handleDrop(event, section.status)
                                }
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
                                                onEdit={openEditForm}
                                                onDelete={handleDelete}
                                                onDragStart={handleDragStart}
                                                onDragEnd={handleDragEnd}
                                                isDragging={
                                                    draggedTaskId === task.id
                                                }
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
                        onClick={openCreateForm}
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
                            resetForm();
                        }
                    }}
                >
                    <form className="task-form" onSubmit={handleSubmit}>
                        <div className="task-form-header">
                            <h2>
                                {editingTaskId !== null
                                    ? "Modifier la tâche"
                                    : "Nouvelle tâche"}
                            </h2>

                            <button
                                type="button"
                                className="close-modal-button"
                                onClick={resetForm}
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

                        <label htmlFor="task-description">
                            Description
                        </label>
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
                            onChange={(event) =>
                                setDueDate(event.target.value)
                            }
                        />

                        <label htmlFor="task-priority">Priorité</label>
                        <select
                            id="task-priority"
                            value={priority}
                            onChange={(event) =>
                                setPriority(
                                    event.target.value as TaskPriority,
                                )
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
                                onClick={resetForm}
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="save-task-button"
                            >
                                {editingTaskId !== null
                                    ? "Enregistrer"
                                    : "Ajouter la tâche"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
