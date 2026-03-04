import { useEffect, useState } from 'react';
import API from '../services/api';

export default function Predictions() {
  const [vehicules, setVehicules]   = useState([]);
  const [clients, setClients]       = useState([]);
  const [resultats, setResultats]   = useState([]);
  const [saisonnalite, setSaisonnalite] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [onglet, setOnglet]         = useState('maintenance');

  useEffect(() => {
    chargerDonnees();
    chargerSaisonnalite();
  }, []);

  const chargerDonnees = async () => {
    const [v, c] = await Promise.all([API.get('/vehicules'), API.get('/clients')]);
    setVehicules(v.data);
    setClients(c.data);
  };

  const chargerSaisonnalite = async () => {
    try {
      const res = await fetch('http://localhost:8000/saisonnalite');
      const data = await res.json();
      setSaisonnalite(data);
    } catch (err) { console.error(err); }
  };

  const analyserVehicules = async () => {
    setChargement(true);
    setResultats([]);
    try {
      const predictions = [];
      for (const v of vehicules) {
        const res = await API.post('/ml/maintenance/' + v.id);
        predictions.push({ ...res.data, nom: v.marque + ' ' + v.modele, immat: v.immatriculation });
      }
      predictions.sort((a, b) => b.score_risque - a.score_risque);
      setResultats(predictions);
    } catch (err) {
      alert('Erreur ML — vérifiez que le service ML tourne sur port 8000');
    } finally {
      setChargement(false);
    }
  };

  const analyserClients = async () => {
    setChargement(true);
    setResultats([]);
    try {
      const predictions = [];
      for (const c of clients) {
        const res = await API.post('/ml/scoring/' + c.id);
        predictions.push({ ...res.data, nom: c.prenom + ' ' + c.nom });
      }
      predictions.sort((a, b) => b.score_risque - a.score_risque);
      setResultats(predictions);
    } catch (err) {
      alert('Erreur ML');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          Predictions ML
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
          Maintenance predictive avec optimisation saisonniere — Random Forest
        </p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'maintenance',  label: '🔧 Maintenance Vehicules' },
          { key: 'scoring',      label: '👥 Scoring Clients'       },
          { key: 'saisonnalite', label: '📅 Calendrier Saisonnier' },
        ].map(o => (
          <button key={o.key} onClick={() => { setOnglet(o.key); setResultats([]); }}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              background: onglet === o.key ? '#2563eb' : '#f1f5f9',
              color: onglet === o.key ? 'white' : '#374151' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── MAINTENANCE ── */}
      {onglet === 'maintenance' && (
        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              Analyse intelligente — Flotte complete
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
              Le modele <strong>Random Forest</strong> analyse chaque vehicule et propose les <strong>meilleures dates de maintenance</strong> en evitant les periodes de haute saison.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {['Kilometrage', 'Saisonnalite', 'Reservations', 'Age vehicule', 'Historique'].map(f => (
                <span key={f} style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                  {f}
                </span>
              ))}
            </div>
            <button onClick={analyserVehicules} disabled={chargement}
              style={{ background: chargement ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {chargement ? '⏳ Analyse en cours...' : '🚀 Lancer analyse ML'}
            </button>
          </div>

          {resultats.map((r) => (
            <div key={r.vehicule_id} style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '5px solid ' + r.couleur }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' }}>
                    🚗 {r.nom}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{r.immat}</span>
                  <span style={{ marginLeft: '12px', background: '#f1f5f9', color: '#374151', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {r.saison_actuelle} — {r.taux_occupation_actuel}% occupation
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: r.couleur }}>
                    {Math.round(r.score_risque * 100)}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Risque {r.niveau_risque}</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', background: r.urgence === 'critique' ? '#fee2e2' : r.urgence === 'urgente' ? '#fef9c3' : '#f1f5f9',
                    color: r.urgence === 'critique' ? '#dc2626' : r.urgence === 'urgente' ? '#ca8a04' : '#64748b',
                    padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    {r.urgence}
                  </div>
                </div>
              </div>

              {/* Barre de risque */}
              <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: (r.score_risque * 100) + '%', height: '100%', background: r.couleur, borderRadius: '5px', transition: 'width 1s ease' }} />
              </div>

              {/* Fenêtres optimales */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                  📅 Fenetres optimales de maintenance
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {(r.fenetres_optimales || []).map((f, i) => (
                    <div key={i} style={{ border: '2px solid ' + (f.recommande ? f.couleur : '#e2e8f0'),
                      borderRadius: '10px', padding: '12px', background: f.recommande ? f.couleur + '10' : '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                          {f.date_affichage}
                        </span>
                        {f.recommande && <span style={{ background: f.couleur, color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>OPTIMAL</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{f.saison} — {f.mois}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: f.couleur }}>
                        {f.taux_occupation}% occupation — {f.qualite}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommandations */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  🔧 Interventions recommandees
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(r.recommandations || []).map((rec, i) => (
                    <span key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#374151', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>
                      {rec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Facteurs importants */}
              {r.facteurs_principaux && (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
                    🤖 Facteurs ML les plus importants
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {r.facteurs_principaux.map((f, i) => (
                      <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                        <span style={{ color: '#64748b' }}>{f.facteur.replace(/_/g, ' ')}</span>
                        <span style={{ fontWeight: '700', color: '#2563eb', marginLeft: '6px' }}>{f.importance}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SCORING ── */}
      {onglet === 'scoring' && (
        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              Scoring de risque clients
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Calcule le profil de risque, la valeur et la caution recommandee pour chaque client
            </p>
            <button onClick={analyserClients} disabled={chargement}
              style={{ background: chargement ? '#c4b5fd' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {chargement ? '⏳ Analyse...' : '🚀 Lancer scoring clients'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {resultats.map((r) => (
              <div key={r.client_id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid ' + r.couleur }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: r.couleur, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                      {r.nom.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{r.nom}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Client #{r.client_id}</div>
                    </div>
                  </div>
                  <span style={{ background: r.couleur + '20', color: r.couleur, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                    {r.categorie_risque}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Risque',    val: Math.round(r.score_risque * 100) + '%', color: r.couleur },
                    { label: 'Valeur',    val: r.score_valeur + '/100',                color: '#2563eb' },
                    { label: 'Fidelite',  val: r.score_fidelite + '/100',              color: '#7c3aed' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Caution recommandee</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: r.couleur }}>{r.caution_recommandee} EUR</div>
                </div>

                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontStyle: 'italic', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  {r.recommandation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SAISONNALITE ── */}
      {onglet === 'saisonnalite' && saisonnalite && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#dcfce7', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ color: '#16a34a', margin: '0 0 8px' }}>✅ Meilleurs mois pour maintenance</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {saisonnalite.meilleurs_mois_maintenance.map(m => (
                  <span key={m} style={{ background: 'white', color: '#16a34a', padding: '6px 14px', borderRadius: '20px', fontWeight: '600', fontSize: '14px' }}>{m}</span>
                ))}
              </div>
            </div>
            <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ color: '#dc2626', margin: '0 0 8px' }}>❌ Mois a eviter</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {saisonnalite.pires_mois_maintenance.map(m => (
                  <span key={m} style={{ background: 'white', color: '#dc2626', padding: '6px 14px', borderRadius: '20px', fontWeight: '600', fontSize: '14px' }}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
              Taux d'occupation par mois
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {saisonnalite.mois.map(m => (
                <div key={m.numero} style={{ textAlign: 'center', padding: '12px', borderRadius: '10px',
                  background: m.ideal_maintenance ? '#f0fdf4' : m.taux_occupation > 80 ? '#fef2f2' : '#fffbeb',
                  border: '2px solid ' + (m.ideal_maintenance ? '#16a34a' : m.taux_occupation > 80 ? '#dc2626' : '#ca8a04') }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{m.mois}</div>
                  <div style={{ fontSize: '24px', fontWeight: '900',
                    color: m.ideal_maintenance ? '#16a34a' : m.taux_occupation > 80 ? '#dc2626' : '#ca8a04' }}>
                    {m.taux_occupation}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{m.saison}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', marginTop: '4px',
                    color: m.ideal_maintenance ? '#16a34a' : '#dc2626' }}>
                    {m.ideal_maintenance ? '✅ Ideal' : '❌ Eviter'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}