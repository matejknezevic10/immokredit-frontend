// src/pages/Kunde/KundePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import './KundePage.css';

interface Kunde {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ampelStatus: string;
  temperatur: string;
  createdAt: string;
  hasPersonData: boolean;
  hasHaushaltData: boolean;
  hasFinanzplanData: boolean;
  objekteCount: number;
}

export const KundePage: React.FC = () => {
  const navigate = useNavigate();
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [newKunde, setNewKunde] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'Manuell',
  });

  useEffect(() => {
    loadKunden();
  }, []);

  const loadKunden = async () => {
    try {
      const res = await api.get('/kunde');
      setKunden(res.data);
    } catch (err) {
      console.error('Failed to load kunden:', err);
    } finally {
      setLoading(false);
    }
  };

  const createKunde = async () => {
    if (!newKunde.firstName || !newKunde.lastName) return;
    setCreating(true);
    try {
      // 1. Lead erstellen
      const res = await api.post('/leads', newKunde);
      // 2. Sofort als Eigenkunde übernehmen
      await api.post(`/leads/${res.data.id}/convert-to-eigenkunde`);
      setShowModal(false);
      setNewKunde({ firstName: '', lastName: '', email: '', phone: '', source: 'Manuell' });
      toast.success(`${newKunde.firstName} ${newKunde.lastName} als Eigenkunde angelegt`);
      navigate(`/kunde/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Anlegen');
      console.error('Failed to create kunde:', err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = kunden.filter(k =>
    `${k.firstName} ${k.lastName} ${k.email} ${k.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const getCompletionDots = (k: Kunde) => [
    { label: 'Person', section: 'person', done: k.hasPersonData },
    { label: 'Haushalt', section: 'haushalt', done: k.hasHaushaltData },
    { label: 'Finanzplan', section: 'finanzplan', done: k.hasFinanzplanData },
    { label: 'Objekt', section: 'objekt', done: k.objekteCount > 0 },
  ];

  const toggleCompletion = async (kundeId: string, section: string, currentValue: boolean) => {
    try {
      await api.patch(`/kunde/${kundeId}/completion`, { section, value: !currentValue });
      // Update local state
      setKunden(prev => prev.map(k => {
        if (k.id !== kundeId) return k;
        const updated = { ...k };
        if (section === 'person') updated.hasPersonData = !currentValue;
        if (section === 'haushalt') updated.hasHaushaltData = !currentValue;
        if (section === 'finanzplan') updated.hasFinanzplanData = !currentValue;
        if (section === 'objekt') updated.objekteCount = !currentValue ? 1 : 0;
        return updated;
      }));
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleArchive = async () => {
    if (!archiveId) return;
    try {
      await api.post(`/leads/${archiveId}/archive`);
      setKunden(prev => prev.filter(k => k.id !== archiveId));
      toast.success('Kunde archiviert');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Archivieren');
    }
    setArchiveId(null);
  };

  const archiveKunde = kunden.find(k => k.id === archiveId);

  if (loading) {
    return (
      <div className="kunde-page">
        <div className="kunde-loading">Lade Kunden...</div>
      </div>
    );
  }

  return (
    <div className="kunde-page">
      <div className="kunde-header">
        <div>
          <h1 className="kunde-title">Meine Kunden</h1>
          <p className="kunde-subtitle">{kunden.length} Eigenkunde{kunden.length !== 1 ? 'n' : ''}</p>
        </div>
        <div className="kunde-header-actions">
          <input
            type="text"
            placeholder="🔍 Kunde suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="kunde-search-input"
          />
          <button className="kunde-add-btn" onClick={() => setShowModal(true)}>
            + Neuer Kunde
          </button>
        </div>
      </div>

      <div className="kunde-grid">
        {filtered.map(k => (
          <div
            key={k.id}
            className="kunde-card"
            onClick={() => navigate(`/kunde/${k.id}`)}
          >
            <div className="kunde-card-top">
              <div className="kunde-card-avatar">
                {k.firstName[0]}{k.lastName[0]}
              </div>
              <div className="kunde-card-info">
                <h3 className="kunde-card-name">{k.firstName} {k.lastName}</h3>
                <p className="kunde-card-contact">{k.email}</p>
                <p className="kunde-card-contact">{k.phone}</p>
              </div>
              <span className={`kunde-card-temp temp-${k.temperatur.toLowerCase()}`}>
                {k.temperatur === 'HOT' ? '🔥' : k.temperatur === 'WARM' ? '🌤️' : '❄️'}
              </span>
            </div>

            <div className="kunde-card-bottom">
              <div className="kunde-card-completion">
                {getCompletionDots(k).map((dot, i) => (
                  <div
                    key={i}
                    className={`completion-dot ${dot.done ? 'done' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompletion(k.id, dot.section, dot.done);
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Klicken um ${dot.label} als ${dot.done ? 'offen' : 'erledigt'} zu markieren`}
                  >
                    <span className="completion-indicator">{dot.done ? '✅' : '⬜'}</span>
                    <span className="completion-label">{dot.label}</span>
                  </div>
                ))}
              </div>
              <button
                className="kunde-archive-btn"
                onClick={(e) => { e.stopPropagation(); setArchiveId(k.id); }}
                title="Archivieren"
              >
                📦
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !search && (
          <div className="kunde-empty">
            Noch keine Eigenkunden. Übernimm Leads aus der Lead-Liste oder lege einen neuen Kunden an.
          </div>
        )}
        {filtered.length === 0 && search && (
          <div className="kunde-empty">
            Keine Kunden gefunden für „{search}"
          </div>
        )}
      </div>

      {/* ── Neuer Kunde Modal ── */}
      {showModal && (
        <div className="kunde-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="kunde-modal" onClick={e => e.stopPropagation()}>
            <div className="kunde-modal-header">
              <h2>Neuen Eigenkunden anlegen</h2>
              <button className="kunde-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="kunde-modal-body">
              <div className="kunde-modal-row">
                <div className="kunde-modal-field">
                  <label>Vorname *</label>
                  <input
                    type="text"
                    value={newKunde.firstName}
                    onChange={e => setNewKunde(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="Vorname"
                    autoFocus
                  />
                </div>
                <div className="kunde-modal-field">
                  <label>Nachname *</label>
                  <input
                    type="text"
                    value={newKunde.lastName}
                    onChange={e => setNewKunde(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Nachname"
                  />
                </div>
              </div>

              <div className="kunde-modal-field">
                <label>E-Mail</label>
                <input
                  type="email"
                  value={newKunde.email}
                  onChange={e => setNewKunde(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@beispiel.at"
                />
              </div>

              <div className="kunde-modal-field">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={newKunde.phone}
                  onChange={e => setNewKunde(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+43 664 ..."
                />
              </div>
            </div>

            <div className="kunde-modal-footer">
              <button className="kunde-modal-cancel" onClick={() => setShowModal(false)}>
                Abbrechen
              </button>
              <button
                className="kunde-modal-submit"
                onClick={createKunde}
                disabled={creating || !newKunde.firstName || !newKunde.lastName}
              >
                {creating ? '⏳ Erstelle...' : 'Kunde anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archivieren Modal ── */}
      {archiveId && archiveKunde && (
        <div className="kunde-modal-overlay" onClick={() => setArchiveId(null)}>
          <div className="kunde-modal" onClick={e => e.stopPropagation()}>
            <div className="kunde-modal-header">
              <h2>Kunde archivieren?</h2>
              <button className="kunde-modal-close" onClick={() => setArchiveId(null)}>x</button>
            </div>
            <div className="kunde-modal-body">
              <p>
                <strong>{archiveKunde.firstName} {archiveKunde.lastName}</strong> wird archiviert
                und verschwindet aus der aktiven Kundenliste. Du findest den Kunden im Archiv.
              </p>
            </div>
            <div className="kunde-modal-footer">
              <button className="kunde-modal-cancel" onClick={() => setArchiveId(null)}>
                Abbrechen
              </button>
              <button className="kunde-modal-submit" onClick={handleArchive}>
                Archivieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};