// src/pages/Kunde/KundeHaushaltPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FormField } from '@/components/FormField';
import './KundeForm.css';

// ── Validation helpers ──
const validatePositiveNumber = (v: any): string => {
  if (v === null || v === undefined || v === '') return '';
  const num = Number(v);
  if (isNaN(num)) return 'Bitte eine Zahl eingeben';
  if (num < 0) return 'Wert darf nicht negativ sein';
  return '';
};

const FIELD_RULES: Record<string, (v: any) => string> = {
  nettoverdienst: validatePositiveNumber,
  sonstigeEinkuenfte: validatePositiveNumber,
  betriebskostenMiete: validatePositiveNumber,
  energiekosten: validatePositiveNumber,
  telefonInternet: validatePositiveNumber,
  tvGebuehren: validatePositiveNumber,
  transportkosten: validatePositiveNumber,
  versicherungen: validatePositiveNumber,
  lebenshaltungskostenKreditbeteiligte: validatePositiveNumber,
  lebenshaltungskostenKinder: validatePositiveNumber,
  gesonderteAusgabenKinder: validatePositiveNumber,
  alimente: validatePositiveNumber,
  summeEinnahmen: validatePositiveNumber,
  summeAusgaben: validatePositiveNumber,
  bestandskrediteRate: validatePositiveNumber,
  zumutbareKreditrate: validatePositiveNumber,
};

export const KundeHaushaltPage: React.FC = () => {
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
    try { const res = await api.get(`/kunde/${leadId}/haushalt`); setData(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const validateField = (field: string, value: any): string => {
    const rule = FIELD_RULES[field];
    return rule ? rule(value) : '';
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
      await api.put(`/kunde/${leadId}/haushalt`, fields);
      setSaved(true);
      toast.success('Haushaltsdaten gespeichert');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Speichern');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const set = (field: string, value: any) => {
    setData((p: any) => ({ ...p, [field]: value }));
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

  const fp = (field: string) => ({ value: data[field], error: errors[field], touched: touched[field], onChange: set, onBlur: handleBlur });

  if (loading) return <div className="kf-page"><div className="kf-loading">Lade...</div></div>;

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="kf-page">
      <div className="kf-header">
        <button className="btn-back" onClick={() => navigate(`/kunde/${leadId}`)}>← Zurück</button>
        <h1 className="kf-title">🏠 Haushalt</h1>
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

      {/* Einkommen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Einkommen</h3>
        <p className="kf-hint">Für mehrere Personen nutze das JSON-Feld oder erweitere den Haushalt.</p>
        <FormField label="Nettoverdienst p.M." field="nettoverdienst" type="number" unit="€" {...fp('nettoverdienst')} />
        <FormField label="Sonstige Einkünfte p.M." field="sonstigeEinkuenfte" type="number" unit="€" {...fp('sonstigeEinkuenfte')} />
      </div>

      {/* Argumentation Einkünfte */}
      <div className="kf-section">
        <h3 className="kf-section-title">Argumentation Einkünfte</h3>
        <FormField label="Argumentation (Kurzarbeit, selbständige Tätigkeit, etc.)" field="argumentationEinkuenfte" type="textarea" {...fp('argumentationEinkuenfte')} />
      </div>

      {/* Zukünftige Wohnkosten */}
      <div className="kf-section">
        <h3 className="kf-section-title">Zukünftige Wohnkosten</h3>
        <div className="kf-row">
          <FormField label="Betriebskosten/Miete" field="betriebskostenMiete" type="number" unit="€" half {...fp('betriebskostenMiete')} />
          <FormField label="Energiekosten" field="energiekosten" type="number" unit="€" half {...fp('energiekosten')} />
        </div>
        <div className="kf-row">
          <FormField label="Telefon/Internet" field="telefonInternet" type="number" unit="€" half {...fp('telefonInternet')} />
          <FormField label="TV/Gebühren" field="tvGebuehren" type="number" unit="€" half {...fp('tvGebuehren')} />
        </div>
        <FormField label="Anmerkung Wohnkosten" field="anmerkungWohnkosten" type="textarea" {...fp('anmerkungWohnkosten')} />
      </div>

      {/* Monatliche Verpflichtungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Monatliche Verpflichtungen</h3>
        <div className="kf-row">
          <FormField label="Transportkosten" field="transportkosten" type="number" unit="€" half {...fp('transportkosten')} />
          <FormField label="Versicherungen" field="versicherungen" type="number" unit="€" half {...fp('versicherungen')} />
        </div>
        <div className="kf-row">
          <FormField label="Lebenshaltungskosten Kreditbeteiligte" field="lebenshaltungskostenKreditbeteiligte" type="number" unit="€" half {...fp('lebenshaltungskostenKreditbeteiligte')} />
          <FormField label="Lebenshaltungskosten Kinder" field="lebenshaltungskostenKinder" type="number" unit="€" half {...fp('lebenshaltungskostenKinder')} />
        </div>
        <div className="kf-row">
          <FormField label="Gesonderte Ausgaben Kinder" field="gesonderteAusgabenKinder" type="number" unit="€" half {...fp('gesonderteAusgabenKinder')} />
          <FormField label="Alimente" field="alimente" type="number" unit="€" half {...fp('alimente')} />
        </div>
      </div>

      {/* Haushaltsrechnung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Haushaltsrechnung</h3>
        <div className="kf-row">
          <FormField label="Summe gemeinsame Einnahmen" field="summeEinnahmen" type="number" unit="€" half {...fp('summeEinnahmen')} />
          <FormField label="Summe der Haushaltsausgaben" field="summeAusgaben" type="number" unit="€" half {...fp('summeAusgaben')} />
        </div>
        <div className="kf-row">
          <FormField label="Sicherheitsaufschlag auf Ausgaben" field="sicherheitsaufschlag" type="number" unit="€" half {...fp('sicherheitsaufschlag')} />
          <FormField label="Zwischensumme HHR" field="zwischensummeHhr" type="number" unit="€" half {...fp('zwischensummeHhr')} />
        </div>
      </div>

      {/* Zumutbare Kreditrate */}
      <div className="kf-section">
        <h3 className="kf-section-title">Zumutbare Kreditrate</h3>
        <div className="kf-row">
          <FormField label="Frei verfügbares Einkommen" field="freiVerfuegbaresEinkommen" type="number" unit="€" half {...fp('freiVerfuegbaresEinkommen')} />
          <FormField label="Bestandskredite" field="bestandskrediteRate" type="number" unit="€" half {...fp('bestandskrediteRate')} />
        </div>
        <div className="kf-row">
          <FormField label="Rate Förderung" field="rateFoerderung" type="number" unit="€" half {...fp('rateFoerderung')} />
          <FormField label="Zumutbare Kreditrate" field="zumutbareKreditrate" type="number" unit="€" half {...fp('zumutbareKreditrate')} />
        </div>
      </div>

      {/* Anmerkungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anmerkungen Haushalt</h3>
        <FormField label="Anmerkungen Haushaltsangabe" field="anmerkungen" type="textarea" {...fp('anmerkungen')} />
      </div>
    </div>
  );
};
