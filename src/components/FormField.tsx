// src/components/FormField.tsx
// Shared form field component — defined at module level to prevent
// React focus-loss caused by inline component re-creation on every render.
import React from 'react';

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
  onChange: (field: string, value: any) => void;
  onBlur?: (field: string) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  label, field, type = 'text', placeholder = '', unit = '', half = false,
  required = false, value, error, touched, onChange, onBlur,
}) => {
  const hasError = touched && error;
  return (
    <div className={`kf-field ${half ? 'kf-half' : ''}`}>
      <label className="kf-label">
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <div className={unit ? 'kf-input-unit' : ''}>
        {type === 'textarea' ? (
          <textarea
            className={`kf-input kf-textarea ${hasError ? 'kf-input-error' : ''}`}
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
            className={`kf-input ${hasError ? 'kf-input-error' : ''}`}
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
