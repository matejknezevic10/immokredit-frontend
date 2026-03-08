// src/pages/Documents/types.ts

export interface Document {
  id: number;
  customer_id: number | null;
  email_from: string | null;
  email_subject: string | null;
  email_received_at: string | null;
  email_message_id: string | null;
  filename: string;
  file_type: string | null;
  file_size: number | null;
  document_type: string | null;
  ocr_status: string;
  ocr_error: string | null;
  ocr_processed_at: string | null;
  assignment_method: string | null;
  assignment_confidence: number | null;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  ocr_data?: OcrField[];
  created_at: string;
  updated_at: string;
}

export interface OcrField {
  field_name: string;
  field_value: string;
  field_type: string;
  confidence: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Stats {
  total_documents: string;
  completed: string;
  processing: string;
  pending: string;
  failed: string;
  assigned: string;
  unassigned: string;
  gehaltszettel: string;
  kontoauszug: string;
  kaufvertrag: string;
  grundbuchauszug: string;
  sonstiges: string;
}

export interface UploadResult {
  id?: number;
  filename: string;
  documentType?: string;
  documentTypeLabel?: string;
  fields?: Record<string, any>;
  confidence?: number;
  error?: string;
}
