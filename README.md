# MY E-TODO

Application de gestion de tâches avec React, TypeScript, Express et MySQL.

## 1. Préparer la base de données

Dans MySQL Workbench ou dans un terminal MySQL, exécuter le fichier `my_e-todo.sql`.
Il crée la base `my_e-todo` et les tables `user` et `todo`.

## 2. Configurer le backend

```bash
cd backend
cp .env.example .env
```

Modifier les valeurs MySQL dans `backend/.env` et remplacer `JWT_SECRET` par une longue clé privée.
Puis installer et lancer :

```bash
npm install
npm run dev
```

L'API démarre sur `http://localhost:3000`.

## 3. Configurer le frontend

Dans un deuxième terminal :

```bash
cd my_e-todo/frontend
cp .env.example .env
npm install
npm run dev
```

Ouvrir l'adresse affichée par Vite (généralement `http://localhost:5173`).

## Fonctionnement

- Inscription et connexion avec un mot de passe chiffré côté serveur.
- Les pages privées nécessitent un token JWT.
- Les tâches sont enregistrées dans MySQL et liées au compte connecté.
- Le déplacement d'une tâche entre les colonnes enregistre son nouveau statut.
- Les quatre thèmes visuels restent disponibles.

La priorité est actuellement une information d'affichage locale : la base de données fournie ne contient pas de colonne pour la sauvegarder.
