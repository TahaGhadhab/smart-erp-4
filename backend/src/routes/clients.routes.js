const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const verifierToken = require('../middleware/auth');

// GET — Liste tous les clients
router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients ORDER BY date_inscription DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

// GET — Un client par ID
router.get('/:id', verifierToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Client non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

// POST — Créer un client
router.post('/', verifierToken, async (req, res) => {
  const { nom, prenom, email, telephone, date_naissance, numero_permis, adresse } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO clients (nom, prenom, email, telephone, date_naissance, numero_permis, adresse)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nom, prenom, email, telephone, date_naissance, numero_permis, adresse]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

// PUT — Modifier un client
router.put('/:id', verifierToken, async (req, res) => {
  const { nom, prenom, email, telephone, adresse, actif } = req.body;
  try {
    const result = await pool.query(
      `UPDATE clients SET nom=$1, prenom=$2, email=$3, telephone=$4, adresse=$5, actif=$6
       WHERE id=$7 RETURNING *`,
      [nom, prenom, email, telephone, adresse, actif, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

// DELETE — Désactiver un client
router.delete('/:id', verifierToken, async (req, res) => {
  try {
    await pool.query('UPDATE clients SET actif = false WHERE id = $1', [req.params.id]);
    res.json({ message: '✅ Client désactivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur', erreur: err.message });
  }
});

module.exports = router;
