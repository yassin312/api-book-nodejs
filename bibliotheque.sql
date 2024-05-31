CREATE TABLE IF NOT EXISTS "livres" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "titre" TEXT NOT NULL,
  "annee_publication" INTEGER NOT NULL,
  "quantite" INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "auteurs" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "nom" TEXT NOT NULL,
  "prenom" TEXT NOT NULL,
  "annee_naissance" INTEGER NOT NULL,
  "annee_mort" INTEGER
);

CREATE TABLE IF NOT EXISTS "auteur_livre" (
  "id_auteur" INTEGER,
  "id_livre" INTEGER,
  PRIMARY KEY ("id_auteur", "id_livre"),
  FOREIGN KEY ("id_auteur") REFERENCES "auteurs" ("id"),
  FOREIGN KEY ("id_livre") REFERENCES "livres" ("id")
);

CREATE TABLE IF NOT EXISTS "personnes" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "nom" TEXT NOT NULL,
  "prenom" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS "emprunt" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "id_livre" INTEGER NOT NULL,
  "id_personne" INTEGER NOT NULL,
  "date_emprunt" TEXT NOT NULL,
  "date_retour" TEXT,
  FOREIGN KEY ("id_livre") REFERENCES "livres" ("id"),
  FOREIGN KEY ("id_personne") REFERENCES "personnes" ("id")
);
