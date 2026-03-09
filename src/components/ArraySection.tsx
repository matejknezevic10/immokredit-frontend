// src/components/ArraySection.tsx
import React from 'react';
import { FormField } from './FormField';

export interface ArrayColumn {
  field: string;
  label: string;
  type?: string;
  unit?: string;
  half?: boolean;
  placeholder?: string;
}

interface ArraySectionProps {
  title: string;
  items: any;
  columns: ArrayColumn[];
  onChange: (items: any[]) => void;
  defaultItem?: Record<string, any>;
  addLabel?: string;
  minRows?: number;
}

export const ArraySection: React.FC<ArraySectionProps> = ({
  title, items, columns, onChange, defaultItem = {}, addLabel = '+ Hinzufügen', minRows = 0,
}) => {
  const safeItems: any[] = Array.isArray(items) && items.length > 0 ? items : [{ ...defaultItem }];

  const updateItem = (index: number, field: string, value: any) => {
    const updated = safeItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const addItem = () => onChange([...safeItems, { ...defaultItem }]);

  const removeItem = (index: number) => {
    if (safeItems.length <= minRows) return;
    onChange(safeItems.filter((_, i) => i !== index));
  };

  // Group columns into rows: half+half pairs, or full-width singles
  const rows: ArrayColumn[][] = [];
  let i = 0;
  while (i < columns.length) {
    if (columns[i].half && i + 1 < columns.length && columns[i + 1].half) {
      rows.push([columns[i], columns[i + 1]]);
      i += 2;
    } else {
      rows.push([columns[i]]);
      i += 1;
    }
  }

  return (
    <div className="kf-section">
      <h3 className="kf-section-title">{title}</h3>
      {safeItems.map((item, rowIdx) => (
        <div key={rowIdx} className="kf-array-row">
          <div className="kf-array-row-header">
            <span className="kf-array-row-num">#{rowIdx + 1}</span>
            {safeItems.length > minRows && (
              <button type="button" className="kf-array-remove-btn" onClick={() => removeItem(rowIdx)}>
                Entfernen
              </button>
            )}
          </div>
          {rows.map((rowCols, rIdx) => (
            rowCols.length === 2 ? (
              <div key={rIdx} className="kf-row">
                {rowCols.map((col) => (
                  <FormField
                    key={col.field}
                    label={col.label}
                    field={`${rowIdx}_${col.field}`}
                    type={col.type || 'text'}
                    unit={col.unit}
                    half
                    placeholder={col.placeholder}
                    value={item[col.field]}
                    onChange={(_, v) => updateItem(rowIdx, col.field, v)}
                  />
                ))}
              </div>
            ) : (
              <FormField
                key={rowCols[0].field}
                label={rowCols[0].label}
                field={`${rowIdx}_${rowCols[0].field}`}
                type={rowCols[0].type || 'text'}
                unit={rowCols[0].unit}
                half={rowCols[0].half}
                placeholder={rowCols[0].placeholder}
                value={item[rowCols[0].field]}
                onChange={(_, v) => updateItem(rowIdx, rowCols[0].field, v)}
              />
            )
          ))}
        </div>
      ))}
      <button type="button" className="kf-array-add-btn" onClick={addItem}>
        {addLabel}
      </button>
    </div>
  );
};
