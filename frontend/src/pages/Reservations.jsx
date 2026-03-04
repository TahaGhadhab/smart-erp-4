import { useEffect, useState } from 'react';
import API from '../services/api';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    client_id: '', vehicule_id: '',
    date_debut: '', date_fin: '', caution: '500'
  });

  useEffect(() => { chargerDonnees(); }, []);

  const chargerDonnees = async () => {
    try {
      const [r, c, v] = await Promise.all([
        API.get('/reservations'),
        API.get('/clients'),
        API.get('/vehicules'),
      ]);
      setReservations(r.data);
      setClients(c.data);
      setVehicules(v.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const formaterDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const handleSubmit = async () => {
    try {
      const vehicule = vehicules.find(v => v.id === parseInt(form.vehicule_id));
      const jours = Math.ceil((new Date(form.date_fin) - new Date(form.date_debut)) / (1000 * 60 * 60 * 24));
      const prix_total = jours * parseFloat(vehicule.prix_location_jour);
      await API.post('/reservations', { ...form, prix_total, km_depart: vehicule.kilometrage });
      setShowModal(false);
      setForm({ client_id: '', vehicule_id: '', date_debut: '', date_fin: '', caution: '500' });
      chargerDonnees();
    } catch (err) {
      alert('Erreur lors de la creation');
    }
  };

  const getStatutStyle = (statut) => {
    if (statut === 'confirmée') return { background: '#dbeafe', color: '#2563eb' };
    if (statut === 'en_cours')  return { background: '#dcfce7', color: '#16a34a' };
    if (statut === 'terminée') return { background: '#f1f5f9', color: '#64748b' };
    if (statut === 'annulée')  return { background: '#fee2e2', color: '#dc2626' };
    return { background: '#f1f5f9', color: '#64748b' };
  };

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Chargement...</div>
  );

  return (
    <div>
      {/* En-tete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Gestion des Reservations
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
            {reservations.length} reservations enregistrees
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Nouvelle reservation
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'En cours',   val: reservations.filter(r => r.statut === 'en_cours').length,  color: '#16a34a' },
          { label: 'Confirmees', val: reservations.filter(r => r.statut === 'confirmée').length, color: '#2563eb' },
          { label: 'Terminees',  val: reservations.filter(r => r.statut === 'terminée').length,  color: '#64748b' },
          { label: 'Total',      val: reservations.length,                                        color: '#374151' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.val}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['#', 'Client', 'Vehicule', 'Debut', 'Fin', 'Prix', 'Statut', 'Incident'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservations.map((r, index) => {
              const client = clients.find(c => c.id === r.client_id);
              const vehicule = vehicules.find(v => v.id === r.vehicule_id);
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>#{r.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>
                    {client ? client.prenom + ' ' + client.nom : 'Client #' + r.client_id}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>
                    {vehicule ? vehicule.marque + ' ' + vehicule.modele : 'Vehicule #' + r.vehicule_id}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>
                    {formaterDate(r.date_debut)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>
                    {formaterDate(r.date_fin)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    {r.prix_total ? parseFloat(r.prix_total).toFixed(0) + ' EUR' : '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...getStatutStyle(r.statut), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {r.statut}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '18px', textAlign: 'center' }}>
                    {r.incident ? '⚠️' : '✅'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {reservations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Aucune reservation</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
              Nouvelle Reservation
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Client</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="">Choisir un client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Vehicule disponible</label>
              <select
                value={form.vehicule_id}
                onChange={(e) => setForm({ ...form, vehicule_id: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="">Choisir un vehicule</option>
                {vehicules.filter(v => v.statut === 'disponible').map(v => (
                  <option key={v.id} value={v.id}>{v.marque} {v.modele} - {v.immatriculation} ({v.prix_location_jour} EUR/j)</option>
                ))}
              </select>
            </div>

            {[
              { label: 'Date debut', key: 'date_debut', type: 'date' },
              { label: 'Date fin',   key: 'date_fin',   type: 'date' },
              { label: 'Caution',    key: 'caution',    type: 'number' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
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
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}