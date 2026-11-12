import { useState } from "react";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { statusLabels } from "../types/task";
import { CheckCircle, WarningTriangle } from "iconoir-react";
import type { Task } from "../types/task";
import { calendarDays, shiftMonth } from "../utils/dates";

export default function TaskCalendar({ tasks, month, today, onMonthChange, onDetails }: {
  tasks: Task[]; month: string; today: string;
  onMonthChange: (month: string) => void; onDetails: (id: number) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(today);
  const byDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.dueDate) byDate.set(task.dueDate, [...(byDate.get(task.dueDate) ?? []), task]);
  }
  return <section className="v23-calendar" aria-label="Calendrier des échéances">
    <div className="v23-calendar-head">
      <button type="button" onClick={() => { const next = shiftMonth(month, -1); onMonthChange(next); setSelectedDate(next + "-01"); }} aria-label="Mois précédent"><NavArrowLeft width={18} /></button>
      <h3 aria-live="polite">{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${month}-15T12:00:00`))}</h3>
      <button type="button" onClick={() => { const next = shiftMonth(month, 1); onMonthChange(next); setSelectedDate(next + "-01"); }} aria-label="Mois suivant"><NavArrowRight width={18} /></button>
      <button type="button" onClick={() => {onMonthChange(today.slice(0, 7));setSelectedDate(today);}}>Aujourd’hui</button>
    </div>
    <div className="calendar-scroll" tabIndex={0} aria-label="Calendrier, défilement horizontal sur petit écran">
      <div className="v23-calendar-grid">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => <strong key={day} className="v23-weekday">{day}</strong>)}
        {calendarDays(month).map((date, index) => <div key={date ?? `empty-${index}`} className={`v23-calendar-day ${date ? "" : "outside"} ${date === today ? "is-today" : ""} ${date === selectedDate ? "is-selected" : ""}`}>
          {date && <><button className="calendar-day-select" type="button" aria-pressed={date === selectedDate} aria-label={`Afficher les tâches du ${date}`} onClick={() => setSelectedDate(date)}><time dateTime={date} aria-current={date === today ? "date" : undefined}>{Number(date.slice(-2))}</time></button>
            <div className="calendar-events">{(byDate.get(date) ?? []).map(task => <button key={task.id} type="button" className={`v23-event status-${task.status}`} onClick={() => onDetails(task.id)} title={task.title} aria-label={`Ouvrir ${task.title}, le ${date}`}><strong>{task.title}</strong><span className="calendar-event-status">{task.status === "completed" ? <CheckCircle width={13} aria-hidden="true" /> : task.dueDate && task.dueDate < today ? <WarningTriangle width={13} aria-hidden="true" /> : null}{statusLabels[task.status]}{task.dueDate && task.dueDate < today && task.status !== "completed" ? " · En retard" : ""}</span></button>)}</div>
          </>}
        </div>)}
      </div>
    </div>
    <section className="day-agenda" aria-label="Tâches du jour sélectionné"><h3>{new Intl.DateTimeFormat("fr-FR", {weekday:"long", day:"numeric", month:"long"}).format(new Date(`${selectedDate}T12:00:00`))}</h3>{(byDate.get(selectedDate) ?? []).length ? (byDate.get(selectedDate) ?? []).map(task => <button type="button" key={task.id} onClick={() => onDetails(task.id)}><span>{task.title}</span><small>{statusLabels[task.status]}</small></button>) : <p>Aucune tâche prévue pour cette journée.</p>}</section>
    <p className="v2-results">{tasks.filter(task => !task.dueDate).length} tâche(s) sans échéance, disponibles dans le Kanban.</p>
  </section>;
}
