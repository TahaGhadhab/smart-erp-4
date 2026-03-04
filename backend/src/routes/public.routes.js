const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');

// GET /api/public/vehicules
// Retourne tous les vehicules DISPONIBLES avec leurs infos
router.get('/vehicules', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, immatriculation, marque, modele, annee,
             categorie, kilometrage, statut,
             prix_location_jour, image_url, score_risque_panne
      FROM vehicules
      WHERE statut = 'disponible'
      ORDER BY marque, modele
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

// GET /api/public/vehicules/:id/disponibilite
// Verifie si un vehicule est disponible entre deux dates
router.get('/vehicules/:id/disponibilite', async (req, res) => {
  const { date_debut, date_fin } = req.query;
  try {
    const conflit = await pool.query(`
      SELECT id FROM reservations
      WHERE vehicule_id = $1
        AND statut NOT IN ('annulee', 'terminee')
        AND NOT ($3::date < date_debut OR $2::date > date_fin)
    `, [req.params.id, date_debut, date_fin]);
    res.json({ disponible: conflit.rows.length === 0 });
  } catch (err) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// POST /api/public/reservations
// Cree une reservation depuis la page client
router.post('/reservations', async (req, res) => {
  const { vehicule_id, date_debut, date_fin,
          client_nom, client_prenom, client_email,
          client_telephone, client_permis } = req.body;
  try {
    // 1. Creer ou trouver le client
    let client = await pool.query(
      'SELECT id FROM clients WHERE email = $1', [client_email]
    );
    let client_id;
    if (client.rows.length === 0) {
      const nvClient = await pool.query(`
        INSERT INTO clients (nom, prenom, email, telephone, numero_permis)
        VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [client_nom, client_prenom, client_email,
         client_telephone, client_permis]
      );
      client_id = nvClient.rows[0].id;
    } else {
      client_id = client.rows[0].id;
    }

    // 2. Calculer le prix total
    const vehicule = await pool.query(
      'SELECT prix_location_jour FROM vehicules WHERE id = $1', [vehicule_id]
    );
    const jours = Math.ceil(
      (new Date(date_fin) - new Date(date_debut)) / (1000*60*60*24)
    );
    const prix_total = jours * vehicule.rows[0].prix_location_jour;

    // 3. Creer la reservation
    const resa = await pool.query(`
      INSERT INTO reservations
        (client_id, vehicule_id, date_debut, date_fin, prix_total,
         statut, caution, created_at)
      VALUES ($1, $2, $3, $4, $5, 'confirmee', 500, NOW())
      RETURNING id, prix_total`,
      [client_id, vehicule_id, date_debut, date_fin, prix_total]
    );

    // 4. Mettre le vehicule en statut 'loue'
    await pool.query(
      "UPDATE vehicules SET statut='loue' WHERE id=$1", [vehicule_id]
    );

    res.status(201).json({
      success: true,
      reservation_id: resa.rows[0].id,
      prix_total: resa.rows[0].prix_total,
      message: 'Reservation confirmee avec succes !'
    });
  } catch (err) {
    console.error('Erreur reservation publique:', err.message);
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

module.exports = router;
