// src/pages/Kunde/KundePersonPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FormField } from '@/components/FormField';
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

  // Shorthand to reduce boilerplate — shared props for all fields
  const fp = (field: string) => ({ value: data[field], error: errors[field], touched: touched[field], onChange: set, onBlur: handleBlur });

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
          <FormField label="Berater" field="berater" half {...fp('berater')} />
          <FormField label="Finanzierungsstandort" field="finanzierungsstandort" half {...fp('finanzierungsstandort')} />
        </div>
      </div>

      {/* Person */}
      <div className="kf-section">
        <h3 className="kf-section-title">Person</h3>
        <div className="kf-row">
          <FormField label="Anrede" field="anrede" half placeholder="Herr / Frau" {...fp('anrede')} />
          <FormField label="Titel" field="titel" half placeholder="z.B. Ing., Dr." {...fp('titel')} />
        </div>
        <div className="kf-row">
          <FormField label="Vorname" field="vorname" half required {...fp('vorname')} />
          <FormField label="Nachname" field="nachname" half required {...fp('nachname')} />
        </div>
      </div>

      {/* Anschrift */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anschrift</h3>
        <div className="kf-row">
          <FormField label="Straße" field="strasse" {...fp('strasse')} />
          <FormField label="Hausnummer" field="hausnummer" half {...fp('hausnummer')} />
        </div>
        <div className="kf-row">
          <FormField label="Stiege" field="stiege" half {...fp('stiege')} />
          <FormField label="Top" field="top" half {...fp('top')} />
        </div>
        <div className="kf-row">
          <FormField label="Postleitzahl" field="plz" half {...fp('plz')} />
          <FormField label="Ort" field="ort" half {...fp('ort')} />
        </div>
        <FormField label="Land" field="land" placeholder="Österreich" {...fp('land')} />
      </div>

      {/* Kontakt */}
      <div className="kf-section">
        <h3 className="kf-section-title">Kontakt</h3>
        <div className="kf-row">
          <FormField label="Mobilnummer" field="mobilnummer" half {...fp('mobilnummer')} />
          <FormField label="Telefon (tagsüber)" field="telefon" half {...fp('telefon')} />
        </div>
        <FormField label="E-Mail" field="email" type="email" {...fp('email')} />
      </div>

      {/* Geburtsdaten */}
      <div className="kf-section">
        <h3 className="kf-section-title">Geburtsdaten</h3>
        <div className="kf-row">
          <FormField label="Geburtsdatum" field="geburtsdatum" type="date" half {...fp('geburtsdatum')} />
          <FormField label="Geburtsland" field="geburtsland" half {...fp('geburtsland')} />
        </div>
        <div className="kf-row">
          <FormField label="Geburtsort" field="geburtsort" half {...fp('geburtsort')} />
          <FormField label="Alter bei Laufzeitende" field="alterBeiLaufzeitende" type="number" half {...fp('alterBeiLaufzeitende')} />
        </div>
      </div>

      {/* Kredit bis Pensionsantritt */}
      <div className="kf-section">
        <h3 className="kf-section-title">Kredit bis Pensionsantritt</h3>
        <FormField label="Anmerkung" field="anmerkungPensionsantritt" type="textarea" {...fp('anmerkungPensionsantritt')} />
      </div>

      {/* Staatsbürgerschaft */}
      <div className="kf-section">
        <h3 className="kf-section-title">Staatsbürgerschaft</h3>
        <div className="kf-row">
          <FormField label="Staatsbürgerschaft" field="staatsbuergerschaft" half {...fp('staatsbuergerschaft')} />
          <FormField label="Weitere Staatsbürgerschaft" field="weitereStaatsbuergerschaft" half {...fp('weitereStaatsbuergerschaft')} />
        </div>
        <div className="kf-row">
          <FormField label="SV-Nummer" field="svNummer" half {...fp('svNummer')} />
          <FormField label="SV-Träger" field="svTraeger" half placeholder="ÖGK, SVS, BVAEB..." {...fp('svTraeger')} />
        </div>
      </div>

      {/* Wohnverhältnis */}
      <div className="kf-section">
        <h3 className="kf-section-title">Wohnverhältnis</h3>
        <div className="kf-row">
          <FormField label="Wohnart" field="wohnart" half placeholder="Hauptmiete, Eigentum..." {...fp('wohnart')} />
          <FormField label="Wohnhaft seit" field="wohnhaftSeit" type="date" half {...fp('wohnhaftSeit')} />
        </div>
        <FormField label="Steuerdomizil" field="steuerdomizil" {...fp('steuerdomizil')} />
      </div>

      {/* Familienstand */}
      <div className="kf-section">
        <h3 className="kf-section-title">Familienstand</h3>
        <div className="kf-row">
          <FormField label="Familienstand" field="familienstand" half placeholder="Ledig, Verheiratet..." {...fp('familienstand')} />
          <FormField label="Anzahl Kinder" field="anzahlKinder" type="number" half {...fp('anzahlKinder')} />
        </div>
        <FormField label="Unterhaltsberechtigte Personen" field="unterhaltsberechtigtePersonen" type="number" {...fp('unterhaltsberechtigtePersonen')} />
      </div>

      {/* Ausbildung und Beruf */}
      <div className="kf-section">
        <h3 className="kf-section-title">Ausbildung und Beruf</h3>
        <div className="kf-row">
          <FormField label="Höchste abgeschlossene Ausbildung" field="hoechsteAusbildung" half {...fp('hoechsteAusbildung')} />
          <FormField label="Anstellungsverhältnis" field="anstellungsverhaeltnis" half {...fp('anstellungsverhaeltnis')} />
        </div>
      </div>

      {/* Aktuelle Beschäftigung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Aktuelle Beschäftigung</h3>
        <div className="kf-row">
          <FormField label="Beruf" field="beruf" half {...fp('beruf')} />
          <FormField label="Arbeitgeber" field="arbeitgeber" half {...fp('arbeitgeber')} />
        </div>
        <div className="kf-row">
          <FormField label="Beschäftigt seit" field="beschaeftigtSeit" type="date" half {...fp('beschaeftigtSeit')} />
          <FormField label="Vorbeschäftigungsdauer (Monate)" field="vorbeschaeftigungsdauerMonate" type="number" half {...fp('vorbeschaeftigungsdauerMonate')} />
        </div>
      </div>

      {/* Anschrift Arbeitgeber */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anschrift Arbeitgeber</h3>
        <FormField label="Straße" field="arbeitgeberStrasse" {...fp('arbeitgeberStrasse')} />
        <div className="kf-row">
          <FormField label="Hausnummer" field="arbeitgeberHausnummer" half {...fp('arbeitgeberHausnummer')} />
          <FormField label="Postleitzahl" field="arbeitgeberPlz" half {...fp('arbeitgeberPlz')} />
        </div>
        <FormField label="Ort" field="arbeitgeberOrt" {...fp('arbeitgeberOrt')} />
      </div>

      {/* KFZ */}
      <div className="kf-section">
        <h3 className="kf-section-title">KFZ</h3>
        <FormField label="Eigenes KFZ vorhanden" field="eigenesKfz" type="boolean" {...fp('eigenesKfz')} />
      </div>

      {/* Konto */}
      <div className="kf-section">
        <h3 className="kf-section-title">Konto</h3>
        <FormField label="Kontoverbindung" field="kontoverbindung" placeholder="AT..." {...fp('kontoverbindung')} />
        <div className="kf-row">
          <FormField label="Neues Konto bei Bank" field="neuesKontoBeiBank" half {...fp('neuesKontoBeiBank')} />
          <FormField label="Neues Konto IBAN" field="neuesKonto" half {...fp('neuesKonto')} />
        </div>
      </div>

      {/* Anmerkungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anmerkungen</h3>
        <FormField label="Anmerkungen zu den Personendaten" field="anmerkungen" type="textarea" {...fp('anmerkungen')} />
      </div>
    </div>
  );
};
