const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database('./livre.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connecté à la BDD.');
});

app.use(express.json());

// GET all livres
app.get('/livres', (req, res) => {
  db.all('SELECT * FROM livres', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.send(rows);
    }
  });
});

// GET single product by ID
app.get('/livres/:livres.id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT liv.*, aut.* FROM livres liv LEFT JOIN auteur_livre autliv ON autliv.id_livre = liv.id LEFT JOIN auteurs aut ON aut.id=autliv.id_auteur WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Book not found');
    } else {
      res.send(row);
    }
  });
});

//POST /livre

//PUT /livre/{id}

//GET /livre/{id}/quantite

//PUT /livre/{id}/quantite

//DELETE /livre/{id}

//GET /auteur

//GET /auteur/{id}

//POST /auteur

//PUT /auteur/{id}

//DELETE /auteur{id}

//POST /emprunt

//PUT /Emprunt/{id}

//GET /recherche/{mots}


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});
