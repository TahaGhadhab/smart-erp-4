const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifierToken = require('../middleware/auth');

router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

router.post('/', verifierToken, async (req, res) => {
  const { client_id, vehicule_id, date_debut, date_fin, prix_total, caution, km_depart } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO reservations (client_id, vehicule_id, date_debut, date_fin, prix_total, caution, km_depart)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [client_id, vehicule_id, date_debut, date_fin, prix_total, caution, km_depart]
    );
    await pool.query("UPDATE vehicules SET statut='loué' WHERE id=$1", [vehicule_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

module.exports = router;