// src/pages/Kunde/KundeFinanzplanPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FormField } from '@/components/FormField';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import './KundeForm.css';

export const KundeFinanzplanPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightField = searchParams.get('highlight') || '';
  const [data, setData] = useState<any>({});
  const [savedData, setSavedData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = !loading && JSON.stringify(data) !== savedData;
  useUnsavedChanges(isDirty);

  useEffect(() => { if (leadId) load(); }, [leadId]);

  const load = async () => {
    try {
      const res = await api.get(`/kunde/${leadId}/finanzplan`);
      setData(res.data);
      setSavedData(JSON.stringify(res.data));
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { id, leadId: _, createdAt, updatedAt, ...fields } = data;
      await api.put(`/kunde/${leadId}/finanzplan`, fields);
      setSavedData(JSON.stringify(data));
      setSaved(true);
      toast.success('Finanzplan gespeichert');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Speichern');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const set = (field: string, value: any) => setData((p: any) => ({ ...p, [field]: value }));

  const fp = (field: string) => ({ value: data[field], highlighted: highlightField === field, onChange: set });

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
          <FormField label="Finanzierungszweck" field="finanzierungszweck" half placeholder="Kauf, Neubau..." {...fp('finanzierungszweck')} />
          <FormField label="Objekt" field="objektTyp" half placeholder="Einfamilienhaus, Wohnung..." {...fp('objektTyp')} />
        </div>
      </div>

      {/* Projektkosten 1 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Projektkosten 1</h3>
        <div className="kf-row">
          <FormField label="Kaufpreis" field="kaufpreis" type="number" unit="€" half {...fp('kaufpreis')} />
          <FormField label="Grundpreis" field="grundpreis" type="number" unit="€" half {...fp('grundpreis')} />
        </div>
        <div className="kf-row">
          <FormField label="Aufschließungskosten" field="aufschliessungskosten" type="number" unit="€" half {...fp('aufschliessungskosten')} />
          <FormField label="Baukosten / Küche" field="baukostenKueche" type="number" unit="€" half {...fp('baukostenKueche')} />
        </div>
      </div>

      {/* Projektkosten 2 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Projektkosten 2</h3>
        <div className="kf-row">
          <FormField label="Renovierungskosten" field="renovierungskosten" type="number" unit="€" half {...fp('renovierungskosten')} />
          <FormField label="Baukostenüberschreitung" field="baukostenueberschreitung" type="number" unit="€" half {...fp('baukostenueberschreitung')} />
        </div>
        <div className="kf-row">
          <FormField label="Kaufnebenkosten" field="kaufnebenkostenProjekt" type="number" unit="€" half {...fp('kaufnebenkostenProjekt')} />
          <FormField label="Möbel, Sonstiges" field="moebelSonstiges" type="number" unit="€" half {...fp('moebelSonstiges')} />
        </div>
        <FormField label="Summe Projektkosten" field="summeProjektkosten" type="number" unit="€" {...fp('summeProjektkosten')} />
      </div>

      {/* Kaufnebenkosten */}
      <div className="kf-section">
        <h3 className="kf-section-title">Kaufnebenkosten</h3>
        <div className="kf-row">
          <FormField label="Errichtung Kaufvertrag/Treuhand" field="kaufvertragTreuhandProzent" type="number" unit="%" half {...fp('kaufvertragTreuhandProzent')} />
          <FormField label="Maklergebühr" field="maklergebuehrProzent" type="number" unit="%" half {...fp('maklergebuehrProzent')} />
        </div>
        <div className="kf-row">
          <FormField label="Grunderwerbsteuer" field="grunderwerbsteuer" type="number" unit="€" half {...fp('grunderwerbsteuer')} />
          <FormField label="Eintragung Eigentumsrecht" field="eintragungEigentumsrecht" type="number" unit="€" half {...fp('eintragungEigentumsrecht')} />
        </div>
        <div className="kf-row">
          <FormField label="Errichtung Kaufvertrag/Treuhand" field="errichtungKaufvertragTreuhand" type="number" unit="€" half {...fp('errichtungKaufvertragTreuhand')} />
          <FormField label="Maklergebühr" field="maklergebuehr" type="number" unit="€" half {...fp('maklergebuehr')} />
        </div>
        <FormField label="Summe Kaufnebenkosten" field="summeKaufnebenkosten" type="number" unit="€" {...fp('summeKaufnebenkosten')} />
      </div>

      {/* Eigenmittel 1 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Eigenmittel 1</h3>
        <FormField label="Bar (Sparbuch, Wertpapiere)" field="eigenmittelBar" type="number" unit="€" {...fp('eigenmittelBar')} />
        <FormField label="Verkaufserlöse" field="verkaufserloese" type="number" unit="€" {...fp('verkaufserloese')} />
        <FormField label="Vorfinanzierung" field="vorfinanzierung" type="boolean" {...fp('vorfinanzierung')} />
      </div>

      {/* Eigenmittel 2 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Eigenmittel 2</h3>
        <div className="kf-row">
          <FormField label="Ablösekapital Versicherung" field="abloesekapitalVersicherung" type="number" unit="€" half {...fp('abloesekapitalVersicherung')} />
          <FormField label="Bausparguthaben" field="bausparguthaben" type="number" unit="€" half {...fp('bausparguthaben')} />
        </div>
        <FormField label="Summe Eigenmittel" field="summeEigenmittel" type="number" unit="€" {...fp('summeEigenmittel')} />
      </div>

      {/* Sonstige Mittel */}
      <div className="kf-section">
        <h3 className="kf-section-title">Sonstige Mittel</h3>
        <div className="kf-row">
          <FormField label="Förderung" field="foerderung" type="number" unit="€" half {...fp('foerderung')} />
          <FormField label="Sonstige Mittel" field="sonstigeMittel" type="number" unit="€" half {...fp('sonstigeMittel')} />
        </div>
      </div>

      {/* Finanzierungsbedarf */}
      <div className="kf-section">
        <h3 className="kf-section-title">Finanzierungsbedarf</h3>
        <div className="kf-row">
          <FormField label="Zwischenfinanzierung Netto" field="zwischenfinanzierungNetto" type="number" unit="€" half {...fp('zwischenfinanzierungNetto')} />
          <FormField label="Zwischenfinanzierung Brutto" field="zwischenfinanzierungBrutto" type="number" unit="€" half {...fp('zwischenfinanzierungBrutto')} />
        </div>
        <div className="kf-row">
          <FormField label="Langfr. Finanzierungsbedarf Netto" field="langfrFinanzierungsbedarfNetto" type="number" unit="€" half {...fp('langfrFinanzierungsbedarfNetto')} />
          <FormField label="Finanzierungsnebenkosten" field="finanzierungsnebenkosten" type="number" unit="€" half {...fp('finanzierungsnebenkosten')} />
        </div>
        <FormField label="Langfr. Finanzierungsbedarf Brutto" field="langfrFinanzierungsbedarfBrutto" type="number" unit="€" {...fp('langfrFinanzierungsbedarfBrutto')} />
      </div>

      {/* Finanzierungsnebenkosten 1 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Finanzierungsnebenkosten 1</h3>
        <div className="kf-row">
          <FormField label="Bearbeitungsspesen" field="bearbeitungsspesen" type="number" unit="€" half {...fp('bearbeitungsspesen')} />
          <FormField label="Kreditvermittlerprovision" field="kreditvermittlerprovision" type="number" unit="€" half {...fp('kreditvermittlerprovision')} />
        </div>
        <div className="kf-row">
          <FormField label="Schätzgebühr" field="schaetzgebuehr" type="number" unit="€" half {...fp('schaetzgebuehr')} />
          <FormField label="Eintragungsgebühr Pfandrecht" field="eintragungsgebuehrPfandrecht" type="number" unit="€" half {...fp('eintragungsgebuehrPfandrecht')} />
        </div>
        <FormField label="Legalisierungsgebühren" field="legalisierungsgebuehren" type="number" unit="€" {...fp('legalisierungsgebuehren')} />
      </div>

      {/* Finanzierungsnebenkosten 2 */}
      <div className="kf-section">
        <h3 className="kf-section-title">Finanzierungsnebenkosten 2</h3>
        <div className="kf-row">
          <FormField label="Grundbucheintragung" field="grundbucheintragung" type="number" unit="€" half {...fp('grundbucheintragung')} />
          <FormField label="Grundbuchauszug" field="grundbuchauszug" type="number" unit="€" half {...fp('grundbuchauszug')} />
        </div>
        <FormField label="Finanzierungsberatungshonorar" field="finanzierungsberatungshonorar" type="number" unit="€" {...fp('finanzierungsberatungshonorar')} />
      </div>

      {/* Zwischenfinanzierung */}
      <div className="kf-section">
        <h3 className="kf-section-title">Zwischenfinanzierung</h3>
        <div className="kf-row">
          <FormField label="Kreditbetrag" field="zwischenKreditbetrag" type="number" unit="€" half {...fp('zwischenKreditbetrag')} />
          <FormField label="Zinssatz" field="zwischenZinssatz" type="number" unit="%" half {...fp('zwischenZinssatz')} />
        </div>
        <div className="kf-row">
          <FormField label="Laufzeit" field="zwischenLaufzeitMonate" type="number" unit="Monate" half {...fp('zwischenLaufzeitMonate')} />
          <FormField label="Bearbeitungsspesen" field="zwischenBearbeitungsspesen" type="number" unit="€" half {...fp('zwischenBearbeitungsspesen')} />
        </div>
        <div className="kf-row">
          <FormField label="Abdeckung durch" field="zwischenAbdeckungDurch" half {...fp('zwischenAbdeckungDurch')} />
          <FormField label="Sicherheiten" field="zwischenSicherheiten" half {...fp('zwischenSicherheiten')} />
        </div>
        <FormField label="Finanzierungsnebenkosten Zwischen" field="finanzierungsnebenkostenZwischen" type="number" unit="€" {...fp('finanzierungsnebenkostenZwischen')} />
      </div>

      {/* Garantie für Firma */}
      <div className="kf-section">
        <h3 className="kf-section-title">Garantie für Firma</h3>
        <div className="kf-row">
          <FormField label="Garantie Betrag" field="garantieBetrag" type="number" unit="€" half {...fp('garantieBetrag')} />
          <FormField label="Garantie Termin" field="garantieTermin" type="date" half {...fp('garantieTermin')} />
        </div>
        <div className="kf-row">
          <FormField label="Laufzeit" field="garantieLaufzeitMonate" type="number" unit="Monate" half {...fp('garantieLaufzeitMonate')} />
          <FormField label="Original an" field="garantieOriginalAn" half {...fp('garantieOriginalAn')} />
        </div>
      </div>

      {/* Anmerkungen */}
      <div className="kf-section">
        <h3 className="kf-section-title">Anmerkungen zum Finanzierungsplan</h3>
        <FormField label="Anmerkungen" field="anmerkungen" type="textarea" {...fp('anmerkungen')} />
      </div>
    </div>
  );
};
