// src/pages/PublicSignaturePage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const REQUIRED_CHECKBOXES = [
  {
    id: 'documents',
    label: 'Erhalt der Unterlagen',
    text: 'Ich bestätige, dass ich die oben angeführten Dokumente (Zustimmungserklärung, Haushaltsrechnung, Kreditlaufzeit-Info, Bestätigung Liegenschaftsangaben und Standardinformation) vollständig erhalten und gelesen habe.',
  },
  {
    id: 'household',
    label: 'Richtigkeit der Haushaltsrechnung',
    text: 'Ich bestätige, dass alle Angaben in der Haushaltsrechnung (Einnahmen/Ausgaben) wahrheitsgetreu sind und keine weiteren wesentlichen finanziellen Verpflichtungen bestehen.',
  },
  {
    id: 'pension',
    label: 'Besonderer Hinweis: Laufzeit bis in die Pension',
    text: 'Ich nehme zur Kenntnis, dass die geplante Kreditlaufzeit bis in das Pensionsalter reicht und habe die damit verbundenen Risiken der Einkommensreduktion verstanden.',
  },
  {
    id: 'dsgvo',
    label: 'Datenschutz & Banken-Weitergabe (DSGVO)',
    text: 'Ich willige ein, dass meine Daten zum Zweck der Kreditprüfung an potenzielle Bankpartner übermittelt werden dürfen (gemäß der Datenschutzerklärung).',
    link: { text: 'Datenschutzerklärung', url: 'https://immo-kredit.app/datenschutz' },
  },
  {
    id: 'electronic',
    label: 'Elektronische Kommunikation',
    text: 'Ich stimme zu, dass die weitere Korrespondenz und Dokumentenübermittlung im Rahmen der Kreditvermittlung auf elektronischem Weg (App/E-Mail) erfolgt.',
  },
];

export const PublicSignaturePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'signed' | 'error' | 'expired'>('loading');
  const [leadInfo, setLeadInfo] = useState<{ leadId: string; name: string; email: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);

  // Checkbox states
  const [checkedBoxes, setCheckedBoxes] = useState<Record<string, boolean>>({
    documents: false,
    household: false,
    pension: false,
    dsgvo: false,
    electronic: false,
  });

  const allChecked = REQUIRED_CHECKBOXES.every(cb => checkedBoxes[cb.id]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/signature-public/verify/${token}`)
      .then(res => {
        setLeadInfo(res.data);
        setStatus('ready');
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Fehler beim Laden';
        setErrorMsg(msg);
        setStatus(err.response?.status === 410 ? 'expired' : 'error');
      });
  }, [token]);

  useEffect(() => {
    if (status !== 'ready' || !allChecked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [status, allChecked]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
  };

  const toggleCheckbox = (id: string) => {
    setCheckedBoxes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const submitSignature = async () => {
    if (!hasSignature || !canvasRef.current || !leadInfo || !allChecked) return;
    setSaving(true);
    try {
      const signatureBase64 = canvasRef.current.toDataURL('image/png');
      await axios.post(`${API_BASE}/signature-public/sign/${token}`, {
        signatureBase64,
        signerName: leadInfo.name,
        confirmedCheckboxes: Object.entries(checkedBoxes)
          .filter(([, v]) => v)
          .map(([k]) => k),
      });
      setStatus('signed');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '640px', width: '100%', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>ImmoKredit</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Digitale Unterschrift</p>
        </div>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Lade...</div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10060;</div>
            <p style={{ color: '#ef4444', fontWeight: 600 }}>{errorMsg}</p>
          </div>
        )}

        {status === 'expired' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#8987;</div>
            <p style={{ color: '#f59e0b', fontWeight: 600 }}>{errorMsg}</p>
            <p style={{ color: '#64748b', marginTop: '8px' }}>Bitte kontaktieren Sie Ihren Berater.</p>
          </div>
        )}

        {status === 'ready' && leadInfo && (
          <>
            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
              <p style={{ fontWeight: 600, color: '#1e293b' }}>{leadInfo.name}</p>
              <p style={{ color: '#64748b', fontSize: '14px' }}>{leadInfo.email}</p>
            </div>

            {/* Checkboxes Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span> Bitte bestätigen Sie folgende Punkte:
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {REQUIRED_CHECKBOXES.map((cb) => (
                  <label
                    key={cb.id}
                    onClick={() => toggleCheckbox(cb.id)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '14px',
                      background: checkedBoxes[cb.id] ? '#f0fdf4' : '#fafafa',
                      border: `2px solid ${checkedBoxes[cb.id] ? '#22c55e' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: `2px solid ${checkedBoxes[cb.id] ? '#22c55e' : '#cbd5e1'}`,
                      background: checkedBoxes[cb.id] ? '#22c55e' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      transition: 'all 0.2s',
                    }}>
                      {checkedBoxes[cb.id] && (
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>✓</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                        {cb.label}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                        {cb.link ? (
                          <>
                            {cb.text.split(cb.link.text)[0]}
                            <a
                              href={cb.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'underline' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {cb.link.text}
                            </a>
                            {cb.text.split(cb.link.text)[1]}
                          </>
                        ) : (
                          cb.text
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Progress indicator */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  flex: 1,
                  height: '4px',
                  background: '#e2e8f0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(Object.values(checkedBoxes).filter(Boolean).length / REQUIRED_CHECKBOXES.length) * 100}%`,
                    height: '100%',
                    background: allChecked ? '#22c55e' : '#2563eb',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {Object.values(checkedBoxes).filter(Boolean).length}/{REQUIRED_CHECKBOXES.length}
                </span>
              </div>
            </div>

            {/* Signature Section - only visible when all checkboxes are checked */}
            {allChecked ? (
              <>
                <p style={{ color: '#475569', fontSize: '14px', marginBottom: '12px' }}>
                  Bitte unterschreiben Sie im Feld unten, um Ihre Daten zu bestätigen.
                </p>

                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                  <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '200px', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                  {!hasSignature && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: '16px' }}>
                      Hier unterschreiben...
                    </div>
                  )}
                </div>

                {/* Date & Time */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#64748b',
                }}>
                  <span>Datum: {dateStr}</span>
                  <span>Uhrzeit: {timeStr}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={clearCanvas}
                    disabled={saving}
                    style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 500, color: '#475569' }}
                  >
                    Löschen
                  </button>
                  <button
                    onClick={submitSignature}
                    disabled={!hasSignature || saving}
                    style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '8px', background: hasSignature ? '#2563eb' : '#94a3b8', color: 'white', cursor: hasSignature ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                  >
                    {saving ? 'Speichern...' : 'Unterschrift bestätigen'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                background: '#fafafa',
                borderRadius: '12px',
                border: '2px dashed #e2e8f0',
                color: '#94a3b8',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
                <p style={{ fontWeight: 600, fontSize: '14px' }}>
                  Bitte bestätigen Sie zuerst alle {REQUIRED_CHECKBOXES.length} Punkte oben,<br />
                  um die Unterschrift freizuschalten.
                </p>
              </div>
            )}

            {errorMsg && (
              <p style={{ color: '#ef4444', marginTop: '12px', textAlign: 'center', fontSize: '14px' }}>{errorMsg}</p>
            )}
          </>
        )}

        {status === 'signed' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9989;</div>
            <p style={{ color: '#22c55e', fontWeight: 600, fontSize: '18px' }}>Unterschrift erfolgreich gespeichert!</p>
            <p style={{ color: '#64748b', marginTop: '8px' }}>Vielen Dank. Sie können dieses Fenster nun schließen.</p>
          </div>
        )}
      </div>
    </div>
  );
};
