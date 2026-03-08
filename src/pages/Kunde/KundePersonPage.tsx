// src/pages/Kunde/KundePersonPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import './KundeForm.css';

// ── Validation helpers ──
const validators = {
  email: (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Ungültige E-Mail-Adresse',
  plz: (v: string) => !v || /^\d{4,5}$/.test(v) ? '' : 'PLZ muss 4-5 Ziffern haben',
  svNummer: (v: string) => !v || /^\d{4,10}$/.test(v) ? '' : 'Ungültige SV-Nummer',
  phone: (v: string) => !v || /^[\d\s+\-/()]{6,20}$/.test(v) ? '' : 'Ungültige Telefonnummer',
  required: (v: string) => v?.trim() ? '' : 'Pflichtfeld',
};

type ValidationRule = { validator: keyof typeof validators; message?: string };

const FIELD_RULES: Record<string, ValidationRule[]> = {
  vorname: [{ validator: 'required' }],
  nachname: [{ validator: 'required' }],
  email: [{ validator: 'email' }],
  plz: [{ validator: 'plz' }],
  svNummer: [{ validator: 'svNummer' }],
  mobilnummer: [{ validator: 'phone' }],
  telefon: [{ validator: 'phone' }],
  arbeitgeberPlz: [{ validator: 'plz' }],
};

export const KundePersonPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => { if (leadId) load(); }, [leadId]);

  const load = async () => {
    try {
      const res = await api.get(`/kunde/${leadId}/person`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const validateField = (field: string, value: any): string => {
    const rules = FIELD_RULES[field];
    if (!rules) return '';
    for (const rule of rules) {
      const error = validators[rule.validator](String(value || ''));
      if (error) return rule.message || error;
    }
    return '';
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    for (const field of Object.keys(FIELD_RULES)) {
      const error = validateField(field, data[field]);
      if (error) newErrors[field] = error;
      allTouched[field] = true;
    }
    setErrors(newErrors);
    setTouched(allTouched);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    if (!validateAll()) {
      toast.error('Bitte korrigiere die markierten Felder');
      return;
    }
    setSaving(true);
    try {
      const { id, leadId: _, createdAt, updatedAt, ...fields } = data;
      await api.put(`/kunde/${leadId}/person`, fields);
      setSaved(true);
      toast.success('Personendaten gespeichert');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Speichern');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const set = (field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, data[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const Field = ({ label, field, type = 'text', placeholder = '', half = false, required: isRequired = false }: any) => {
    const hasError = touched[field] && errors[field];
    return (
      <div className={`kf-field ${half ? 'kf-half' : ''}`}>
        <label className="kf-label">
          {label}
          {isRequired && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            className={`kf-input kf-textarea ${hasError ? 'kf-input-error' : ''}`}
            value={data[field] || ''}
            onChange={e => set(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={placeholder}
          />
        ) : type === 'boolean' ? (
          <div className="kf-toggle">
            <button type="button" className={`kf-toggle-btn ${data[field] === true ? 'active' : ''}`} onClick={() => set(field, true)}>Ja</button>
            <button type="button" className={`kf-toggle-btn ${data[field] === false ? 'active' : ''}`} onClick={() => set(field, false)}>Nein</button>
          </div>
        ) : (
          <input
            className={`kf-input ${hasError ? 'kf-input-error' : ''}`}
            type={type}
            value={data[field] ?? ''}
            onChange={e => set(field, type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={placeholder}
          />
        )}
        {hasError && <div className="kf-error">{errors[field]}</div>}
      </div>
    );
  };

  if (loading) return <div className="kf-page"><div className="kf-loading">Lade...</div></div>;

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="kf-page">
      <div className="kf-header">
        <button className="btn-back" onClick={() => navigate(`/kunde/${leadId}`)}>← Zurück</button>
        <h1 className="kf-title">👤 Person</h1>
        <button className="kf-save-btn" onClick={save} disabled={saving}>
          {saving ? '⏳ Speichern...' : saved ? '✅ Gespeichert' : '💾 Speichern'}
        </button>
      </div>

      {errorCount > 0 && (
        <div className="kf-validation-summary">
          <span className="kf-validation-summary-icon">⚠️</span>
          {errorCount} {errorCount === 1 ? 'Feld hat' : 'Felder haben'} Validierungsfehler
        </div>
      )}

      {/* Finanzierungsmappe */}
      <div className="kf-section">
        <h3 className="kf-section-title">Finanzierungsmappe</h3>
        <div className="kf-row">
          <Field label="Berater" field="berater" half />
          <Field label="Finanzierungsstandort" field="finanzierungsstandort" half />
        </div>
      </div>

      {/* Person */}
      <div className="kf-section">
        <h3 className="kf-section-title">Person</h3>
        <div className="kf-row">
          <Field label="Anrede" field="anrede" half placeholder="Herr / Frau" />
          <Field label="Titel" field="titel" half placeholder="z.B. Ing., Dr." />
        </div>
        <div className="kf-row">
          <Field label="Vorname" field="vorname" half required />
          <Field label="Nachname" field="nachname" half required />
        </div>
      </div>

      {/* Anschrift */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anschrift</h3>
        <div className="kf-row">
          <Field label="Straße" field="strasse" />
          <Field label="Hausnummer" field="hausnummer" half />
        </div>
        <div className="kf-row">
          <Field label="Stiege" field="stiege" half />
          <Field label="Top" field="top" half />
        </div>
        <div className="kf-row">
          <Field label="Postleitzahl" field="plz" half />
          <Field label="Ort" field="ort" half />
        </div>
        <Field label="Land" field="land" placeholder="Österreich" />
      </div>

      {/* Kontakt */}
      <div className="kf-section">
        <h3 className="kf-section-title">Kontakt</h3>
        <div className="kf-row">
          <Field label="Mobilnummer" field="mobilnummer" half />
          <Field label="Telefon (tagsüber)" field="telefon" half />
        </div>
        <Field label="E-Mail" field="email" type="email" />
      </div>

      {/* Geburtsdaten */}
      <div className="kf-section">
        <h3 className="kf-section-title">Geburtsdaten</h3>
        <div className="kf-row">
          <Field label="Geburtsdatum" field="geburtsdatum" type="date" half />
          <Field label="Geburtsland" field="geburtsland" half />
        </div>
        <div className="kf-row">
          <Field label="Geburtsort" field="geburtsort" half />
          <Field label="Alter bei Laufzeitende" field="alterBeiLaufzeitende" type="number" half />
        </div>
      </div>

      {/* Kredit bis Pensionsantritt */}
      <div className="kf-section">
        <h3 className="kf-section-title">Kredit bis Pensionsantritt</h3>
        <Field label="Anmerkung" field="anmerkungPensionsantritt" type="textarea" />
      </div>

      {/* Staatsbürgerschaft */}
      <div className="kf-section">
        <h3 className="kf-section-title">Staatsbürgerschaft</h3>
        <div className="kf-row">
          <Field label="Staatsbürgerschaft" field="staatsbuergerschaft" half />
          <Field label="Weitere Staatsbürgerschaft" field="weitereStaatsbuergerschaft" half />
        </div>
        <div className="kf-row">
          <Field label="SV-Nummer" field="svNummer" half />
          <Field label="SV-Träger" field="svTraeger" half placeholder="ÖGK, SVS, BVAEB..." />
        </div>
      </div>

      {/* Wohnverhältnis */}
      <div className="kf-section">
        <h3 className="kf-section-title">Wohnverhältnis</h3>
        <div className="kf-row">
          <Field label="Wohnart" field="wohnart" half placeholder="Hauptmiete, Eigentum..." />
          <Field label="Wohnhaft seit" field="wohnhaftSeit" type="date" half />
        </div>
        <Field label="Steuerdomizil" field="steuerdomizil" />
      </div>

      {/* Familienstand */}
      <div className="kf-section">
        <h3 className="kf-section-title">Familienstand</h3>
        <div className="kf-row">
          <Field label="Familienstand" field="familienstand" half placeholder="Ledig, Verheiratet..." />
          <Field label="Anzahl Kinder" field="anzahlKinder" type="number" half />
        </div>
        <Field label="Unterhaltsberechtigte Personen" field="unterhaltsberechtigtePersonen" type="number" />
      </div>

      {/* Ausbildung und Beruf */}
      <div className="kf-section">
        <h3 className="kf-section-title">Ausbildung und Beruf</h3>
        <div className="kf-row">
          <Field label="Höchste abgeschlossene Ausbildung" field="hoechsteAusbildung" half />
          <Field label="Anstellungsverhältnis" field="anstellungsverhaeltnis" half />
        </div>
      </div>

      {/* Aktuelle Beschäftigung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Aktuelle Beschäftigung</h3>
        <div className="kf-row">
          <Field label="Beruf" field="beruf" half />
          <Field label="Arbeitgeber" field="arbeitgeber" half />
        </div>
        <div className="kf-row">
          <Field label="Beschäftigt seit" field="beschaeftigtSeit" type="date" half />
          <Field label="Vorbeschäftigungsdauer (Monate)" field="vorbeschaeftigungsdauerMonate" type="number" half />
        </div>
      </div>

      {/* Anschrift Arbeitgeber */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anschrift Arbeitgeber</h3>
        <Field label="Straße" field="arbeitgeberStrasse" />
        <div className="kf-row">
          <Field label="Hausnummer" field="arbeitgeberHausnummer" half />
          <Field label="Postleitzahl" field="arbeitgeberPlz" half />
        </div>
        <Field label="Ort" field="arbeitgeberOrt" />
      </div>

      {/* KFZ */}
      <div className="kf-section">
        <h3 className="kf-section-title">KFZ</h3>
        <div className="kf-field">
          <label className="kf-label">Eigenes KFZ vorhanden</label>
          <div className="kf-toggle">
            <button type="button" className={`kf-toggle-btn ${data.eigenesKfz === true ? 'active' : ''}`} onClick={() => set('eigenesKfz', true)}>Ja</button>
            <button type="button" className={`kf-toggle-btn ${data.eigenesKfz === false ? 'active' : ''}`} onClick={() => set('eigenesKfz', false)}>Nein</button>
          </div>
        </div>
      </div>

      {/* Konto */}
      <div className="kf-section">
        <h3 className="kf-section-title">Konto</h3>
        <Field label="Kontoverbindung" field="kontoverbindung" placeholder="AT..." />
        <div className="kf-row">
          <Field label="Neues Konto bei Bank" field="neuesKontoBeiBank" half />
          <Field label="Neues Konto IBAN" field="neuesKonto" half />
        </div>
      </div>

      {/* Anmerkungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anmerkungen</h3>
        <Field label="Anmerkungen zu den Personendaten" field="anmerkungen" type="textarea" />
      </div>
    </div>
  );
};
