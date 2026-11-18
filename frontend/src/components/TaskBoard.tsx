import { useState, type DragEvent } from "react";
import TaskCard from "./TaskCard";
import type { Task, TaskStatus } from "../types/task";

const sections: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "À faire" },
  { status: "in_progress", title: "En cours" },
  { status: "completed", title: "Terminées" },
];

type TaskBoardProps = {
  tasks: Task[];
  totalTasks: number;
  today: string;
  mobileStatus: TaskStatus;
  onStatusSelect: (status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: TaskStatus) => Promise<void>;
};
export default function TaskBoard({
  tasks,
  totalTasks,
  today,
  mobileStatus,
  onStatusSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskBoardProps) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const taskGroups = sections.map((section) => ({
    ...section,
    tasks: tasks.filter((task) => task.status === section.status),
  }));
  function dragStart(event: DragEvent<HTMLElement>, id: number) {
    setDraggedId(id);
    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "move";
  }
  function dragEnd() {
    setDraggedId(null);
    setDropTarget(null);
  }
  function drop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isSafeInteger(id) && id > 0) void onStatusChange(id, status);
    dragEnd();
  }

  return (
    <>
      <div className="mobile-status-tabs" aria-label="Colonnes du tableau">
        {taskGroups.map((section) => (
          <button
            key={section.status}
            type="button"
            aria-pressed={mobileStatus === section.status}
            onClick={() => onStatusSelect(section.status)}
          >
            {section.title}
          </button>
        ))}
      </div>
      <div className="task-groups">
        {taskGroups.map((section) => {
          const sectionTasks = section.tasks;
          return (
            <section
              key={section.status}
              className={`task-group task-group-${section.status} ${mobileStatus === section.status ? "mobile-active" : ""} ${dropTarget === section.status ? "is-drop-target" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedId !== null) setDropTarget(section.status);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                )
                  setDropTarget(null);
              }}
              onDrop={(event) => drop(event, section.status)}
            >
              <div className="task-group-heading">
                <h3>{section.title}</h3>
              </div>
              {dropTarget === section.status && (
                <div className="drop-placeholder">
                  Déposer dans « {section.title} »
                </div>
              )}
              {sectionTasks.length ? (
                <div className="task-list">
                  {sectionTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      today={today}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      onDragStart={dragStart}
                      onDragEnd={dragEnd}
                      isDragging={draggedId === task.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="task-group-empty task-empty-state">
                  <strong>Aucune tâche ici</strong>
                  <p>
                    {totalTasks
                      ? "Aucune tâche ne correspond à ces filtres."
                      : "Ajoutez votre première tâche."}
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
