import { Calendar, CheckCircle, TaskList, PriorityHigh, PriorityMedium, PriorityDown, WarningTriangle } from "iconoir-react";
import { statusLabels, type Task } from "../types/task";


export default function TaskInfo({ task, today }: { task: Task; today: string }) {
  const PriorityIcon = task.priority === "high" ? PriorityHigh : task.priority === "low" ? PriorityDown : PriorityMedium;
  const StatusIcon = task.status === "completed" ? CheckCircle : TaskList;
  const overdue = !!task.dueDate && task.dueDate < today && task.status !== "completed";
  const date = task.dueDate ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${task.dueDate}T12:00:00`)) : "Non définie";
  return <dl className="task-info">
    <div className={`info-status status-${task.status}`}><dt><StatusIcon width={16} aria-hidden="true" />Statut</dt><dd>{statusLabels[task.status]}</dd></div>
    <div><dt><PriorityIcon width={16} aria-hidden="true" />Priorité</dt><dd>{{ high: "Élevée", medium: "Moyenne", low: "Faible" }[task.priority]}</dd></div>
    <div className={overdue ? "info-overdue" : ""}><dt><Calendar width={16} aria-hidden="true" />Échéance</dt><dd>{date}{overdue && <span className="overdue-label"><WarningTriangle width={14} aria-hidden="true" />En retard</span>}</dd></div>
  </dl>;
}
