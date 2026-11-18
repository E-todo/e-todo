import { useCallback } from "react";
import { NavArrowLeft, NavArrowRight, Xmark } from "iconoir-react";
import { statusLabels, type Task } from "../types/task";
import { calendarDays, shiftMonth } from "../utils/dates";
import { useDialog } from "../hooks/useDialog";

type CalendarProps = {
  tasks: Task[];
  month: string;
  today: string;
  onMonthChange: (month: string) => void;
  onEdit: (id: number) => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
};

export default function TaskCalendar({
  tasks,
  month,
  today,
  onMonthChange,
  onEdit,
  selectedDate,
  onSelectDate,
}: CalendarProps) {
  const closeAgenda = useCallback(() => onSelectDate(null), [onSelectDate]);
  useDialog(selectedDate !== null, ".day-agenda", closeAgenda);

  const days = calendarDays(month);
  const selectedTasks = tasks.filter((task) => task.dueDate === selectedDate);

  return (
    <section className="task-calendar" aria-label="Calendrier des échéances">
      <div className="calendar-header">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          aria-label="Mois précédent"
        >
          <NavArrowLeft width={18} />
        </button>
        <h3 aria-live="polite">
          {new Intl.DateTimeFormat("fr-FR", {
            month: "long",
            year: "numeric",
          }).format(new Date(`${month}-15T12:00:00`))}
        </h3>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          aria-label="Mois suivant"
        >
          <NavArrowRight width={18} />
        </button>
        <button type="button" onClick={() => onMonthChange(today.slice(0, 7))}>
          Aujourd’hui
        </button>
      </div>
      <div
        className="calendar-grid"
        style={{
          gridTemplateRows: `24px repeat(${days.length / 7}, minmax(0, 1fr))`,
        }}
      >
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <strong key={day} className="calendar-weekday">
            {day}
          </strong>
        ))}
        {days.map((date, index) => {
          const dayTasks = tasks
            .filter((task) => task.dueDate === date)
            .sort((a, b) => b.id - a.id);
          return (
            <div
              key={date ?? index}
              className={`calendar-day ${date ? "" : "outside"} ${date === today ? "is-today" : ""}`}
            >
              {date && (
                <>
                  <button
                    className="calendar-day-select"
                    type="button"
                    onClick={() => onSelectDate(date)}
                    aria-label={`${date} : ${dayTasks.length} tâche(s)`}
                  >
                    <time
                      dateTime={date}
                      aria-current={date === today ? "date" : undefined}
                    >
                      {Number(date.slice(-2))}
                    </time>
                    {dayTasks.length > 0 && (
                      <span className="calendar-count">{dayTasks.length}</span>
                    )}
                  </button>
                  {dayTasks.slice(0, 1).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={`calendar-task status-${task.status}`}
                      onClick={() => onEdit(task.id)}
                      title={`${task.title} — ${statusLabels[task.status]}`}
                    >
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 1 && (
                    <button
                      className="calendar-more"
                      type="button"
                      onClick={() => onSelectDate(date)}
                    >
                      +{dayTasks.length - 1} autres
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      {selectedDate && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAgenda();
          }}
        >
          <section
            className="task-form day-agenda"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-title"
          >
            <div className="task-form-header">
              <h2 id="agenda-title">
                {new Intl.DateTimeFormat("fr-FR", {
                  day: "numeric",
                  month: "long",
                }).format(new Date(`${selectedDate}T12:00:00`))}
              </h2>
              <button
                type="button"
                className="close-modal-button"
                onClick={closeAgenda}
                aria-label="Fermer"
              >
                <Xmark width={22} />
              </button>
            </div>
            {selectedTasks.length ? (
              selectedTasks.map((task) => (
                <button
                  type="button"
                  key={task.id}
                  onClick={() => {
                    closeAgenda();
                    onEdit(task.id);
                  }}
                >
                  <span>{task.title}</span>
                  <small>{statusLabels[task.status]}</small>
                </button>
              ))
            ) : (
              <p>Aucune tâche prévue pour cette journée.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
