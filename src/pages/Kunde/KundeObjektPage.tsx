// src/pages/Kunde/KundeObjektPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FormField } from '@/components/FormField';
import { TagInput } from '@/components/TagInput';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { usePflichtfelder } from '@/hooks/usePflichtfelder';
import './KundeForm.css';

export const KundeObjektPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { isHighlighted } = usePflichtfelder({ leadId, section: 'objekt' });
  const [objekte, setObjekte] = useState<any[]>([]);
  const [savedObjekte, setSavedObjekte] = useState<string>('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = !loading && JSON.stringify(objekte) !== savedObjekte;
  useUnsavedChanges(isDirty);

  useEffect(() => { if (leadId) load(); }, [leadId]);

  const load = async () => {
    try {
      const res = await api.get(`/kunde/${leadId}/objekte`);
      if (res.data.length === 0) {
        const newObj = await api.post(`/kunde/${leadId}/objekte`, {});
        setObjekte([newObj.data]);
        setSavedObjekte(JSON.stringify([newObj.data]));
      } else {
        setObjekte(res.data);
        setSavedObjekte(JSON.stringify(res.data));
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
      setSavedObjekte(JSON.stringify(updated));
      setSaved(true);
      toast.success('Objektdaten gespeichert');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Speichern');
      console.error(err);
    }
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

  const fp = (field: string) => ({ value: data[field], highlighted: isHighlighted(field), onChange: set });

  const updateJson = (field: string, key: string, value: any) => {
    const updated = [...objekte];
    updated[activeIdx] = {
      ...updated[activeIdx],
      [field]: { ...(updated[activeIdx][field] || {}), [key]: value },
    };
    setObjekte(updated);
  };

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
          <FormField label="Objekttyp" field="objektTyp" half placeholder="Einfamilienhaus, ETW..." {...fp('objektTyp')} />
          <FormField label="Geplante Vermietung" field="geplanteVermietung" type="boolean" half {...fp('geplanteVermietung')} />
        </div>
        <FormField label="Zugehörigkeit Kreditnehmer/in" field="zugehoerigkeitKreditnehmer" {...fp('zugehoerigkeitKreditnehmer')} />
      </div>

      {/* Weitere Objektangaben */}
      <div className="kf-section">
        <h3 className="kf-section-title">Weitere Objektangaben</h3>
        <div className="kf-row">
          <FormField label="Katastralgemeinde/-Nummer" field="katastralgemeinde" half {...fp('katastralgemeinde')} />
          <FormField label="Einlagezahl" field="einlagezahl" half {...fp('einlagezahl')} />
        </div>
        <div className="kf-row">
          <FormField label="Grundstücksfläche" field="grundstuecksflaeche" type="number" unit="m²" half {...fp('grundstuecksflaeche')} />
          <FormField label="Energiekennzahl" field="energiekennzahl" type="number" half {...fp('energiekennzahl')} />
        </div>
        <FormField label="Grundstücksnummer" field="grundstuecksnummer" {...fp('grundstuecksnummer')} />
      </div>

      {/* Grundstücksadresse */}
      <div className="kf-section">
        <h3 className="kf-section-title">Grundstücksadresse</h3>
        <div className="kf-row">
          <FormField label="Straße" field="strasse" half {...fp('strasse')} />
          <FormField label="Hausnummer" field="hausnummer" half {...fp('hausnummer')} />
        </div>
        <div className="kf-row">
          <FormField label="Postleitzahl" field="plz" half {...fp('plz')} />
          <FormField label="Ort" field="ort" half {...fp('ort')} />
        </div>
      </div>

      {/* Baujahr */}
      <div className="kf-section">
        <h3 className="kf-section-title">Baujahr</h3>
        <FormField label="Objekt im Bau" field="objektImBau" type="boolean" {...fp('objektImBau')} />
        <div className="kf-row">
          <FormField label="Baujahr" field="baujahr" type="number" half {...fp('baujahr')} />
          <FormField label="Baubeginn" field="baubeginn" type="date" half {...fp('baubeginn')} />
        </div>
        <FormField label="Bauende" field="bauende" type="date" {...fp('bauende')} />
      </div>

      {/* Ergänzende Objektangaben */}
      <div className="kf-section">
        <h3 className="kf-section-title">Ergänzende Objektangaben</h3>
        <FormField label="Ist/wird in Fertigteilbauweise errichtet?" field="fertigteilbauweise" type="boolean" {...fp('fertigteilbauweise')} />
        <FormField label="Überwiegender Materialanteil" field="materialanteil" {...fp('materialanteil')} />
      </div>

      {/* Treuhänder */}
      <div className="kf-section">
        <h3 className="kf-section-title">Treuhänder</h3>
        <FormField label="Name" field="treuhaenderName" placeholder="Rechtsanwalt, Notar" {...fp('treuhaenderName')} />
        <div className="kf-row">
          <FormField label="Telefon" field="treuhaenderTelefon" half {...fp('treuhaenderTelefon')} />
          <FormField label="Fax" field="treuhaenderFax" half {...fp('treuhaenderFax')} />
        </div>
      </div>

      {/* Treuhänder Adresse */}
      <div className="kf-section">
        <h3 className="kf-section-title">Treuhänder Adresse</h3>
        <div className="kf-row">
          <FormField label="Straße" field="treuhaenderStrasse" half {...fp('treuhaenderStrasse')} />
          <FormField label="Hausnummer" field="treuhaenderHausnummer" half {...fp('treuhaenderHausnummer')} />
        </div>
        <div className="kf-row">
          <FormField label="Postleitzahl" field="treuhaenderPlz" half {...fp('treuhaenderPlz')} />
          <FormField label="Ort" field="treuhaenderOrt" half {...fp('treuhaenderOrt')} />
        </div>
      </div>

      {/* Flächen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Flächen</h3>
        <div className="kf-row">
          <FormField label="Keller" field="flaecheKeller" type="number" unit="m²" half {...fp('flaecheKeller')} />
          <FormField label="Erdgeschoss" field="flaecheErdgeschoss" type="number" unit="m²" half {...fp('flaecheErdgeschoss')} />
        </div>
        <div className="kf-row">
          <FormField label="Obergeschoss" field="flaecheObergeschoss" type="number" unit="m²" half {...fp('flaecheObergeschoss')} />
          <FormField label="Weiteres OG" field="flaecheWeiteresOg" type="number" unit="m²" half {...fp('flaecheWeiteresOg')} />
        </div>
        <FormField label="Dachgeschoss" field="flaecheDachgeschoss" type="number" unit="m²" {...fp('flaecheDachgeschoss')} />
      </div>

      {/* Sonstige Flächen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Sonstige Flächen</h3>
        <div className="kf-row">
          <FormField label="Loggia" field="flaecheLoggia" type="number" unit="m²" half {...fp('flaecheLoggia')} />
          <FormField label="Balkon" field="flaecheBalkon" type="number" unit="m²" half {...fp('flaecheBalkon')} />
        </div>
        <div className="kf-row">
          <FormField label="Terrasse" field="flaecheTerrasse" type="number" unit="m²" half {...fp('flaecheTerrasse')} />
          <FormField label="Wintergarten" field="flaecheWintergarten" type="number" unit="m²" half {...fp('flaecheWintergarten')} />
        </div>
        <div className="kf-row">
          <FormField label="Garage" field="flaecheGarage" type="number" unit="m²" half {...fp('flaecheGarage')} />
          <FormField label="Nebengebäude" field="flaecheNebengebaeude" type="number" unit="m²" half {...fp('flaecheNebengebaeude')} />
        </div>
      </div>

      {/* Orientierung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Orientierung</h3>
        <FormField label="Die Aufenthaltsräume orientieren sich" field="orientierung" placeholder="Nord, Süd, Ost, West..." {...fp('orientierung')} />
      </div>

      {/* Sanierung Außen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Sanierung Außen</h3>
        <div className="kf-row">
          <FormField label="Bauwerk (Jahr)" field="sanierungAussen_bauwerk" type="number" half
            value={(data.sanierungAussen || {}).bauwerk}
            onChange={(_, v) => updateJson('sanierungAussen', 'bauwerk', v)} />
          <FormField label="Dachdeckung (Jahr)" field="sanierungAussen_dachdeckung" type="number" half
            value={(data.sanierungAussen || {}).dachdeckung}
            onChange={(_, v) => updateJson('sanierungAussen', 'dachdeckung', v)} />
        </div>
        <FormField label="Außenfassade (Jahr)" field="sanierungAussen_aussenfassade" type="number"
          value={(data.sanierungAussen || {}).aussenfassade}
          onChange={(_, v) => updateJson('sanierungAussen', 'aussenfassade', v)} />
      </div>

      {/* Sanierung Innen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Sanierung Innen</h3>
        <div className="kf-row">
          <FormField label="Fenster (Jahr)" field="sanierungInnen_fenster" type="number" half
            value={(data.sanierungInnen || {}).fenster}
            onChange={(_, v) => updateJson('sanierungInnen', 'fenster', v)} />
          <FormField label="Heizung (Jahr)" field="sanierungInnen_heizung" type="number" half
            value={(data.sanierungInnen || {}).heizung}
            onChange={(_, v) => updateJson('sanierungInnen', 'heizung', v)} />
        </div>
        <div className="kf-row">
          <FormField label="Elektro (Jahr)" field="sanierungInnen_elektro" type="number" half
            value={(data.sanierungInnen || {}).elektro}
            onChange={(_, v) => updateJson('sanierungInnen', 'elektro', v)} />
          <FormField label="Maler (Jahr)" field="sanierungInnen_maler" type="number" half
            value={(data.sanierungInnen || {}).maler}
            onChange={(_, v) => updateJson('sanierungInnen', 'maler', v)} />
        </div>
        <FormField label="Innenputz (Jahr)" field="sanierungInnen_innenputz" type="number"
          value={(data.sanierungInnen || {}).innenputz}
          onChange={(_, v) => updateJson('sanierungInnen', 'innenputz', v)} />
      </div>

      {/* Badezimmer */}
      <div className="kf-section">
        <h3 className="kf-section-title">Badezimmer</h3>
        <div className="kf-row">
          <FormField label="Anzahl" field="ausstattungBadezimmer_anzahl" type="number" half
            value={(data.ausstattungBadezimmer || {}).anzahl}
            onChange={(_, v) => updateJson('ausstattungBadezimmer', 'anzahl', v)} />
          <FormField label="Ausstattung" field="ausstattungBadezimmer_ausstattung" half
            placeholder="Standard, Gehoben..."
            value={(data.ausstattungBadezimmer || {}).ausstattung}
            onChange={(_, v) => updateJson('ausstattungBadezimmer', 'ausstattung', v)} />
        </div>
        <TagInput
          label="Ausstattungsdetails"
          tags={(data.ausstattungBadezimmer || {}).items || []}
          onChange={(items) => updateJson('ausstattungBadezimmer', 'items', items)}
          placeholder="z.B. Dusche, Badewanne, Doppelwaschbecken..."
        />
      </div>

      {/* Heizung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Heizung</h3>
        <div className="kf-row">
          <FormField label="Heizsystem" field="heizung_heizsystem" half
            placeholder="Fußbodenheizung, Radiatoren..."
            value={(data.heizung || {}).heizsystem}
            onChange={(_, v) => updateJson('heizung', 'heizsystem', v)} />
          <FormField label="Heizungsmedium" field="heizung_heizungsmedium" half
            placeholder="Gas, Fernwärme, Wärmepumpe..."
            value={(data.heizung || {}).heizungsmedium}
            onChange={(_, v) => updateJson('heizung', 'heizungsmedium', v)} />
        </div>
        <TagInput
          label="Zusätzliche Heizquellen"
          tags={(data.heizung || {}).zusaetzliche || []}
          onChange={(items) => updateJson('heizung', 'zusaetzliche', items)}
          placeholder="z.B. Kachelofen, Solar..."
        />
      </div>

      {/* Ausstattung Außenbereich */}
      <div className="kf-section">
        <h3 className="kf-section-title">Ausstattung Außenbereich</h3>
        <TagInput
          label="Außenbereich"
          tags={data.ausstattungAussenbereich || []}
          onChange={(items) => set('ausstattungAussenbereich', items)}
          placeholder="z.B. Pool, Garten, Carport..."
        />
      </div>

      {/* Weitere Ausstattungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Weitere Ausstattungen</h3>
        <TagInput
          label="Ausstattungen"
          tags={data.weitereAusstattungen || []}
          onChange={(items) => set('weitereAusstattungen', items)}
          placeholder="z.B. Alarmanlage, Sauna, Kamin..."
        />
      </div>
    </div>
  );
};
