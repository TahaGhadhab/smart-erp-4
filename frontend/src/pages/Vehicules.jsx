import { useEffect, useState } from 'react';
import { vehiculesAPI } from '../services/api';

export default function Vehicules() {
  const [vehicules, setVehicules] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState({
    immatriculation: '', marque: '', modele: '',
    annee: '', categorie: '', kilometrage: '', prix_location_jour: ''
  });

  useEffect(() => { chargerVehicules(); }, []);

  const chargerVehicules = async () => {
    try {
      const res = await vehiculesAPI.getAll();
      setVehicules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await vehiculesAPI.create(form);
      setShowModal(false);
      setForm({ immatriculation: '', marque: '', modele: '', annee: '', categorie: '', kilometrage: '', prix_location_jour: '' });
      chargerVehicules();
    } catch (err) {
      alert('Erreur lors de la creation');
    }
  };

  const getStatutStyle = (statut) => {
    if (statut === 'disponible')  return { background: '#dcfce7', color: '#16a34a' };
    if (statut === 'loué')        return { background: '#dbeafe', color: '#2563eb' };
    if (statut === 'maintenance') return { background: '#fef9c3', color: '#ca8a04' };
    return { background: '#f1f5f9', color: '#64748b' };
  };

  const getRisqueStyle = (score) => {
    if (score < 0.3) return { background: '#dcfce7', color: '#16a34a', label: 'Faible' };
    if (score < 0.6) return { background: '#fef9c3', color: '#ca8a04', label: 'Moyen' };
    return { background: '#fee2e2', color: '#dc2626', label: 'Eleve' };
  };

  const vehiculesFiltres = vehicules.filter(v =>
    (v.marque + ' ' + v.modele + ' ' + v.immatriculation).toLowerCase().includes(recherche.toLowerCase())
  );

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
      Chargement...
    </div>
  );

  return (
    <div>
      {/* En-tete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Gestion de la Flotte
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
            {vehicules.length} vehicules enregistres
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
          + Nouveau vehicule
        </button>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Disponibles',  val: vehicules.filter(v => v.statut === 'disponible').length,  color: '#16a34a', bg: '#dcfce7' },
          { label: 'Loues',        val: vehicules.filter(v => v.statut === 'loué').length,         color: '#2563eb', bg: '#dbeafe' },
          { label: 'Maintenance',  val: vehicules.filter(v => v.statut === 'maintenance').length,  color: '#ca8a04', bg: '#fef9c3' },
          { label: 'Total',        val: vehicules.length,                                          color: '#374151', bg: '#f1f5f9' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.val}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher un vehicule..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        style={{
          width: '300px', padding: '10px 16px', marginBottom: '20px',
          border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px'
        }}
      />

      {/* Tableau */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Vehicule', 'Immatriculation', 'Categorie', 'Kilometrage', 'Prix/jour', 'Statut', 'Risque panne'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehiculesFiltres.map((v, index) => {
              const risque = getRisqueStyle(v.score_risque_panne || 0);
              return (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '8px',
                        background: '#f1f5f9', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                      }}>
                        🚗
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                          {v.marque} {v.modele}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.annee}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#374151', fontFamily: 'monospace' }}>
                    {v.immatriculation}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>
                    {v.categorie || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>
                    {(v.kilometrage || 0).toLocaleString()} km
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    {v.prix_location_jour} EUR/j
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      ...getStatutStyle(v.statut),
                      padding: '4px 10px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: '600'
                    }}>
                      {v.statut}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: ((v.score_risque_panne || 0) * 100) + '%',
                          height: '100%', background: risque.color, borderRadius: '3px'
                        }} />
                      </div>
                      <span style={{ ...risque, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {Math.round((v.score_risque_panne || 0) * 100)}% {risque.label}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {vehiculesFiltres.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Aucun vehicule trouve
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
              Nouveau Vehicule
            </h2>
            {[
              { label: 'Immatriculation', key: 'immatriculation', type: 'text' },
              { label: 'Marque',          key: 'marque',          type: 'text' },
              { label: 'Modele',          key: 'modele',          type: 'text' },
              { label: 'Annee',           key: 'annee',           type: 'number' },
              { label: 'Categorie',       key: 'categorie',       type: 'text' },
              { label: 'Kilometrage',     key: 'kilometrage',     type: 'number' },
              { label: 'Prix/jour (EUR)', key: 'prix_location_jour', type: 'number' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '14px' }}>
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
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}
              >
                Creer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}