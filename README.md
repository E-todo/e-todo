# MY E-TODO

Application de gestion de tâches réalisée avec React, TypeScript, Express et MySQL. Chaque utilisateur peut créer un compte, gérer ses tâches et suivre leur avancement.

## Installation

Il faut Node.js, npm et un serveur MySQL ou MariaDB. Avec XAMPP, seul le service MySQL est nécessaire.

Démarrer la base de données, puis importer `my_e-todo.sql` depuis un client SQL. Le script crée la base `my_e-todo` et les tables `user` et `todo`.

## Backend

Depuis la racine du projet, dans un premier terminal PowerShell :

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Dans `backend/.env`, renseigner l'adresse et le port du serveur (`MYSQL_HOST`, `MYSQL_PORT`), les identifiants (`MYSQL_USER`, `MYSQL_PASSWORD`) et le nom de la base (`MYSQL_DATABASE`). Choisir une longue clé aléatoire pour `JWT_SECRET`. `PORT` définit le port de l'API, par défaut `3000`.

```powershell
npm run dev
```

L'API est accessible sur `http://localhost:3000`. Pour vérifier la connexion à la base, ouvrir `http://localhost:3000/health/db`.

## Frontend

Dans un deuxième terminal, depuis la racine du projet :

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

La variable `VITE_API_URL` dans `frontend/.env` doit correspondre à l'adresse du backend, par défaut `http://localhost:3000`. Ouvrir ensuite l'adresse affichée par Vite.

Les fichiers `.env` restent locaux et ne sont pas suivis par Git. Les copier depuis les `.env.example` à la première installation seulement ; s'ils existent déjà, conserver leur configuration.

## Sous Linux

Installer Node.js et npm, puis un serveur MySQL ou MariaDB. Sur Ubuntu ou Debian, depuis la racine du projet :

```bash
sudo apt install mariadb-server
sudo systemctl start mariadb
sudo mariadb < my_e-todo.sql
```

Cr?er un utilisateur pour l?application avec `sudo mariadb` :

```sql
CREATE USER 'etodo'@'localhost' IDENTIFIED BY 'choisir_un_mot_de_passe';
GRANT ALL PRIVILEGES ON `my_e-todo`.* TO 'etodo'@'localhost';
EXIT;
```

Reprendre ensuite les ?tapes Backend et Frontend ci-dessus. Dans chaque dossier, remplacer `Copy-Item .env.example .env` par `cp -n .env.example .env`, qui conserve un ?ventuel fichier existant. Renseigner `MYSQL_USER=etodo` et le mot de passe choisi dans `backend/.env`.

Lancer `npm run dev` dans chacun des deux terminaux, puis ouvrir l?adresse affich?e par Vite.

## Utilisation

Créer un compte, puis se connecter pour ajouter, modifier ou supprimer des tâches. Le titre et la date d’échéance sont obligatoires. Les tâches et leur statut sont enregistrés dans la base. Les filtres, le calendrier et les thèmes permettent de personnaliser l'affichage.

Si la connexion ou le chargement des tâches échoue, vérifier que le backend et le serveur MySQL sont démarrés, puis contrôler les paramètres des deux `.env`.

## Vérifications

Dans `backend/`, `npm run build` compile le serveur et `npm start` lance la version compilée.

Dans `frontend/`, `npm run build` génère l'application, `npm run lint` vérifie le code et `npm run typecheck` vérifie les types TypeScript.
