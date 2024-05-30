CREATE TABLE `livres` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `annee_publication` int NOT NULL,
  `quantite` int NOT NULL DEFAULT 1
);

CREATE TABLE `auteurs` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `annee_naissance` int NOT NULL,
  `annee_mort` int
);

CREATE TABLE `auteur_livre` (
  `id_auteur` int,
  `id_livre` int,
  PRIMARY KEY (`id_auteur`, `id_livre`)
);

CREATE TABLE `personnes` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE `emprunt` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `id_livre` int NOT NULL,
  `id_personne` int NOT NULL,
  `date_emprunt` date NOT NULL,
  `date_retour` date
);

ALTER TABLE `auteur_livre` ADD FOREIGN KEY (`id_livre`) REFERENCES `livres` (`id`);

ALTER TABLE `auteur_livre` ADD FOREIGN KEY (`id_auteur`) REFERENCES `auteurs` (`id`);

ALTER TABLE `emprunt` ADD FOREIGN KEY (`id_personne`) REFERENCES `personnes` (`id`);

ALTER TABLE `emprunt` ADD FOREIGN KEY (`id_livre`) REFERENCES `livres` (`id`);
