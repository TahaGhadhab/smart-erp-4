import { useEffect, useState } from 'react';
import API from '../services/api';

export default function Maintenances() {
  const [maintenances, setMaintenances] = useState([]);
  const [vehicules, setVehicules]       = useState([]);
  const [chargement, setChargement]     = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [filtreML, setFiltreML]         = useState('tous');
  const [form, setForm] = useState({
    vehicule_id: '', type_intervention: '',
    description: '', date_planifiee: '',
    cout: '', urgence: 'normale', prestataire: ''
  });

  useEffect(() => { chargerDonnees(); }, []);

  const chargerDonnees = async () => {
    try {
      const [m, v] = await Promise.all([
        API.get('/maintenances'),
        API.get('/vehicules'),
      ]);
      setMaintenances(m.data);
      setVehicules(v.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post('/maintenances', form);
      setShowModal(false);
      setForm({ vehicule_id: '', type_intervention: '', description: '', date_planifiee: '', cout: '', urgence: 'normale', prestataire: '' });
      chargerDonnees();
    } catch (err) {
      alert('Erreur lors de la creation');
    }
  };

  const handleTerminer = async (id) => {
    if (window.confirm('Marquer cette maintenance comme terminee ?')) {
      await API.put('/maintenances/' + id + '/terminer');
      chargerDonnees();
    }
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  const getUrgenceStyle = (urgence) => {
    if (urgence === 'critique') return { background: '#fee2e2', color: '#dc2626' };
    if (urgence === 'urgente')  return { background: '#fef9c3', color: '#ca8a04' };
    return { background: '#f1f5f9', color: '#64748b' };
  };

  const getStatutStyle = (statut) => {
    if (statut === 'planifiée') return { background: '#dbeafe', color: '#2563eb' };
    if (statut === 'en_cours')  return { background: '#fef9c3', color: '#ca8a04' };
    if (statut === 'terminée') return { background: '#dcfce7', color: '#16a34a' };
    return { background: '#f1f5f9', color: '#64748b' };
  };

  // Filtrage
  const maintenancesFiltrees = maintenances.filter(m => {
    if (filtreML === 'ml')      return m.prediction_ml === true;
    if (filtreML === 'manuel')  return m.prediction_ml === false;
    return true;
  });

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Chargement...</div>
  );

  return (
    <div>
      {/* En-tete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Gestion des Maintenances
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
            {maintenances.length} interventions — dont {maintenances.filter(m => m.prediction_ml).length} planifiees par ML 🤖
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          + Nouvelle intervention
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Planifiees',    val: maintenances.filter(m => m.statut === 'planifiée').length,  color: '#2563eb' },
          { label: 'En cours',      val: maintenances.filter(m => m.statut === 'en_cours').length,   color: '#ca8a04' },
          { label: 'Terminees',     val: maintenances.filter(m => m.statut === 'terminée').length,   color: '#16a34a' },
          { label: 'Critiques',     val: maintenances.filter(m => m.urgence === 'critique').length,  color: '#dc2626' },
          { label: 'Predites ML',   val: maintenances.filter(m => m.prediction_ml).length,           color: '#7c3aed' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: stat.color }}>{stat.val}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'tous',   label: 'Toutes' },
          { key: 'ml',     label: '🤖 Predites par ML' },
          { key: 'manuel', label: '👤 Manuelles' },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltreML(f.key)}
            style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              background: filtreML === f.key ? '#2563eb' : '#f1f5f9',
              color: filtreML === f.key ? 'white' : '#374151' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Vehicule', 'Intervention', 'Date planifiee par ML', 'Cout', 'Urgence', 'Statut', 'Source', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maintenancesFiltrees.map((m, index) => {
              const vehicule = vehicules.find(v => v.id === m.vehicule_id);
              return (
                <tr key={m.id} style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: m.prediction_ml
                    ? (index % 2 === 0 ? '#faf5ff' : '#f5f0ff')
                    : (index % 2 === 0 ? 'white' : '#fafafa')
                }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      {vehicule ? vehicule.marque + ' ' + vehicule.modele : 'Vehicule #' + m.vehicule_id}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {vehicule ? vehicule.immatriculation : ''}
                    </div>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      {m.type_intervention}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.description || ''}
                    </div>
                  </td>

                  {/* COLONNE DATE PLANIFIÉE PAR ML */}
                  <td style={{ padding: '12px 16px' }}>
                    {m.prediction_ml ? (
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 12px', display: 'inline-block' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>
                          📅 {formaterDate(m.date_planifiee)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '2px' }}>
                          🤖 Optimisee par ML
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        {formaterDate(m.date_planifiee)}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    {m.cout ? parseFloat(m.cout).toFixed(0) + ' EUR' : '—'}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...getUrgenceStyle(m.urgence), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {m.urgence}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...getStatutStyle(m.statut), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {m.statut}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '20px' }}>
                    {m.prediction_ml
                      ? <span title="Predit par ML" style={{ cursor: 'default' }}>🤖</span>
                      : <span title="Saisi manuellement" style={{ cursor: 'default' }}>👤</span>
                    }
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    {m.statut !== 'terminée' && (
                      <button onClick={() => handleTerminer(m.id)}
                        style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                        Terminer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {maintenancesFiltrees.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            {filtreML === 'ml'
              ? 'Aucune maintenance ML — lancez une analyse dans Predictions ML'
              : 'Aucune maintenance'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
              Nouvelle Intervention
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Vehicule</label>
              <select value={form.vehicule_id} onChange={(e) => setForm({ ...form, vehicule_id: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Choisir un vehicule</option>
                {vehicules.map(v => (
                  <option key={v.id} value={v.id}>{v.marque} {v.modele} — {v.immatriculation}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Urgence</label>
              <select value={form.urgence} onChange={(e) => setForm({ ...form, urgence: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
                <option value="critique">Critique</option>
              </select>
            </div>

            {[
              { label: 'Type intervention', key: 'type_intervention', type: 'text'   },
              { label: 'Description',       key: 'description',       type: 'text'   },
              { label: 'Date planifiee',    key: 'date_planifiee',    type: 'date'   },
              { label: 'Cout (EUR)',        key: 'cout',              type: 'number' },
              { label: 'Prestataire',       key: 'prestataire',       type: 'text'   },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>{field.label}</label>
                <input type={field.type} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
                Annuler
              </button>
              <button onClick={handleSubmit}
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
                Planifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
