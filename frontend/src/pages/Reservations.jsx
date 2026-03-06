import { useEffect, useState } from 'react';
import API from '../services/api';
import { jsPDF } from 'jspdf';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients]           = useState([]);
  const [vehicules, setVehicules]       = useState([]);
  const [chargement, setChargement]     = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm] = useState({
    client_id: '', vehicule_id: '',
    date_debut: '', date_fin: '',
    caution: 500
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
    } catch (err) { console.error(err); }
    finally { setChargement(false); }
  };

  const handleSubmit = async () => {
    try {
      await API.post('/reservations', form);
      setShowModal(false);
      setForm({ client_id: '', vehicule_id: '', date_debut: '', date_fin: '', caution: 500 });
      chargerDonnees();
    } catch (err) { alert('Erreur lors de la création'); }
  };

  const formaterDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  const getStatutStyle = (statut) => {
    if (statut === 'confirmée') return { background: '#dbeafe', color: '#2563eb' };
    if (statut === 'en_cours')  return { background: '#fef9c3', color: '#ca8a04' };
    if (statut === 'terminée') return { background: '#dcfce7', color: '#16a34a' };
    if (statut === 'annulée')  return { background: '#fee2e2', color: '#dc2626' };
    return { background: '#f1f5f9', color: '#64748b' };
  };

  // ── EXPORT PDF ──────────────────────────────────────────────────────────────
  const exporterPDF = (reservation) => {
    const client   = clients.find(c => c.id === reservation.client_id);
    const vehicule = vehicules.find(v => v.id === reservation.vehicule_id);
    const doc = new jsPDF();

    const jours = reservation.date_debut && reservation.date_fin
      ? Math.ceil((new Date(reservation.date_fin) - new Date(reservation.date_debut)) / (1000*60*60*24))
      : 0;

    // ── FOND HEADER ──
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 50, 'F');

    // Bande accent
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 46, 210, 4, 'F');

    // Nom agence
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Smart ERP 4.0', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(147, 197, 253);
    doc.text('Agence de location de vehicules', 14, 31);
    doc.text('contact@smarterp.com  |  +216 XX XXX XXX', 14, 39);

    // FACTURE label
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FACTURE', 196, 18, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(147, 197, 253);
    doc.text('N° ' + String(reservation.id).padStart(4, '0'), 196, 26, { align: 'right' });
    doc.text('Date : ' + new Date().toLocaleDateString('fr-FR'), 196, 34, { align: 'right' });

    // ── NUMÉRO RÉSERVATION ──
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, 58, 182, 14, 2, 2, 'F');
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, 58, 182, 14, 2, 2, 'S');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('RESERVATION N° ' + String(reservation.id).padStart(4, '0'), 105, 67, { align: 'center' });

    // ── BLOC CLIENT ──
    let y = 82;
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(14, y, 88, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CLIENT', 58, y + 5.5, { align: 'center' });

    doc.setFillColor(248, 250, 252);
    doc.rect(14, y + 8, 88, 42, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y + 8, 88, 42, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(client ? (client.prenom + ' ' + client.nom).toUpperCase() : 'Client #' + reservation.client_id, 18, y + 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (client) {
      doc.text('Email  : ' + (client.email || '-'), 18, y + 27);
      doc.text('Tel    : ' + (client.telephone || '-'), 18, y + 34);
      doc.text('Permis : ' + (client.numero_permis || '-'), 18, y + 41);
    }

    // ── BLOC VEHICULE ──
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(108, y, 88, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('VEHICULE', 152, y + 5.5, { align: 'center' });

    doc.setFillColor(248, 250, 252);
    doc.rect(108, y + 8, 88, 42, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(108, y + 8, 88, 42, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(vehicule ? (vehicule.marque + ' ' + vehicule.modele).toUpperCase() : 'Vehicule #' + reservation.vehicule_id, 112, y + 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (vehicule) {
      doc.text('Immat    : ' + vehicule.immatriculation, 112, y + 27);
      doc.text('Annee    : ' + vehicule.annee, 112, y + 34);
      doc.text('Categorie : ' + (vehicule.categorie || '-'), 112, y + 41);
    }

    // ── PÉRIODE ──
    y = 145;
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(14, y, 182, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PERIODE DE LOCATION', 105, y + 5.5, { align: 'center' });

    doc.setFillColor(239, 246, 255);
    doc.rect(14, y + 8, 182, 16, 'F');
    doc.setDrawColor(191, 219, 254);
    doc.rect(14, y + 8, 182, 16, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Du : ' + formaterDate(reservation.date_debut), 20, y + 18);
    doc.text('Au : ' + formaterDate(reservation.date_fin), 85, y + 18);
    doc.setTextColor(37, 99, 235);
    doc.text('Duree : ' + jours + ' jour(s)', 155, y + 18);

    // ── TABLEAU FINANCIER ──
    y = 178;
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(14, y, 182, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('RECAPITULATIF FINANCIER', 105, y + 5.5, { align: 'center' });

    y += 8;
    const lignes = [
      ['Prix par jour', vehicule ? vehicule.prix_location_jour + ' EUR' : '-'],
      ['Nombre de jours', jours + ' jour(s)'],
      ['Sous-total', vehicule ? (jours * vehicule.prix_location_jour).toFixed(2) + ' EUR' : '-'],
      ['Caution (remboursable)', (reservation.caution || 500) + ' EUR'],
    ];

    lignes.forEach((ligne, i) => {
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(14, y, 182, 11, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 11, 196, y + 11);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(ligne[0], 20, y + 7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(ligne[1], 193, y + 7.5, { align: 'right' });
      y += 11;
    });

    // Ligne total
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(14, y + 3, 182, 14, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', 20, y + 12);
    doc.text(parseFloat(reservation.prix_total || 0).toFixed(2) + ' EUR', 193, y + 12, { align: 'right' });

    // ── STATUT ──
    y += 26;
    const statutInfo = {
      'confirmée': { bg: [37, 99, 235],  label: 'CONFIRMEE' },
      'en_cours':  { bg: [202, 138, 4],  label: 'EN COURS' },
      'terminée':  { bg: [22, 163, 74],  label: 'TERMINEE' },
      'annulée':   { bg: [220, 38, 38],  label: 'ANNULEE' },
    };
    const si = statutInfo[reservation.statut] || { bg: [100, 116, 139], label: (reservation.statut || '').toUpperCase() };
    doc.setFillColor(...si.bg);
    doc.roundedRect(14, y, 50, 11, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('STATUT : ' + si.label, 39, y + 7.5, { align: 'center' });

    // Note légale
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Ce document est une confirmation officielle de reservation. La caution sera restituee a la fin de la location.', 105, y + 7, { align: 'center' });

    // ── FOOTER ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 272, 210, 25, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 272, 210, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Smart ERP 4.0', 105, 281, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Agence de location de vehicules  |  contact@smarterp.com  |  +216 XX XXX XXX', 105, 288, { align: 'center' });

    doc.save('Facture_N' + String(reservation.id).padStart(4, '0') + '.pdf');
  };

  if (chargement) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Chargement...</div>
  );

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Réservations
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
            {reservations.length} réservations au total
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          + Nouvelle réservation
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Confirmées',  val: reservations.filter(r => r.statut === 'confirmée').length,  color: '#2563eb' },
          { label: 'En cours',    val: reservations.filter(r => r.statut === 'en_cours').length,   color: '#ca8a04' },
          { label: 'Terminées',   val: reservations.filter(r => r.statut === 'terminée').length,  color: '#16a34a' },
          { label: 'Annulées',    val: reservations.filter(r => r.statut === 'annulée').length,   color: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['#', 'Client', 'Véhicule', 'Dates', 'Prix total', 'Statut', 'PDF'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservations.map((r, i) => {
              const client  = clients.find(c => c.id === r.client_id);
              const vehicule = vehicules.find(v => v.id === r.vehicule_id);
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                    #{String(r.id).padStart(4, '0')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      {client ? client.prenom + ' ' + client.nom : 'Client #' + r.client_id}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{client?.email || ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      {vehicule ? vehicule.marque + ' ' + vehicule.modele : 'Véhicule #' + r.vehicule_id}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{vehicule?.immatriculation || ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', color: '#374151' }}>
                      {formaterDate(r.date_debut)} → {formaterDate(r.date_fin)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#2563eb', fontSize: '14px' }}>
                    {parseFloat(r.prix_total || 0).toFixed(2)} EUR
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...getStatutStyle(r.statut), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {r.statut}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => exporterPDF(r)}
                      style={{ background: 'linear-gradient(135deg, #dc2626, #ea580c)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📄 PDF
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {reservations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Aucune réservation</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
              Nouvelle Réservation
            </h2>
            {[
              { label: 'Client', key: 'client_id', type: 'select', options: clients.map(c => ({ val: c.id, label: c.prenom + ' ' + c.nom })) },
              { label: 'Véhicule', key: 'vehicule_id', type: 'select', options: vehicules.filter(v => v.statut === 'disponible').map(v => ({ val: v.id, label: v.marque + ' ' + v.modele + ' — ' + v.immatriculation })) },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>{f.label}</label>
                <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Choisir...</option>
                  {f.options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            ))}
            {[
              { label: 'Date début', key: 'date_debut', type: 'date' },
              { label: 'Date fin',   key: 'date_fin',   type: 'date' },
              { label: 'Caution',    key: 'caution',    type: 'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
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
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}