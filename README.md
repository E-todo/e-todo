# E-todo

Application de gestion de tâches avec React, TypeScript, Express et MySQL (ou MariaDB).

## Fonctionnalités

- Inscription, connexion et gestion du profil.
- Création, modification, déplacement et suppression des tâches (trois statuts).
- Échéance facultative, vue Kanban, calendrier, recherche et filtre « En retard ».
- Thèmes, mode clair ou sombre et fonds personnalisables.

## Démarrage

**Prérequis :** Node.js, npm et un serveur MySQL ou MariaDB en fonctionnement.

1. Importer [my_e-todo.sql](my_e-todo.sql) dans MySQL avec votre client SQL (par exemple phpMyAdmin). Le script crée la base `my_e-todo` et ses tables.
2. Dans un premier terminal, préparer l’API :

   ```powershell
   cd backend
   npm install
   Si le fichier .env n'existe pas, alors crée-le en copiant .env.example : Copy-Item .env.example .env
   ```

   Renseigner `backend/.env` : connexion MySQL (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`) et clé secrète `JWT_SECRET`. L’API écoute sur le port `3000` par défaut ; `PORT` permet de le changer. Puis lancer `npm run dev`.

3. Dans un second terminal, lancer l’interface :

   ```powershell
   cd frontend
   npm install
   Si le fichier .env n'existe pas, alors crée-le en copiant .env.example : Copy-Item .env.example .env
   npm run dev
   ```

   Ouvrir l’adresse indiquée par Vite. `VITE_API_URL` dans `frontend/.env` doit pointer vers l’API (`http://localhost:3000` par défaut).

Sous Linux ou macOS, utiliser `cp -n .env.example .env` à la place de la commande PowerShell. Les fichiers `.env` existants sont conservés et ne sont pas suivis par Git.

## Vérifications

Dans `backend/` : `npm run build`, puis `node --test --test-isolation=none tests/todos.test.cjs`.

Dans `frontend/` : `npm run typecheck`, `npm run lint`, `npm run build`, puis `node --experimental-strip-types --test tests/tasks.test.mjs`.

Pour vérifier la connexion MySQL quand l’API tourne : `http://localhost:3000/health/db`.
