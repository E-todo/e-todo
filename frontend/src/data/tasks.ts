import type { Task } from '../types/task'

export const tasks: Task[] = [
  {
    id: 1,
    title: 'Terminer le frontend MY_E-TODO',
    description: 'Finaliser le tableau de bord et les composants React.',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-11-05',
  },
  {
    id: 2,
    title: 'Préparer la présentation du projet',
    description: 'Organiser les idées et préparer la démonstration.',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-11-08',
  },
  {
    id: 3,
    title: 'Créer la structure du projet',
    description: 'Initialiser les dossiers et configurer Vite.',
    status: 'completed',
    priority: 'low',
    dueDate: '2026-10-28',
  },
  {
    id: 4,
    title: 'Connecter l’API backend',
    description: 'Relier les appels API au frontend.',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-11-06',
  },
]