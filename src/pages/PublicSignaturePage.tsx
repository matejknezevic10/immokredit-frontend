// src/pages/PublicSignaturePage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const PublicSignaturePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'signed' | 'error' | 'expired'>('loading');
  const [leadInfo, setLeadInfo] = useState<{ leadId: string; name: string; email: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (status !== 'ready') return;
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
  }, [status]);

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

  const submitSignature = async () => {
    if (!hasSignature || !canvasRef.current || !leadInfo) return;
    setSaving(true);
    try {
      const signatureBase64 = canvasRef.current.toDataURL('image/png');
      await axios.post(`${API_BASE}/signature-public/sign/${token}`, {
        signatureBase64,
        signerName: leadInfo.name,
      });
      setStatus('signed');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
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
