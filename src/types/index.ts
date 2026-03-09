// src/types/index.ts

export enum AmpelStatus {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum Temperatur {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export enum DealStage {
  NEUER_LEAD = 'NEUER_LEAD',
  QUALIFIZIERT = 'QUALIFIZIERT',
  UNTERLAGEN_SAMMELN = 'UNTERLAGEN_SAMMELN',
  UNTERLAGEN_VOLLSTAENDIG = 'UNTERLAGEN_VOLLSTAENDIG',
  BANK_ANFRAGE = 'BANK_ANFRAGE',
  WARTEN_AUF_ZUSAGE = 'WARTEN_AUF_ZUSAGE',
  ZUSAGE_ERHALTEN = 'ZUSAGE_ERHALTEN',
  ABGESCHLOSSEN = 'ABGESCHLOSSEN',
  VERLOREN = 'VERLOREN',
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  amount?: number;
  message?: string;
  pipedrivePersonId?: number;
  pipedriveDealId?: number;
  ampelStatus: AmpelStatus;
  temperatur: Temperatur;
  score: number;
  kaufwahrscheinlichkeit?: number;
  isKunde?: boolean;
  assignedToId?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  leadId: string;
  lead?: Lead;
  pipedriveDealId: number;
  title: string;
  value: number;
  stage: DealStage;
  kaufzeitpunkt?: string;
  eigenmittel?: string;
  immobilieStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  leadId: string;
  filename: string;
  originalFilename: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  googleDriveId?: string;
  googleDriveUrl?: string;
  extractedData?: Record<string, any>;
  uploadedAt: string;
}

export enum DocumentType {
  AUSWEIS = 'AUSWEIS',
  REISEPASS = 'REISEPASS',
  MELDEZETTEL = 'MELDEZETTEL',
  GEHALTSABRECHNUNG = 'GEHALTSABRECHNUNG',
  STEUERBESCHEID = 'STEUERBESCHEID',
  ARBEITSVERTRAG = 'ARBEITSVERTRAG',
  GRUNDBUCHAUSZUG = 'GRUNDBUCHAUSZUG',
  ENERGIEAUSWEIS = 'ENERGIEAUSWEIS',
  KAUFVERTRAG = 'KAUFVERTRAG',
  EXPOSE = 'EXPOSE',
  SONSTIGES = 'SONSTIGES',
}

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  description?: string;
  data?: Record<string, any>;
  createdAt: string;
}

export enum ActivityType {
  LEAD_CREATED = 'LEAD_CREATED',
  DEAL_CREATED = 'DEAL_CREATED',
  DEAL_UPDATED = 'DEAL_UPDATED',
  DEAL_MOVED = 'DEAL_MOVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  WHATSAPP_SENT = 'WHATSAPP_SENT',
  WHATSAPP_RECEIVED = 'WHATSAPP_RECEIVED',
  EMAIL_SENT = 'EMAIL_SENT',
  NOTE_ADDED = 'NOTE_ADDED',
  WORKFLOW_TRIGGERED = 'WORKFLOW_TRIGGERED',
}

export interface Stats {
  totalLeads: number;
  greenLeads: number;
  yellowLeads: number;
  redLeads: number;
  activeDeals: number;
  automationsToday: number;
}

export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  amount?: number;
  message?: string;
}

export interface UpdateLeadDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
  amount?: number;
  ampelStatus?: AmpelStatus;
  temperatur?: Temperatur;
  score?: number;
  kaufwahrscheinlichkeit?: number;
}

export interface PipelineStageData {
  stage: DealStage;
  title: string;
  icon: string;
  deals: Deal[];
}
