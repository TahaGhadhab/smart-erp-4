const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifierToken = require('../middleware/auth');

router.get('/kpis', verifierToken, async (req, res) => {
  try {
    const [clients, vehicules, reservations, alertes, revenus] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM clients WHERE actif = true'),
      pool.query(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN statut='disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN statut='loué' THEN 1 ELSE 0 END) as loues,
        SUM(CASE WHEN statut='maintenance' THEN 1 ELSE 0 END) as en_maintenance,
        ROUND(AVG(score_risque_panne)::numeric, 2) as risque_moyen
        FROM vehicules`),
      pool.query(`SELECT COUNT(*) as total,
        SUM(CASE WHEN statut='en_cours' THEN 1 ELSE 0 END) as en_cours
        FROM reservations`),
      pool.query("SELECT COUNT(*) as non_lues FROM alertes WHERE lue = false"),
      pool.query(`SELECT COALESCE(SUM(prix_total),0) as total
        FROM reservations
        WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
        AND statut != 'annulée'`)
    ]);

    res.json({
      clients:      clients.rows[0],
      vehicules:    vehicules.rows[0],
      reservations: reservations.rows[0],
      alertes:      alertes.rows[0],
      revenus_mois: revenus.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

module.exports = router;