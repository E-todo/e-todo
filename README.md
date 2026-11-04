# MY E-TODO

Application de gestion de tâches avec React, TypeScript, Express et MySQL.

## 1. Préparer la base de données

Exécuter `my_e-todo.sql` dans MySQL Workbench ou depuis un terminal MySQL. Le script crée la base `my_e-todo` et les tables `user` et `todo`.

## 2. Configurer et démarrer le backend

Dans un premier terminal :

```bash
cd backend
npm install
cp .env.example .env
```

Renseigner les identifiants MySQL dans `backend/.env` et remplacer `JWT_SECRET` par une longue clé aléatoire. Puis lancer :

```bash
npm run dev
```

L'API démarre sur `http://localhost:3000`.

## 3. Configurer et démarrer le frontend

Dans un deuxième terminal, depuis la racine du projet :

```bash
cd my_e-todo/frontend
npm install
npm install --save-dev prettier
cp .env.example .env
npm run dev
```

Ouvrir l'adresse affichée par Vite (généralement `http://localhost:5173`).

## 4. Qualité du code

Depuis `my_e-todo/frontend` :

```bash
npm run build
npm run lint
npm run format
```

La configuration Prettier est dans `.prettierrc.json`. Elle applique une largeur de ligne de 80 caractères, deux espaces d'indentation, les points-virgules désactivés et les apostrophes simples.

## Fonctionnement

- Inscription et connexion avec mot de passe haché côté serveur.
- Les routes privées nécessitent un token JWT.
- Les tâches sont enregistrées dans MySQL et liées au compte connecté.
- Le changement de statut d'une tâche est enregistré en base de données.
- Les quatre thèmes visuels restent disponibles.

La priorité est actuellement une information d'affichage locale : la base de données fournie ne contient pas de colonne pour la sauvegarder.
