// src/pages/Leads/LeadsPage.tsx
import React, { useEffect, useState } from 'react';
import { useLeadsStore } from '@/store/useLeadsStore';
import { LeadsTable } from '@/components/Leads/LeadsTable';
import { CreateLeadModal } from '@/components/Leads/CreateLeadModal';
import { EditLeadModal } from '@/components/Leads/EditLeadModal';
import { JeffreyModal } from '@/components/Leads/JeffreyModal';
import { Lead, CreateLeadDto, UpdateLeadDto } from '@/types';
import './LeadsPage.css';

export const LeadsPage: React.FC = () => {
  const { leads, isLoading, error, fetchLeads, createLead, updateLead, deleteLead } =
    useLeadsStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJeffreyModalOpen, setIsJeffreyModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadForJeffrey, setLeadForJeffrey] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleCreateLead = async (data: CreateLeadDto) => {
    await createLead(data);
  };

  const handleEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (id: string, data: UpdateLeadDto) => {
    await updateLead(id, data);
    setIsEditModalOpen(false);
    setLeadToEdit(null);
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const handleDeleteConfirm = async () => {
    if (leadToDelete) {
      await deleteLead(leadToDelete.id);
      setLeadToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setLeadToDelete(null);
  };

  const handleJeffrey = (lead: Lead) => {
    setLeadForJeffrey(lead);
    setIsJeffreyModalOpen(true);
  };

  // Filter leads based on search
  const filteredLeads = leads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    return (
      lead.firstName.toLowerCase().includes(query) ||
      lead.lastName.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      lead.source.toLowerCase().includes(query)
    );
  });

  return (
    <div className="leads-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">
            {leads.length} {leads.length === 1 ? 'Lead' : 'Leads'} gesamt
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            ➕ Neuer Lead
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="leads-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Suchen nach Name, E-Mail, Telefon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && leads.length === 0 && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Lade Leads...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Fehler beim Laden</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchLeads}>
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <LeadsTable
          leads={filteredLeads}
          onEdit={handleEditLead}
          onDelete={handleDeleteClick}
          onJeffrey={handleJeffrey}
        />
      )}

      {/* Search No Results */}
      {!isLoading && !error && filteredLeads.length === 0 && searchQuery && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Keine Ergebnisse</h3>
          <p>
            Keine Leads gefunden für "{searchQuery}"
          </p>
          <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
            Filter zurücksetzen
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
      />

      {/* Edit Modal */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        lead={leadToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setLeadToEdit(null);
        }}
        onSubmit={handleUpdateLead}
      />

      {/* Jeffrey Modal */}
      <JeffreyModal
        isOpen={isJeffreyModalOpen}
        lead={leadForJeffrey}
        onClose={() => {
          setIsJeffreyModalOpen(false);
          setLeadForJeffrey(null);
        }}
      />

      {/* Delete Confirmation */}
      {leadToDelete && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Lead löschen?</h2>
              <button className="modal-close" onClick={handleDeleteCancel}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Möchtest du den Lead <strong>{leadToDelete.firstName} {leadToDelete.lastName}</strong> wirklich löschen?
              </p>
              <p className="text-secondary">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleDeleteCancel}>
                Abbrechen
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                🗑️ Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};