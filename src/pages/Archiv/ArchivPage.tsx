// src/pages/Archiv/ArchivPage.tsx
import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import './ArchivPage.css';

interface ArchivedKunde {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  temperatur: string;
  createdAt: string;
  archivedAt: string;
}

export const ArchivPage: React.FC = () => {
  const [kunden, setKunden] = useState<ArchivedKunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'abschluss' | 'unarchive' | null>(null);

  useEffect(() => {
    loadArchiv();
  }, []);

  const loadArchiv = async () => {
    try {
      const res = await api.get('/kunde/archiv');
      setKunden(res.data);
    } catch (err) {
      console.error('Failed to load archiv:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await api.post(`/leads/${id}/unarchive`);
      setKunden(prev => prev.filter(k => k.id !== id));
      toast.success('Kunde wiederhergestellt');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler');
    }
    setConfirmId(null);
    setConfirmAction(null);
  };

  const handleAbschluss = async (id: string) => {
    try {
      await api.post(`/leads/${id}/abschluss`);
      setKunden(prev => prev.filter(k => k.id !== id));
      toast.success('Kunde abgeschlossen');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler');
    }
    setConfirmId(null);
    setConfirmAction(null);
  };

  const openConfirm = (id: string, action: 'abschluss' | 'unarchive') => {
    setConfirmId(id);
    setConfirmAction(action);
  };

  const filtered = kunden.filter(k =>
    `${k.firstName} ${k.lastName} ${k.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const confirmKunde = kunden.find(k => k.id === confirmId);

  if (loading) {
    return (
      <div className="archiv-page">
        <div className="archiv-loading">Lade Archiv...</div>
      </div>
    );
  }

  return (
    <div className="archiv-page">
      <div className="archiv-header">
        <div>
          <h1 className="archiv-title">Archiv</h1>
          <p className="archiv-subtitle">{kunden.length} archivierte{kunden.length !== 1 ? ' Kunden' : 'r Kunde'}</p>
        </div>
        {kunden.length > 0 && (
          <input
            type="text"
            placeholder="Kunde suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="archiv-search-input"
          />
        )}
      </div>

      <div className="archiv-grid">
        {filtered.map(k => (
          <div key={k.id} className="archiv-card">
            <div className="archiv-card-top">
              <div className="archiv-card-avatar">
                {k.firstName[0]}{k.lastName[0]}
              </div>
              <div className="archiv-card-info">
                <h3 className="archiv-card-name">{k.firstName} {k.lastName}</h3>
                <p className="archiv-card-contact">{k.email}</p>
                {k.phone && <p className="archiv-card-contact">{k.phone}</p>}
              </div>
            </div>

            <div className="archiv-card-meta">
              Archiviert am {new Date(k.archivedAt).toLocaleDateString('de-AT')}
            </div>

            <div className="archiv-card-actions">
              <button
                className="archiv-btn archiv-btn-restore"
                onClick={() => openConfirm(k.id, 'unarchive')}
              >
                Wiederherstellen
              </button>
              <button
                className="archiv-btn archiv-btn-abschluss"
                onClick={() => openConfirm(k.id, 'abschluss')}
              >
                Abschluss
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !search && (
          <div className="archiv-empty">
            Keine archivierten Kunden vorhanden.
          </div>
        )}
        {filtered.length === 0 && search && (
          <div className="archiv-empty">
            Keine Kunden gefunden.
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmId && confirmAction && confirmKunde && (
        <div className="kunde-modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="kunde-modal" onClick={e => e.stopPropagation()}>
            <div className="kunde-modal-header">
              <h2>{confirmAction === 'abschluss' ? 'Kunde abschliessen?' : 'Kunde wiederherstellen?'}</h2>
              <button className="kunde-modal-close" onClick={() => setConfirmId(null)}>x</button>
            </div>
            <div className="kunde-modal-body">
              {confirmAction === 'abschluss' ? (
                <p>
                  <strong>{confirmKunde.firstName} {confirmKunde.lastName}</strong> wird endgueltig abgeschlossen
                  und verschwindet aus der App. Die Daten bleiben in der Datenbank erhalten.
                </p>
              ) : (
                <p>
                  <strong>{confirmKunde.firstName} {confirmKunde.lastName}</strong> wird wiederhergestellt
                  und erscheint wieder in der Eigenkunden-Liste.
                </p>
              )}
            </div>
            <div className="kunde-modal-footer">
              <button className="kunde-modal-cancel" onClick={() => setConfirmId(null)}>
                Abbrechen
              </button>
              <button
                className={`kunde-modal-submit ${confirmAction === 'abschluss' ? 'archiv-btn-danger' : ''}`}
                onClick={() => confirmAction === 'abschluss'
                  ? handleAbschluss(confirmId)
                  : handleUnarchive(confirmId)
                }
              >
                {confirmAction === 'abschluss' ? 'Abschluss' : 'Wiederherstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
