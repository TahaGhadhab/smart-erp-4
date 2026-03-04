import { useEffect, useState } from 'react';
import API from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, Car, CalendarCheck, TrendingUp, AlertTriangle, Wrench } from 'lucide-react';

const KPICard = ({ titre, valeur, sous_titre, icone: Icone, couleur }) => (
  <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{titre}</span>
      <div style={{ width: '40px', height: '40px', background: couleur, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icone color="white" size={20} />
      </div>
    </div>
    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px' }}>{valeur}</p>
    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{sous_titre}</p>
  </div>
);

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => { chargerDonnees(); }, []);

  const chargerDonnees = async () => {
    try {
      const [k, r, v, c] = await Promise.all([
        API.get('/dashboard/kpis'),
        API.get('/reservations'),
        API.get('/vehicules'),
        API.get('/clients'),
      ]);
      setKpis(k.data);
      setReservations(r.data);
      setVehicules(v.data);
      setClients(c.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  // ── Données graphique 1 — Statut flotte (PieChart)
  const dataFlotte = [
    { name: 'Disponibles',  value: vehicules.filter(v => v.statut === 'disponible').length,  color: '#16a34a' },
    { name: 'Loues',        value: vehicules.filter(v => v.statut === 'loué').length,         color: '#2563eb' },
    { name: 'Maintenance',  value: vehicules.filter(v => v.statut === 'maintenance').length,  color: '#ca8a04' },
  ].filter(d => d.value > 0);

  // ── Données graphique 2 — Risque véhicules (BarChart)
  const dataRisque = vehicules.map(v => ({
    name: v.marque + ' ' + v.modele.substring(0, 4),
    risque: Math.round((v.score_risque_panne || 0) * 100),
    km: Math.round((v.kilometrage || 0) / 1000),
  }));

  // ── Données graphique 3 — Réservations par statut (BarChart)
  const dataReservations = [
    { statut: 'Confirmees', nb: reservations.filter(r => r.statut === 'confirmée').length,  fill: '#2563eb' },
    { statut: 'En cours',   nb: reservations.filter(r => r.statut === 'en_cours').length,   fill: '#16a34a' },
    { statut: 'Terminees',  nb: reservations.filter(r => r.statut === 'terminée').length,   fill: '#64748b' },
    { statut: 'Annulees',   nb: reservations.filter(r => r.statut === 'annulée').length,    fill: '#dc2626' },
  ];

  // ── Données graphique 4 — Profil clients (BarChart)
  const dataClients = [
    { categorie: 'Faible',  nb: clients.filter(c => c.categorie_risque === 'faible').length,  fill: '#16a34a' },
    { categorie: 'Moyen',   nb: clients.filter(c => c.categorie_risque === 'moyen').length,   fill: '#ca8a04' },
    { categorie: 'Eleve',   nb: clients.filter(c => c.categorie_risque === 'élevé').length,   fill: '#dc2626' },
  ];

  if (chargement) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <div style={{ fontSize: '18px', color: '#64748b' }}>Chargement...</div>
    </div>
  );

  return (
    <div>
      {/* En-tete */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          Tableau de bord
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
          Vue d'ensemble de votre agence
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <KPICard titre="Clients actifs"         valeur={kpis?.clients?.total || 0}                                          sous_titre="clients enregistres"             icone={Users}         couleur="#2563eb" />
        <KPICard titre="Vehicules disponibles"  valeur={kpis?.vehicules?.disponibles || 0}                                  sous_titre={'sur ' + (kpis?.vehicules?.total || 0) + ' total'} icone={Car}           couleur="#16a34a" />
        <KPICard titre="Reservations en cours"  valeur={kpis?.reservations?.en_cours || 0}                                  sous_titre={kpis?.reservations?.total + ' reservations total'}  icone={CalendarCheck}  couleur="#7c3aed" />
        <KPICard titre="Revenus du mois"        valeur={Number(kpis?.revenus_mois?.total || 0).toFixed(0) + ' EUR'}         sous_titre="chiffre d'affaires mensuel"      icone={TrendingUp}    couleur="#ca8a04" />
        <KPICard titre="En maintenance"         valeur={kpis?.vehicules?.en_maintenance || 0}                               sous_titre="vehicules immobilises"           icone={Wrench}        couleur="#ea580c" />
        <KPICard titre="Alertes actives"        valeur={kpis?.alertes?.non_lues || 0}                                       sous_titre="notifications non lues"          icone={AlertTriangle} couleur="#dc2626" />
      </div>

      {/* Ligne 1 — Flotte + Réservations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Graphique 1 — Statut flotte PieChart */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            Statut de la flotte
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dataFlotte} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => name + ' (' + value + ')'}>
                {dataFlotte.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 2 — Réservations par statut */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            Reservations par statut
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dataReservations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="statut" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="nb" name="Reservations" radius={[4, 4, 0, 0]}>
                {dataReservations.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ligne 2 — Risque véhicules + Profil clients */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Graphique 3 — Score risque véhicules */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            Score de risque — Flotte
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dataRisque} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(val) => val + '%'} />
              <Bar dataKey="risque" name="Risque panne" radius={[0, 4, 4, 0]}>
                {dataRisque.map((entry, index) => (
                  <Cell key={index} fill={entry.risque > 60 ? '#dc2626' : entry.risque > 30 ? '#ca8a04' : '#16a34a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 4 — Profil risque clients */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            Profil clients
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dataClients} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="nb" nameKey="categorie" label={({ categorie, nb }) => categorie + ' (' + nb + ')'}>
                {dataClients.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
            {dataClients.map(d => (
              <div key={d.categorie} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.fill }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>{d.categorie}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}