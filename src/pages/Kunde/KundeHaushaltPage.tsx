// src/pages/Kunde/KundeHaushaltPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import './KundeForm.css';

export const KundeHaushaltPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (leadId) load(); }, [leadId]);

  const load = async () => {
    try { const res = await api.get(`/kunde/${leadId}/haushalt`); setData(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { id, leadId: _, createdAt, updatedAt, ...fields } = data;
      await api.put(`/kunde/${leadId}/haushalt`, fields);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const set = (field: string, value: any) => setData((p: any) => ({ ...p, [field]: value }));

  const Field = ({ label, field, type = 'text', placeholder = '', unit = '', half = false }: any) => (
    <div className={`kf-field ${half ? 'kf-half' : ''}`}>
      <label className="kf-label">{label}</label>
      <div className={unit ? 'kf-input-unit' : ''}>
        {type === 'textarea' ? (
          <textarea className="kf-input kf-textarea" value={data[field] || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder} />
        ) : (
          <input className="kf-input" type={type} value={data[field] ?? ''} onChange={e => set(field, type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)} placeholder={placeholder} />
        )}
        {unit && <span className="kf-unit">{unit}</span>}
      </div>
    </div>
  );

  if (loading) return <div className="kf-page"><div className="kf-loading">Lade...</div></div>;

  return (
    <div className="kf-page">
      <div className="kf-header">
        <button className="btn-back" onClick={() => navigate(`/kunde/${leadId}`)}>← Zurück</button>
        <h1 className="kf-title">🏠 Haushalt</h1>
        <button className="kf-save-btn" onClick={save} disabled={saving}>
          {saving ? '⏳ Speichern...' : saved ? '✅ Gespeichert' : '💾 Speichern'}
        </button>
      </div>

      {/* Einkommen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Einkommen</h3>
        <p className="kf-hint">Für mehrere Personen nutze das JSON-Feld oder erweitere den Haushalt.</p>
        {/* Simple version — single person for now */}
        <Field label="Nettoverdienst p.M." field="nettoverdienst" type="number" unit="€" />
        <Field label="Sonstige Einkünfte p.M." field="sonstigeEinkuenfte" type="number" unit="€" />
      </div>

      {/* Argumentation Einkünfte */}
      <div className="kf-section">
        <h3 className="kf-section-title">Argumentation Einkünfte</h3>
        <Field label="Argumentation (Kurzarbeit, selbständige Tätigkeit, etc.)" field="argumentationEinkuenfte" type="textarea" />
      </div>

      {/* Zukünftige Wohnkosten */}
      <div className="kf-section">
        <h3 className="kf-section-title">Zukünftige Wohnkosten</h3>
        <div className="kf-row">
          <Field label="Betriebskosten/Miete" field="betriebskostenMiete" type="number" unit="€" half />
          <Field label="Energiekosten" field="energiekosten" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Telefon/Internet" field="telefonInternet" type="number" unit="€" half />
          <Field label="TV/Gebühren" field="tvGebuehren" type="number" unit="€" half />
        </div>
        <Field label="Anmerkung Wohnkosten" field="anmerkungWohnkosten" type="textarea" />
      </div>

      {/* Monatliche Verpflichtungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Monatliche Verpflichtungen</h3>
        <div className="kf-row">
          <Field label="Transportkosten" field="transportkosten" type="number" unit="€" half />
          <Field label="Versicherungen" field="versicherungen" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Lebenshaltungskosten Kreditbeteiligte" field="lebenshaltungskostenKreditbeteiligte" type="number" unit="€" half />
          <Field label="Lebenshaltungskosten Kinder" field="lebenshaltungskostenKinder" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Gesonderte Ausgaben Kinder" field="gesonderteAusgabenKinder" type="number" unit="€" half />
          <Field label="Alimente" field="alimente" type="number" unit="€" half />
        </div>
      </div>

      {/* Haushaltsrechnung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Haushaltsrechnung</h3>
        <div className="kf-row">
          <Field label="Summe gemeinsame Einnahmen" field="summeEinnahmen" type="number" unit="€" half />
          <Field label="Summe der Haushaltsausgaben" field="summeAusgaben" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Sicherheitsaufschlag auf Ausgaben" field="sicherheitsaufschlag" type="number" unit="€" half />
          <Field label="Zwischensumme HHR" field="zwischensummeHhr" type="number" unit="€" half />
        </div>
      </div>

      {/* Zumutbare Kreditrate */}
      <div className="kf-section">
        <h3 className="kf-section-title">Zumutbare Kreditrate</h3>
        <div className="kf-row">
          <Field label="Frei verfügbares Einkommen" field="freiVerfuegbaresEinkommen" type="number" unit="€" half />
          <Field label="Bestandskredite" field="bestandskrediteRate" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Rate Förderung" field="rateFoerderung" type="number" unit="€" half />
          <Field label="Zumutbare Kreditrate" field="zumutbareKreditrate" type="number" unit="€" half />
        </div>
      </div>

      {/* Anmerkungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anmerkungen Haushalt</h3>
        <Field label="Anmerkungen Haushaltsangabe" field="anmerkungen" type="textarea" />
      </div>
    </div>
  );
};