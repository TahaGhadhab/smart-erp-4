const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const verifierToken = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT * FROM utilisateurs WHERE email = $1 AND actif = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: '❌ Email ou mot de passe incorrect' });
    }

    const utilisateur = result.rows[0];

    // Comparaison directe du mot de passe (version développement)
    if (utilisateur.mot_de_passe !== mot_de_passe) {
      return res.status(401).json({ message: '❌ Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: utilisateur.id, email: utilisateur.email, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1',
      [utilisateur.id]
    );

    res.json({
      message: '✅ Connexion réussie',
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role
      }
    });

  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

// GET /api/auth/me
router.get('/me', verifierToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, derniere_connexion FROM utilisateurs WHERE id = $1',
      [req.utilisateur.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;