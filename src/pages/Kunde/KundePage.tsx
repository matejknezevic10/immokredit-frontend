// src/pages/Kunde/KundePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
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
      const res = await api.post('/leads', newKunde);
      setShowModal(false);
      setNewKunde({ firstName: '', lastName: '', email: '', phone: '', source: 'Manuell' });
      // Navigate directly to the new customer
      navigate(`/kunde/${res.data.id}`);
    } catch (err) {
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
    { label: 'Person', done: k.hasPersonData },
    { label: 'Haushalt', done: k.hasHaushaltData },
    { label: 'Finanzplan', done: k.hasFinanzplanData },
    { label: 'Objekt', done: k.objekteCount > 0 },
  ];

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
          <h1 className="kunde-title">Kunden</h1>
          <p className="kunde-subtitle">{kunden.length} Kunden gesamt</p>
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

            <div className="kunde-card-completion">
              {getCompletionDots(k).map((dot, i) => (
                <div key={i} className={`completion-dot ${dot.done ? 'done' : ''}`}>
                  <span className="completion-indicator">{dot.done ? '✅' : '⬜'}</span>
                  <span className="completion-label">{dot.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="kunde-empty">
            Keine Kunden gefunden
          </div>
        )}
      </div>

      {/* ── Neuer Kunde Modal ── */}
      {showModal && (
        <div className="kunde-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="kunde-modal" onClick={e => e.stopPropagation()}>
            <div className="kunde-modal-header">
              <h2>Neuen Kunden anlegen</h2>
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
    </div>
  );
};