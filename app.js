const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 8000;

const db = new sqlite3.Database('./livre.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connecté à la BDD.');
});



const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).send('API Key manquante');
  }
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('API Key invalide');
  }
  next();
};

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
app.post('/livre', apiKeyMiddleware, (req, res) => {
  const { titre, annee_publication, quantite, auteur } = req.body;

  // Log des données reçues
  console.log('Données reçues:', req.body);

  if (!titre || !annee_publication || !auteur) {
    return res.status(400).send('Données manquantes');
  }

  const quantiteInsert = quantite !== undefined ? quantite : 1;

  db.get('SELECT id FROM auteurs WHERE id = ?', [auteur], (err, row) => {
    if (err) {
      console.error('Erreur lors de la sélection de l\'auteur:', err.message);
      return res.status(500).send('Internal server error');
    } 

    if (!row) {
      return res.status(404).send('Auteur inexistant');
    }

    db.run('INSERT INTO livres(titre, annee_publication, quantite) VALUES (?, ?, ?)', [titre, annee_publication, quantiteInsert], function(err) {
      if (err) {
        console.error('Erreur lors de l\'insertion du livre:', err.message);
        return res.status(500).send('Internal server error');
      }

      const id_livre = this.lastID;

      db.run('INSERT INTO auteur_livre(id_livre, id_auteur) VALUES (?, ?)', [id_livre, auteur], function(err) {
        if (err) {
          console.error('Erreur lors de l\'insertion dans auteur_livre:', err.message);
          return res.status(500).send('Internal server error');
        }

        res.status(201).send({ id: id_livre, titre, annee_publication, quantite: quantiteInsert, auteur });
      });
    });
  });
});

//PUT /livre/{id}
app.put('/livre/id_livre', (req, res) => {
  const { titre, annee_publication, auteur } = req.body;

  db.get('SELECT id FROM auteurs WHERE id = ?', [auteur], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Auteur inexistant');
    } else {
      // L'auteur existe, insérer le livre
      db.run('UPDATE livres(titre, annee_publication) VALUES (?, ?) WHERE livres.id = ?', [titre, annee_publication], function(err) {
        if (err) {
          console.error(err.message);
          res.status(500).send('Internal server error');
        } else {
          const id_livre = this.lastID;
          
          db.run('UPDATE auteur_livre(id_livre, id_auteur) VALUES (?, ?) WHERE livres.id = ?', [id_livre, auteur], function(err) {
            if (err) {
              console.error(err.message);
              res.status(500).send('Internal server error');
            } else {
              res.status(201).send({ id: id_livre, titre, annee_publication: id_livre, auteur: auteur });
            }
          });
        }
      });
    }
  });
});

//GET /livre/{id}/quantite
app.get('/livres/:id/quantite', (req, res) => {
  const { id } = req.params;
  db.get('SELECT liv.titre, quantite - COUNT(emp.id_livre) AS nb_livre FROM livres liv LEFT JOIN emprunt emp ON emp.id_livre = liv.id WHERE liv.id = ? GROUP BY liv.titre', [id], (err, row) => {
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

//PUT /livre/{id}/quantite
app.put('/livres/:id/quantite', (req, res) => {
  const { id } = req.params;
  const { newQty } = req.body;

  db.get('SELECT COUNT(id) AS nbEmprunt FROM emprunt WHERE id_livre = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Erreur interne du serveur');
    } else if (!row) {
      return res.status(404).send('Livre non trouvé');
    } else {
      const nbEmprunt = row.nbEmprunt;
      if (newQty < nbEmprunt) {
        return res.status(400).send('Nouvelle quantité inférieure au nombre d\'emprunts en cours');
      } else {
        db.run('UPDATE livres SET quantite = ? WHERE id = ?', [newQty, id], function(err) {
          if (err) {
            console.error(err.message);
            return res.status(500).send('Erreur interne du serveur');
          }
          return res.status(200).send({ message: 'Quantité mise à jour avec succès' });
        });
      }
    }
  });
});

//DELETE /livre/{id}
app.delete('/livre/:id', (req,res) => {
  const { id } = req.params

  db.get('SELECT id_livre FROM emprunt WHERE id_livre = ?', [id], (err, row) => {
    
    if (err){
      console.error(err.message);
      res.status(500).send('Internal server error');
    }
    else if (row){
        res.send('Le livre est en cours d emprunt') 
    }
    else {
      db.run('DELETE FROM livres WHERE id = ?', [id], (err,row) => {
        if (err) {
          console.error(err.message);
          res.status(500).send('Internal server error');

        } else if(!row){
          res.status(404).send('Book not found');
        } 
        else {
          res.send('Livre supprimé avec succès');
        }
      });   
    }
  });
});

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
app.post('/emprunt', (req, res) => {
  const { id_livre,id_auteur } = req.body;
  const today = new Date();

  // Obtenir les composants de la date
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0
  const year = today.getFullYear();
    
  const datedujour = `${day}/${month}/${year}`;
  const strReq = `INSERT INTO emprunt(id_livre, id_personne, date_emprunt) VALUES( ?, ?, ?)`;

  db.get('SELECT quantite FROM livres WHERE id =  ? AND quantite > 0',[id_livre], (err) => {
    if (err){
      console.error("Le livre n'est pas empruntable", err.message)
      res.status(500).send('Internal Server Error') 
    } else {
      db.run(strReq, [id_livre, id_auteur, datedujour], function(err){
        if(err){
          console.error(err.message)
          res.status(500).send('Internal Server Error')
        } else {
          const id_emprunt = this.lastID;
          res.status(201).send({ id: id_emprunt });        }
      })
    }
  })
})

//PUT /Emprunt/{id}
app.put('/emprunt/:id', (req, res) =>{
  const { id }=req.params
  const { dateRetour }=req.body

  db.get('SELECT id FROM emprunt WHERE id = ?', [id], (err, row) =>{
    if(err){
      res.status(500).send('Internal server error');
    } 
    else if(!row){
      res.status(404).send('Emprunt non trouvé');
    } 
    else{
      db.run('UPDATE emprunt SET date_retour= ? WHERE id= ?',[dateRetour, id], (err) =>{
        if(err){
          res.status(500).send('Internal server error');
        }
        else if(!row){
          res.status(404).send('Emprunt non trouvé');
        }
        else {
          res.send('Emprunt modifié');
        }
      });
    }
  });
});

//GET /recherche/{mots}

app.get('/recherche/:recherche', (req, res) => {
  const { recherche } = req.params;
  const keywords = recherche.split(' ');
  
  let sqlQuery = 'SELECT nom, prenom, titre FROM auteurs aut LEFT JOIN auteur_livre autliv ON autliv.id_auteur = aut.id LEFT JOIN livres liv ON autliv.id_livre=liv.id WHERE';
  const sqlConditions = [];
  const sqlParams = [];
  
  keywords.forEach(keyword => {
    const condition = '(nom LIKE ? OR prenom LIKE ? OR titre LIKE ?)';
    sqlConditions.push(condition);
    sqlParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  });

  sqlQuery += sqlConditions.join(' AND ');

  db.all(sqlQuery, sqlParams, (err, rows) => {
    if (err) {
      res.status(500).send('Internal server error');
    } else if (!rows || rows.length === 0) {
      res.status(404).send('Auteur ou livre introuvable');
    } else {
      res.send(rows);
    }
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});
