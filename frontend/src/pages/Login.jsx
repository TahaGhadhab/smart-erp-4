import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@smarterp.com');
  const [motDePasse, setMotDePasse] = useState('admin123');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setChargement(true);
    setErreur('');
    try {
      await login(email, motDePasse);
      navigate('/');
    } catch (err) {
      console.error('Erreur login complète:', err);
      setErreur(
        err.response?.data?.message || 
        'Erreur de connexion — vérifiez le backend'
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px', height: '60px',
            background: '#2563eb', borderRadius: '12px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <span style={{ fontSize: '28px' }}>🚗</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
            Smart ERP 4.0
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Agence de location de véhicules
          </p>
        </div>

        {/* Erreur */}
        {erreur && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', padding: '12px', borderRadius: '8px',
            marginBottom: '16px', fontSize: '14px'
          }}>
            ❌ {erreur}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px',
              border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '14px', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Mot de passe */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            style={{
              width: '100%', padding: '12px',
              border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '14px', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={chargement}
          style={{
            width: '100%', padding: '14px',
            background: chargement ? '#93c5fd' : '#2563eb',
            color: 'white', border: 'none',
            borderRadius: '8px', fontSize: '16px',
            fontWeight: '600', cursor: 'pointer'
          }}
        >
          {chargement ? '⏳ Connexion...' : '🔐 Se connecter'}
        </button>

        {/* Comptes test */}
        <div style={{
          marginTop: '24px', padding: '12px',
          background: '#f8fafc', borderRadius: '8px'
        }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
            Comptes de test :
          </p>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>admin@smarterp.com / admin123</p>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>manager@smarterp.com / manager123</p>
        </div>
      </div>
    </div>
  );
}