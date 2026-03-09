// src/components/TagInput.tsx
import React, { useState } from 'react';

interface TagInputProps {
  label: string;
  tags: any;
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label, tags, onChange, placeholder = 'Eingabe + Enter',
}) => {
  const [input, setInput] = useState('');
  const safeTags: string[] = Array.isArray(tags) ? tags : [];

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !safeTags.includes(trimmed)) {
      onChange([...safeTags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(safeTags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  return (
    <div className="kf-field">
      <label className="kf-label">{label}</label>
      {safeTags.length > 0 && (
        <div className="kf-tags-container">
          {safeTags.map((tag, i) => (
            <span key={i} className="kf-tag">
              {tag}
              <button type="button" className="kf-tag-remove" onClick={() => removeTag(i)}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="kf-tag-input-row">
        <input
          className="kf-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button type="button" className="kf-tag-add-btn" onClick={addTag}>+</button>
      </div>
    </div>
  );
};
