// src/components/Leads/EditLeadModal.tsx
import React, { useState, useEffect } from 'react';
import { Lead, UpdateLeadDto, AmpelStatus, Temperatur } from '@/types';
import './LeadModal.css';

interface EditLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateLeadDto) => Promise<void>;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSubmit,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateLeadDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    amount: undefined,
    ampelStatus: AmpelStatus.YELLOW,
    temperatur: Temperatur.WARM,
    score: 0,
    kaufwahrscheinlichkeit: undefined,
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        amount: lead.amount,
        ampelStatus: lead.ampelStatus,
        temperatur: lead.temperatur,
        score: lead.score,
        kaufwahrscheinlichkeit: lead.kaufwahrscheinlichkeit,
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsLoading(true);
    try {
      await onSubmit(lead.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: 
        name === 'amount' || name === 'score' || name === 'kaufwahrscheinlichkeit'
          ? (value ? Number(value) : undefined)
          : value,
    }));
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Lead bearbeiten</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Basic Info */}
            <div className="form-section">
              <h3 className="form-section-title">Kontaktinformationen</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vorname *</label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-input"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nachname *</label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-input"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">E-Mail *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefon *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quelle *</label>
                  <select
                    name="source"
                    className="form-input"
                    value={formData.source}
                    onChange={handleChange}
                    required
                  >
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Empfehlung">Empfehlung</option>
                    <option value="Sonstiges">Sonstiges</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Finanzierungssumme</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            {/* Scoring & Status */}
            <div className="form-section">
              <h3 className="form-section-title">Qualifikation & Status</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ampel Status</label>
                  <select
                    name="ampelStatus"
                    className="form-input"
                    value={formData.ampelStatus}
                    onChange={handleChange}
                  >
                    <option value={AmpelStatus.GREEN}>🟢 Grün</option>
                    <option value={AmpelStatus.YELLOW}>🟡 Gelb</option>
                    <option value={AmpelStatus.RED}>🔴 Rot</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Temperatur</label>
                  <select
                    name="temperatur"
                    className="form-input"
                    value={formData.temperatur}
                    onChange={handleChange}
                  >
                    <option value={Temperatur.HOT}>🔥 Heiß</option>
                    <option value={Temperatur.WARM}>🌤 Warm</option>
                    <option value={Temperatur.COLD}>❄️ Kalt</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Score (0-100)</label>
                  <input
                    type="number"
                    name="score"
                    className="form-input"
                    value={formData.score}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kaufwahrscheinlichkeit (%)</label>
                  <input
                    type="number"
                    name="kaufwahrscheinlichkeit"
                    className="form-input"
                    value={formData.kaufwahrscheinlichkeit || ''}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <div>
                <strong>Erstellt:</strong> {new Date(lead.createdAt).toLocaleString('de-DE')}
                {lead.pipedrivePersonId && (
                  <>
                    <br />
                    <strong>Pipedrive Person ID:</strong> {lead.pipedrivePersonId}
                  </>
                )}
                {lead.pipedriveDealId && (
                  <>
                    <br />
                    <strong>Pipedrive Deal ID:</strong> {lead.pipedriveDealId}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Speichere...
                </>
              ) : (
                '💾 Änderungen speichern'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
