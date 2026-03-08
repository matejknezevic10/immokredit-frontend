// src/components/Signature/SignaturePad.tsx
import React, { useRef, useState, useEffect } from 'react';
import api from '@/services/api';
import './SignaturePad.css';

interface SignaturePadProps {
  leadId: string;
  signerName: string;
  onSigned?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ leadId, signerName, onSigned }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Style
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
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

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    setSaved(false);
    setError('');
  };

  const saveSignature = async () => {
    if (!hasSignature || !canvasRef.current) return;
    setSaving(true);
    setError('');

    try {
      const signatureBase64 = canvasRef.current.toDataURL('image/png');
      await api.post('/signature/sign', {
        leadId,
        signatureBase64,
        signerName,
        signerRole: 'kunde',
      });
      setSaved(true);
      onSigned?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="signature-pad-container">
      <div className="signature-pad-header">
        <span className="signature-pad-icon">✍️</span>
        <div>
          <h3 className="signature-pad-title">Digitale Unterschrift</h3>
          <p className="signature-pad-desc">Bitte unterschreiben Sie im Feld unten</p>
        </div>
      </div>

      <div className="signature-pad-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="signature-pad-canvas"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasSignature && (
          <div className="signature-pad-placeholder">
            Hier unterschreiben...
          </div>
        )}
      </div>

      <div className="signature-pad-signer">
        {signerName}
      </div>

      {error && <div className="signature-pad-error">{error}</div>}

      {saved ? (
        <div className="signature-pad-success">
          Unterschrift gespeichert und PDF-Deckblatt generiert
        </div>
      ) : (
        <div className="signature-pad-actions">
          <button className="btn btn-secondary" onClick={clearCanvas} disabled={saving}>
            Löschen
          </button>
          <button
            className="btn btn-primary"
            onClick={saveSignature}
            disabled={!hasSignature || saving}
          >
            {saving ? 'Speichern...' : 'Unterschrift bestätigen'}
          </button>
        </div>
      )}
    </div>
  );
};
