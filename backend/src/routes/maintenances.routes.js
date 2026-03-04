const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifierToken = require('../middleware/auth');

router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenances ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

router.post('/', verifierToken, async (req, res) => {
  const { vehicule_id, type_intervention, description, date_planifiee, cout, urgence, prestataire } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO maintenances (vehicule_id, type_intervention, description, date_planifiee, cout, urgence, prestataire)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [vehicule_id, type_intervention, description, date_planifiee, cout, urgence, prestataire]
    );
    await pool.query("UPDATE vehicules SET statut='maintenance' WHERE id=$1", [vehicule_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

router.put('/:id/terminer', verifierToken, async (req, res) => {
  try {
    const m = await pool.query(
      "UPDATE maintenances SET statut='terminée', date_realisation=NOW() WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    await pool.query("UPDATE vehicules SET statut='disponible' WHERE id=$1", [m.rows[0].vehicule_id]);
    res.json(m.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

module.exports = router;