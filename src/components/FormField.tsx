// src/components/FormField.tsx
// Shared form field component — defined at module level to prevent
// React focus-loss caused by inline component re-creation on every render.
import React, { useEffect, useRef } from 'react';

interface FormFieldProps {
  label: string;
  field: string;
  type?: string;
  placeholder?: string;
  unit?: string;
  half?: boolean;
  required?: boolean;
  value: any;
  error?: string;
  touched?: boolean;
  highlighted?: boolean;
  onChange: (field: string, value: any) => void;
  onBlur?: (field: string) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  label, field, type = 'text', placeholder = '', unit = '', half = false,
  required = false, value, error, touched, highlighted = false, onChange, onBlur,
}) => {
  const hasError = touched && error;
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && fieldRef.current) {
      fieldRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the input after scroll
      setTimeout(() => {
        const input = fieldRef.current?.querySelector('input, textarea') as HTMLElement;
        if (input) input.focus();
      }, 400);
    }
  }, [highlighted]);

  return (
    <div
      ref={fieldRef}
      className={`kf-field ${half ? 'kf-half' : ''} ${highlighted ? 'kf-field-highlighted' : ''}`}
      data-field={field}
    >
      <label className="kf-label">
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        {highlighted && <span style={{ color: '#f59e0b', marginLeft: 6, fontSize: '11px', fontWeight: 600 }}>← Pflichtfeld</span>}
      </label>
      <div className={unit ? 'kf-input-unit' : ''}>
        {type === 'textarea' ? (
          <textarea
            className={`kf-input kf-textarea ${hasError ? 'kf-input-error' : ''} ${highlighted ? 'kf-input-highlight' : ''}`}
            value={value || ''}
            onChange={e => onChange(field, e.target.value)}
            onBlur={onBlur ? () => onBlur(field) : undefined}
            placeholder={placeholder}
          />
        ) : type === 'boolean' ? (
          <div className="kf-toggle">
            <button type="button" className={`kf-toggle-btn ${value === true ? 'active' : ''}`} onClick={() => onChange(field, true)}>Ja</button>
            <button type="button" className={`kf-toggle-btn ${value === false ? 'active' : ''}`} onClick={() => onChange(field, false)}>Nein</button>
          </div>
        ) : (
          <input
            className={`kf-input ${hasError ? 'kf-input-error' : ''} ${highlighted ? 'kf-input-highlight' : ''}`}
            type={type}
            value={value ?? ''}
            onChange={e => onChange(field, type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
            onBlur={onBlur ? () => onBlur(field) : undefined}
            placeholder={placeholder}
          />
        )}
        {unit && <span className="kf-unit">{unit}</span>}
      </div>
      {hasError && <div className="kf-error">{error}</div>}
    </div>
  );
};
