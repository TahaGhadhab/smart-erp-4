const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const axios   = require('axios');
const verifierToken = require('../middleware/auth');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────
// POST /api/ml/maintenance/:vehiculeId
// ─────────────────────────────────────────────────────
router.post('/maintenance/:vehiculeId', verifierToken, async (req, res) => {
  try {
    console.log('Debut analyse ML pour vehicule:', req.params.vehiculeId);

    const vRes = await pool.query('SELECT * FROM vehicules WHERE id = $1', [req.params.vehiculeId]);
    if (vRes.rows.length === 0)
      return res.status(404).json({ message: 'Vehicule non trouve' });

    const v = vRes.rows[0];
    console.log('Vehicule trouve:', v.marque, v.modele);

    const nbMaint = await pool.query(
      'SELECT COUNT(*) FROM maintenances WHERE vehicule_id = $1',
      [v.id]
    );

    const nbResa = await pool.query(
      'SELECT COUNT(*) FROM reservations WHERE vehicule_id = $1',
      [v.id]
    );

    const payload = {
      vehicule_id:                  v.id,
      kilometrage:                  parseInt(v.kilometrage)          || 0,
      derniere_vidange_km:          parseInt(v.derniere_vidange_km)  || 0,
      annee:                        parseInt(v.annee)                || 2020,
      nb_maintenances:              parseInt(nbMaint.rows[0].count)  || 0,
      categorie:                    v.categorie                      || 'berline',
      nb_reservations_mois:         parseInt(nbResa.rows[0].count)   || 0,
      nb_reservations_mois_suivant: 5,
    };

    console.log('Payload envoye au ML:', JSON.stringify(payload));

    const mlRes = await axios.post(ML_URL + '/predict/maintenance', payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    const pred = mlRes.data;
    console.log('Reponse ML recue, score:', pred.score_risque);

    const meilleure_date = pred.fenetres_optimales && pred.fenetres_optimales[0]
      ? pred.fenetres_optimales[0].date
      : null;

    console.log('Meilleure date:', meilleure_date);

    // Nettoyer les emojis de la recommandation
    const type_intervention = (pred.recommandations && pred.recommandations[0])
      ? pred.recommandations[0].replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim()
      : 'Maintenance predictive ML';

    const description = 'Score risque: ' + Math.round(pred.score_risque * 100) + '% - ' + pred.niveau_risque;

    // Vérifier si une maintenance ML existe déjà pour ce véhicule
    const existante = await pool.query(
      "SELECT id FROM maintenances WHERE vehicule_id = $1 AND prediction_ml = true AND statut = 'planifiee' OR prediction_ml = true AND statut = 'planifiée' AND vehicule_id = $1",
      [v.id]
    );

    if (existante.rows.length > 0) {
      console.log('Mise a jour maintenance existante id:', existante.rows[0].id);
      await pool.query(
        `UPDATE maintenances SET
          date_planifiee    = $1,
          type_intervention = $2,
          description       = $3,
          urgence           = $4,
          km_au_moment      = $5
         WHERE id = $6`,
        [meilleure_date, type_intervention, description, pred.urgence, v.kilometrage, existante.rows[0].id]
      );
    } else {
      console.log('Creation nouvelle maintenance ML');
      await pool.query(
        `INSERT INTO maintenances
          (vehicule_id, type_intervention, description, date_planifiee, urgence, statut, km_au_moment, prediction_ml)
         VALUES ($1, $2, $3, $4, $5, 'planifiée', $6, true)`,
        [v.id, type_intervention, description, meilleure_date, pred.urgence, v.kilometrage]
      );
    }

    // Mettre à jour le score du véhicule
    await pool.query(
      'UPDATE vehicules SET score_risque_panne = $1 WHERE id = $2',
      [pred.score_risque, v.id]
    );

    // Sauvegarder dans historique ML
    await pool.query(
      'INSERT INTO predictions_ml (type_prediction, entity_id, score, details, modele_utilise) VALUES ($1, $2, $3, $4, $5)',
      ['maintenance', v.id, pred.score_risque, JSON.stringify(pred), 'RandomForest_v2']
    );

    console.log('Analyse ML terminee pour vehicule', v.id);
    res.json({ ...pred, maintenance_creee: true, date_planifiee: meilleure_date });

  } catch (err) {
    console.error('ERREUR ML:', err.message);
    if (err.response) {
      console.error('Reponse erreur ML service:', err.response.data);
    }
    res.status(500).json({ message: 'Erreur ML', erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/ml/scoring/:clientId
// ─────────────────────────────────────────────────────
router.post('/scoring/:clientId', verifierToken, async (req, res) => {
  try {
    console.log('Debut scoring ML pour client:', req.params.clientId);

    const cRes = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.clientId]);
    if (cRes.rows.length === 0)
      return res.status(404).json({ message: 'Client non trouve' });

    const c = cRes.rows[0];

    const payload = {
      client_id:       c.id,
      nb_reservations: parseInt(c.nb_reservations) || 0,
      nb_incidents:    parseInt(c.nb_incidents)    || 0,
      nb_retards:      parseInt(c.nb_retards)      || 0,
      valeur_client:   parseFloat(c.valeur_client)  || 0,
    };

    const mlRes = await axios.post(ML_URL + '/predict/scoring', payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    const pred = mlRes.data;

    await pool.query(
      'UPDATE clients SET score_client = $1, categorie_risque = $2 WHERE id = $3',
      [pred.score_risque, pred.categorie_risque, c.id]
    );

    await pool.query(
      'INSERT INTO predictions_ml (type_prediction, entity_id, score, details, modele_utilise) VALUES ($1, $2, $3, $4, $5)',
      ['scoring', c.id, pred.score_risque, JSON.stringify(pred), 'RandomForest_v2']
    );

    console.log('Scoring ML termine pour client', c.id);
    res.json(pred);

  } catch (err) {
    console.error('ERREUR ML scoring:', err.message);
    res.status(500).json({ message: 'Erreur ML', erreur: err.message });
  }
});

// ─────────────────────────────────────────────────────
// GET /api/ml/predictions
// ─────────────────────────────────────────────────────
router.get('/predictions', verifierToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM predictions_ml ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

module.exports = router;