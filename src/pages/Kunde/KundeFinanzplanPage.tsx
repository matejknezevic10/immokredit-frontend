// src/pages/Kunde/KundeFinanzplanPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import './KundeForm.css';

export const KundeFinanzplanPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (leadId) load(); }, [leadId]);

  const load = async () => {
    try { const res = await api.get(`/kunde/${leadId}/finanzplan`); setData(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { id, leadId: _, createdAt, updatedAt, ...fields } = data;
      await api.put(`/kunde/${leadId}/finanzplan`, fields);
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
        ) : type === 'boolean' ? (
          <div className="kf-toggle">
            <button type="button" className={`kf-toggle-btn ${data[field] === true ? 'active' : ''}`} onClick={() => set(field, true)}>Ja</button>
            <button type="button" className={`kf-toggle-btn ${data[field] === false ? 'active' : ''}`} onClick={() => set(field, false)}>Nein</button>
          </div>
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
        <h1 className="kf-title">📊 Finanzplan</h1>
        <button className="kf-save-btn" onClick={save} disabled={saving}>
          {saving ? '⏳ Speichern...' : saved ? '✅ Gespeichert' : '💾 Speichern'}
        </button>
      </div>

      {/* Projektrahmen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Projektrahmen</h3>
        <div className="kf-row">
          <Field label="Finanzierungszweck" field="finanzierungszweck" half placeholder="Kauf, Neubau..." />
          <Field label="Objekt" field="objektTyp" half placeholder="Einfamilienhaus, Wohnung..." />
        </div>
      </div>

      {/* Projektkosten 1 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Projektkosten 1</h3>
        <div className="kf-row">
          <Field label="Kaufpreis" field="kaufpreis" type="number" unit="€" half />
          <Field label="Grundpreis" field="grundpreis" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Aufschließungskosten" field="aufschliessungskosten" type="number" unit="€" half />
          <Field label="Baukosten / Küche" field="baukostenKueche" type="number" unit="€" half />
        </div>
      </div>

      {/* Projektkosten 2 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Projektkosten 2</h3>
        <div className="kf-row">
          <Field label="Renovierungskosten" field="renovierungskosten" type="number" unit="€" half />
          <Field label="Baukostenüberschreitung" field="baukostenueberschreitung" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Kaufnebenkosten" field="kaufnebenkostenProjekt" type="number" unit="€" half />
          <Field label="Möbel, Sonstiges" field="moebelSonstiges" type="number" unit="€" half />
        </div>
        <Field label="Summe Projektkosten" field="summeProjektkosten" type="number" unit="€" />
      </div>

      {/* Kaufnebenkosten */}
      <div className="kf-section">
        <h3 className="kf-section-title">Kaufnebenkosten</h3>
        <div className="kf-row">
          <Field label="Errichtung Kaufvertrag/Treuhand" field="kaufvertragTreuhandProzent" type="number" unit="%" half />
          <Field label="Maklergebühr" field="maklergebuehrProzent" type="number" unit="%" half />
        </div>
        <div className="kf-row">
          <Field label="Grunderwerbsteuer" field="grunderwerbsteuer" type="number" unit="€" half />
          <Field label="Eintragung Eigentumsrecht" field="eintragungEigentumsrecht" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Errichtung Kaufvertrag/Treuhand" field="errichtungKaufvertragTreuhand" type="number" unit="€" half />
          <Field label="Maklergebühr" field="maklergebuehr" type="number" unit="€" half />
        </div>
        <Field label="Summe Kaufnebenkosten" field="summeKaufnebenkosten" type="number" unit="€" />
      </div>

      {/* Eigenmittel 1 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Eigenmittel 1</h3>
        <Field label="Bar (Sparbuch, Wertpapiere)" field="eigenmittelBar" type="number" unit="€" />
        <Field label="Verkaufserlöse" field="verkaufserloese" type="number" unit="€" />
        <Field label="Vorfinanzierung" field="vorfinanzierung" type="boolean" />
      </div>

      {/* Eigenmittel 2 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Eigenmittel 2</h3>
        <div className="kf-row">
          <Field label="Ablösekapital Versicherung" field="abloesekapitalVersicherung" type="number" unit="€" half />
          <Field label="Bausparguthaben" field="bausparguthaben" type="number" unit="€" half />
        </div>
        <Field label="Summe Eigenmittel" field="summeEigenmittel" type="number" unit="€" />
      </div>

      {/* Sonstige Mittel */}
      <div className="kf-section">
        <h3 className="kf-section-title">Sonstige Mittel</h3>
        <div className="kf-row">
          <Field label="Förderung" field="foerderung" type="number" unit="€" half />
          <Field label="Sonstige Mittel" field="sonstigeMittel" type="number" unit="€" half />
        </div>
      </div>

      {/* Finanzierungsbedarf */}
      <div className="kf-section">
        <h3 className="kf-section-title">Finanzierungsbedarf</h3>
        <div className="kf-row">
          <Field label="Zwischenfinanzierung Netto" field="zwischenfinanzierungNetto" type="number" unit="€" half />
          <Field label="Zwischenfinanzierung Brutto" field="zwischenfinanzierungBrutto" type="number" unit="€" half />
        </div>
        <div className="kf-row">
          <Field label="Langfr. Finanzierungsbedarf Netto" field="langfrFinanzierungsbedarfNetto" type="number" unit="€" half />
          <Field label="Finanzierungsnebenkosten" field="finanzierungsnebenkosten" type="number" unit="€" half />
        </div>
        <Field label="Langfr. Finanzierungsbedarf Brutto" field="langfrFinanzierungsbedarfBrutto" type="number" unit="€" />
      </div>

      {/* Anmerkungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anmerkungen zum Finanzierungsplan</h3>
        <Field label="Anmerkungen" field="anmerkungen" type="textarea" />
      </div>
    </div>
  );
};