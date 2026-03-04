const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifierToken = require('../middleware/auth');

router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicules ORDER BY marque, modele');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

router.get('/:id', verifierToken, async (req, res) => {
  try {
    const v = await pool.query('SELECT * FROM vehicules WHERE id = $1', [req.params.id]);
    const m = await pool.query(
      'SELECT * FROM maintenances WHERE vehicule_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.params.id]
    );
    const r = await pool.query(
      'SELECT * FROM reservations WHERE vehicule_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.params.id]
    );
    if (v.rows.length === 0)
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    res.json({ vehicule: v.rows[0], maintenances: m.rows, reservations: r.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

router.post('/', verifierToken, async (req, res) => {
  const { immatriculation, marque, modele, annee, categorie, kilometrage, prix_location_jour } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vehicules (immatriculation, marque, modele, annee, categorie, kilometrage, prix_location_jour)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [immatriculation, marque, modele, annee, categorie, kilometrage, prix_location_jour]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

router.put('/:id', verifierToken, async (req, res) => {
  const { marque, modele, annee, categorie, kilometrage, statut, prix_location_jour } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicules SET marque=$1, modele=$2, annee=$3, categorie=$4,
       kilometrage=$5, statut=$6, prix_location_jour=$7 WHERE id=$8 RETURNING *`,
      [marque, modele, annee, categorie, kilometrage, statut, prix_location_jour, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

module.exports = router;