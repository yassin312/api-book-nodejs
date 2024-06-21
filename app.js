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

//GET /auteurs
app.get('/auteurs', (req, res) => {
  db.all('SELECT * FROM auteurs', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.send(rows);
    }
  });
});
//GET /auteur/{id}
app.get('/auteur/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM auteurs WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Auteur not found');
    } else {
      res.send(row);
    }
  });
});

//POST /auteur
app.post('/auteur', (req, res) => {
  const { nom, prenom, annee_naissance, annee_mort } = req.body;
  db.run('INSERT INTO auteurs(nom, prenom, annee_naissance, annee_mort) VALUES (?, ?, ?, ?)', [nom, prenom, annee_naissance, annee_mort], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      const id_auteur = this.lastID;
      res.status(201).send({ id: id_auteur });
    }
  });
});

//PUT /auteur/{id}
app.put('/auteur/:id', (req, res) => {
  const { id } = req.params;
  const { nom, prenom, annee_naissance, annee_mort } = req.body;
  
  const query = `
    UPDATE auteurs
    SET nom = ?, prenom = ?, annee_naissance = ?, annee_mort = ?
    WHERE id = ?
  `;
  
  db.run(query, [nom, prenom, annee_naissance, annee_mort, id], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(`Auteur with id ${id} updated successfully`);
    }
  });
});
 

//DELETE /auteur{id}
app.delete('/auteur/:id', (req, res) => {
  const { id } = req.params;
  const query1 = `
  SELECT * 
  FROM livres liv 
  LEFT JOIN auteur_livre autliv 
  ON liv.id=autliv.id_livre  
  WHERE autliv.id_auteur =  ? `;

  const query2 = `
  DELETE FROM auteurs
    WHERE id = ? `
  db.run(query1, [id], function(err, row) {
    if(err) {
      console.error(err.message);
      res.status(500).send('Internal Servor error')
    }
    if(!row){
      db.run(query2, [id], function (err) {
        if (err) {
          console.error(err.message)
          res.status(500).send('Internal Server Error')
        } else {
          res.send(`Auteur with id ${id} deleted`)
        }
      })
    }
  })
   
})
//POST /emprunt

//PUT /Emprunt/{id}

//GET /recherche/{mots}


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});
