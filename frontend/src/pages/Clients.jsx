import { useEffect, useState } from 'react';
import { clientsAPI } from '../services/api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '',
    telephone: '', numero_permis: '', adresse: ''
  });

  useEffect(() => { chargerClients(); }, []);

  const chargerClients = async () => {
    try {
      const res = await clientsAPI.getAll();
      setClients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await clientsAPI.create(form);
      setShowModal(false);
      setForm({ nom: '', prenom: '', email: '', telephone: '', numero_permis: '', adresse: '' });
      chargerClients();
    } catch (err) {
      alert('Erreur lors de la creation');
    }
  };

  const handleDesactiver = async (id) => {
    if (window.confirm('Desactiver ce client ?')) {
      await clientsAPI.delete(id);
      chargerClients();
    }
  };

  const clientsFiltres = clients.filter(c =>
    (c.nom + ' ' + c.prenom + ' ' + c.email).toLowerCase().includes(recherche.toLowerCase())
  );

  const getRisqueStyle = (risque) => {
    if (risque === 'faible') return { background: '#dcfce7', color: '#16a34a' };
    if (risque === 'eleve' || risque === 'élevé') return { background: '#fee2e2', color: '#dc2626' };
    return { background: '#fef9c3', color: '#ca8a04' };
  };

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
      Chargement...
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Gestion des Clients
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
            {clients.length} clients enregistres
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#2563eb', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 20px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer'
          }}
        >
          + Nouveau client
        </button>
      </div>

      <input
        type="text"
        placeholder="Rechercher un client..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{
          width: '300px', padding: '10px 16px', marginBottom: '20px',
          border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px'
        }}
      />

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Nom', 'Email', 'Telephone', 'Permis', 'Reservations', 'Risque', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientsFiltres.map((client, index) => (
              <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#2563eb', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '14px', flexShrink: 0
                    }}>
                      {(client.prenom || '?').charAt(0)}{(client.nom || '?').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                        {client.prenom} {client.nom}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Client #{client.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{client.email}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{client.telephone || '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{client.numero_permis || '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', textAlign: 'center' }}>
                  {client.nb_reservations || 0}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    ...getRisqueStyle(client.categorie_risque),
                    padding: '4px 10px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600'
                  }}>
                    {client.categorie_risque || 'moyen'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => handleDesactiver(client.id)}
                    style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none',
                      borderRadius: '6px', padding: '6px 12px',
                      fontSize: '12px', cursor: 'pointer', fontWeight: '500'
                    }}
                  >
                    Desactiver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientsFiltres.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Aucun client trouve
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '500px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
              Nouveau Client
            </h2>
            {[
              { label: 'Nom',       key: 'nom',           type: 'text'  },
              { label: 'Prenom',    key: 'prenom',        type: 'text'  },
              { label: 'Email',     key: 'email',         type: 'email' },
              { label: 'Telephone', key: 'telephone',     type: 'text'  },
              { label: 'N Permis',  key: 'numero_permis', type: 'text'  },
              { label: 'Adresse',   key: 'adresse',       type: 'text'  },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    fontSize: '14px', boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '12px', background: '#f1f5f9',
                  color: '#374151', border: 'none', borderRadius: '8px',
                  fontSize: '14px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 1, padding: '12px', background: '#2563eb',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '14px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Creer le client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}