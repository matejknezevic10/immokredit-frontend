// src/pages/Kunde/KundeObjektPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import './KundeForm.css';

export const KundeObjektPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [objekte, setObjekte] = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (leadId) load(); }, [leadId]);

  const load = async () => {
    try {
      const res = await api.get(`/kunde/${leadId}/objekte`);
      if (res.data.length === 0) {
        // Create first object
        const newObj = await api.post(`/kunde/${leadId}/objekte`, {});
        setObjekte([newObj.data]);
      } else {
        setObjekte(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const data = objekte[activeIdx] || {};

  const save = async () => {
    if (!data.id) return;
    setSaving(true);
    try {
      const { id, leadId: _, createdAt, updatedAt, ...fields } = data;
      const res = await api.put(`/kunde/objekt/${data.id}`, fields);
      const updated = [...objekte];
      updated[activeIdx] = res.data;
      setObjekte(updated);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const addObjekt = async () => {
    try {
      const res = await api.post(`/kunde/${leadId}/objekte`, {});
      setObjekte(prev => [...prev, res.data]);
      setActiveIdx(objekte.length);
    } catch (err) { console.error(err); }
  };

  const set = (field: string, value: any) => {
    const updated = [...objekte];
    updated[activeIdx] = { ...updated[activeIdx], [field]: value };
    setObjekte(updated);
  };

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
        <h1 className="kf-title">🏡 Objekt</h1>
        <button className="kf-save-btn" onClick={save} disabled={saving}>
          {saving ? '⏳ Speichern...' : saved ? '✅ Gespeichert' : '💾 Speichern'}
        </button>
      </div>

      {/* Objekt Tabs */}
      <div className="kf-tabs">
        {objekte.map((obj, i) => (
          <button key={obj.id} className={`kf-tab ${i === activeIdx ? 'active' : ''}`} onClick={() => setActiveIdx(i)}>
            {i + 1}. Objekt
          </button>
        ))}
        <button className="kf-tab kf-tab-add" onClick={addObjekt}>+ Neues Objekt</button>
      </div>

      {/* Objekt */}
      <div className="kf-section">
        <h3 className="kf-section-title">Objekt</h3>
        <div className="kf-row">
          <Field label="Objekttyp" field="objektTyp" half placeholder="Einfamilienhaus, ETW..." />
          <Field label="Geplante Vermietung" field="geplanteVermietung" type="boolean" half />
        </div>
        <Field label="Zugehörigkeit Kreditnehmer/in" field="zugehoerigkeitKreditnehmer" />
      </div>

      {/* Weitere Objektangaben */}
      <div className="kf-section">
        <h3 className="kf-section-title">Weitere Objektangaben</h3>
        <div className="kf-row">
          <Field label="Katastralgemeinde/-Nummer" field="katastralgemeinde" half />
          <Field label="Einlagezahl" field="einlagezahl" half />
        </div>
        <div className="kf-row">
          <Field label="Grundstücksfläche" field="grundstuecksflaeche" type="number" unit="m²" half />
          <Field label="Energiekennzahl" field="energiekennzahl" type="number" half />
        </div>
        <Field label="Grundstücksnummer" field="grundstuecksnummer" />
      </div>

      {/* Grundstücksadresse */}
      <div className="kf-section">
        <h3 className="kf-section-title">Grundstücksadresse</h3>
        <div className="kf-row">
          <Field label="Straße" field="strasse" half />
          <Field label="Hausnummer" field="hausnummer" half />
        </div>
        <div className="kf-row">
          <Field label="Postleitzahl" field="plz" half />
          <Field label="Ort" field="ort" half />
        </div>
      </div>

      {/* Baujahr */}
      <div className="kf-section">
        <h3 className="kf-section-title">Baujahr</h3>
        <Field label="Objekt im Bau" field="objektImBau" type="boolean" />
        <div className="kf-row">
          <Field label="Baujahr" field="baujahr" type="number" half />
          <Field label="Baubeginn" field="baubeginn" type="date" half />
        </div>
        <Field label="Bauende" field="bauende" type="date" />
      </div>

      {/* Ergänzende Objektangaben */}
      <div className="kf-section">
        <h3 className="kf-section-title">Ergänzende Objektangaben</h3>
        <Field label="Ist/wird in Fertigteilbauweise errichtet?" field="fertigteilbauweise" type="boolean" />
        <Field label="Überwiegender Materialanteil" field="materialanteil" />
      </div>

      {/* Treuhänder */}
      <div className="kf-section">
        <h3 className="kf-section-title">Treuhänder</h3>
        <Field label="Name" field="treuhaenderName" placeholder="Rechtsanwalt, Notar" />
        <div className="kf-row">
          <Field label="Telefon" field="treuhaenderTelefon" half />
          <Field label="Fax" field="treuhaenderFax" half />
        </div>
      </div>

      {/* Treuhänder Adresse */}
      <div className="kf-section">
        <h3 className="kf-section-title">Treuhänder Adresse</h3>
        <div className="kf-row">
          <Field label="Straße" field="treuhaenderStrasse" half />
          <Field label="Hausnummer" field="treuhaenderHausnummer" half />
        </div>
        <div className="kf-row">
          <Field label="Postleitzahl" field="treuhaenderPlz" half />
          <Field label="Ort" field="treuhaenderOrt" half />
        </div>
      </div>

      {/* Flächen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Flächen</h3>
        <div className="kf-row">
          <Field label="Keller" field="flaecheKeller" type="number" unit="m²" half />
          <Field label="Erdgeschoss" field="flaecheErdgeschoss" type="number" unit="m²" half />
        </div>
        <div className="kf-row">
          <Field label="Obergeschoss" field="flaecheObergeschoss" type="number" unit="m²" half />
          <Field label="Weiteres OG" field="flaecheWeiteresOg" type="number" unit="m²" half />
        </div>
        <Field label="Dachgeschoss" field="flaecheDachgeschoss" type="number" unit="m²" />
      </div>

      {/* Sonstige Flächen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Sonstige Flächen</h3>
        <div className="kf-row">
          <Field label="Loggia" field="flaecheLoggia" type="number" unit="m²" half />
          <Field label="Balkon" field="flaecheBalkon" type="number" unit="m²" half />
        </div>
        <div className="kf-row">
          <Field label="Terrasse" field="flaecheTerrasse" type="number" unit="m²" half />
          <Field label="Wintergarten" field="flaecheWintergarten" type="number" unit="m²" half />
        </div>
        <div className="kf-row">
          <Field label="Garage" field="flaecheGarage" type="number" unit="m²" half />
          <Field label="Nebengebäude" field="flaecheNebengebaeude" type="number" unit="m²" half />
        </div>
      </div>

      {/* Orientierung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Orientierung</h3>
        <Field label="Die Aufenthaltsräume orientieren sich" field="orientierung" placeholder="Nord, Süd, Ost, West..." />
      </div>
    </div>
  );
};