// src/components/Leads/CreateLeadModal.tsx
import React, { useState, useRef } from 'react';
import { CreateLeadDto } from '@/types';
import api from '@/services/api';
import './LeadModal.css';
import './CreateLeadModal.css';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadDto) => Promise<void>;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLeadDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    amount: undefined,
    message: '',
  });

  // Voice Memo State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSuccess, setVoiceSuccess] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Document Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Voice Memo Functions ──

  const startRecording = async () => {
    setVoiceError(null);
    setVoiceSuccess(null);

    // Check if mediaDevices API is available (requires HTTPS)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError('Mikrofon nicht verfügbar. Bitte stelle sicher, dass du HTTPS verwendest und den Browser aktualisiert hast.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported mimeType (audio/webm not supported on iOS Safari)
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          // Fallback: let browser choose
          mimeType = '';
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError(
          'Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff:\n' +
          '• iPhone/iPad: Einstellungen → Safari → Mikrofon\n' +
          '• Chrome: Klicke auf das 🔒-Symbol in der Adressleiste → Mikrofon erlauben\n' +
          '• Dann Seite neu laden.'
        );
      } else if (err.name === 'NotFoundError') {
        setVoiceError('Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an.');
      } else {
        setVoiceError(`Mikrofon konnte nicht gestartet werden: ${err.message}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setVoiceError(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('audio', audioBlob, 'voicememo.webm');

      const res = await api.post('/leads/voice-memo', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const extracted = res.data.extracted;

      // Fill form fields with extracted data
      setFormData(prev => ({
        ...prev,
        firstName: extracted.firstName || prev.firstName,
        lastName: extracted.lastName || prev.lastName,
        email: extracted.email || prev.email,
        phone: extracted.phone || prev.phone,
        source: extracted.source || prev.source,
        amount: extracted.amount || prev.amount,
        message: extracted.message || prev.message,
      }));

      const filledFields = Object.values(extracted).filter(Boolean).length;
      setVoiceSuccess(`✅ ${filledFields} Felder aus Sprachaufnahme erkannt`);

      // Clear success after 5s
      setTimeout(() => setVoiceSuccess(null), 5000);
    } catch (err: any) {
      console.error('Voice transcription error:', err);
      setVoiceError('Fehler bei der Spracherkennung. Bitte versuche es erneut.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Document Upload Functions ──

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const uploadDocuments = async (leadId: string) => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    let uploaded = 0;

    for (const file of uploadFiles) {
      try {
        setUploadProgress(`Lade hoch: ${file.name} (${uploaded + 1}/${uploadFiles.length})`);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('leadId', leadId);

        await api.post('/documents/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setUploadProgress(`✅ ${uploaded}/${uploadFiles.length} Dokumente hochgeladen`);
    setIsUploading(false);
  };

  // ── Form Submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create lead and get the response with lead ID
      const res = await api.post('/leads', formData);
      const newLeadId = res.data.id;

      // Upload documents if any
      if (uploadFiles.length > 0 && newLeadId) {
        await uploadDocuments(newLeadId);
      }

      // Call parent onSubmit to refresh the list
      // (we already created the lead via API, so just refresh)
      await onSubmit(formData);

      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      source: '',
      amount: undefined,
      message: '',
    });
    setUploadFiles([]);
    setUploadProgress(null);
    setVoiceError(null);
    setVoiceSuccess(null);
    setRecordingTime(0);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? (value ? Number(value) : undefined) : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-create-lead" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Neuer Lead</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* ── Voice Memo Section ── */}
            <div className="voice-memo-section">
              <div className="voice-memo-header">
                <span className="voice-memo-icon">🎙️</span>
                <div>
                  <h4 className="voice-memo-title">Sprachaufnahme</h4>
                  <p className="voice-memo-hint">
                    Diktiere Lead-Daten: Name, Telefon, E-Mail, Betrag...
                  </p>
                </div>
              </div>

              <div className="voice-memo-controls">
                {!isRecording && !isTranscribing && (
                  <button
                    type="button"
                    className="btn-voice btn-voice-start"
                    onClick={startRecording}
                  >
                    🎙️ Aufnahme starten
                  </button>
                )}

                {isRecording && (
                  <div className="voice-recording-active">
                    <div className="voice-recording-indicator">
                      <span className="voice-pulse"></span>
                      <span className="voice-timer">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-voice btn-voice-stop"
                      onClick={stopRecording}
                    >
                      ⏹️ Stopp
                    </button>
                  </div>
                )}

                {isTranscribing && (
                  <div className="voice-transcribing">
                    <span className="loading-spinner"></span>
                    <span>Analysiere Sprachaufnahme...</span>
                  </div>
                )}
              </div>

              {voiceError && <div className="voice-error">{voiceError}</div>}
              {voiceSuccess && <div className="voice-success">{voiceSuccess}</div>}
            </div>

            <div className="form-divider">
              <span>oder manuell eingeben</span>
            </div>

            {/* ── Form Fields ── */}
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

            <div className="form-group">
              <label className="form-label">Telefon *</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="+43 664 123 4567"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quelle *</label>
                <select
                  name="source"
                  className="form-input"
                  value={formData.source}
                  onChange={handleChange}
                  required
                >
                  <option value="">Bitte wählen...</option>
                  <option value="Website">Website</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Empfehlung">Empfehlung</option>
                  <option value="Telefonat">Telefonat</option>
                  <option value="Vor Ort">Vor Ort</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Finanzierungssumme</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  placeholder="250000"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nachricht</label>
              <textarea
                name="message"
                className="form-input"
                rows={3}
                placeholder="Zusätzliche Informationen..."
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            {/* ── Document Upload Section ── */}
            <div className="upload-section">
              <div className="upload-header">
                <span className="upload-icon">📎</span>
                <div>
                  <h4 className="upload-title">Dokumente hochladen</h4>
                  <p className="upload-hint">Ausweis, Lohnzettel, Kontoauszug, etc.</p>
                </div>
              </div>

              <div
                className="upload-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className="upload-dropzone-content">
                  <span className="upload-dropzone-icon">📤</span>
                  <p className="upload-dropzone-text">
                    Dateien hierher ziehen oder <strong>klicken</strong>
                  </p>
                  <p className="upload-dropzone-hint">PDF, JPG, PNG, DOC</p>
                </div>
              </div>

              {/* File List */}
              {uploadFiles.length > 0 && (
                <div className="upload-file-list">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="upload-file-item">
                      <span className="upload-file-icon">
                        {file.type.includes('pdf') ? '📄' :
                         file.type.includes('image') ? '🖼️' : '📃'}
                      </span>
                      <div className="upload-file-info">
                        <span className="upload-file-name">{file.name}</span>
                        <span className="upload-file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        className="upload-file-remove"
                        onClick={() => removeFile(index)}
                        title="Entfernen"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadProgress && (
                <div className="upload-progress">{uploadProgress}</div>
              )}
            </div>

          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { resetForm(); onClose(); }}
              disabled={isLoading || isUploading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || isUploading || isRecording || isTranscribing}
            >
              {isLoading || isUploading ? (
                <>
                  <span className="loading-spinner"></span>
                  {isUploading ? 'Lade hoch...' : 'Erstelle...'}
                </>
              ) : (
                <>✅ Lead erstellen {uploadFiles.length > 0 ? `+ ${uploadFiles.length} Dok.` : ''}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};