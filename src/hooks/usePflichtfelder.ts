// src/hooks/usePflichtfelder.ts
// Hook to load pflichtfelder data and determine which fields to highlight as missing
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/services/api';

interface UsePflichtfelderOptions {
  leadId: string | undefined;
  section: 'person' | 'haushalt' | 'finanzplan' | 'objekt';
}

export const usePflichtfelder = ({ leadId, section }: UsePflichtfelderOptions) => {
  const [searchParams] = useSearchParams();
  const showMissing = searchParams.get('showMissing') === 'true';
  const scrollTo = searchParams.get('scrollTo') || '';
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!showMissing || !leadId) return;

    const load = async () => {
      try {
        const res = await api.get(`/kunde/${leadId}/pflichtfelder`);
        const data = res.data;
        const missing = new Set<string>();

        if (section === 'person' && data.person?.personen) {
          // Collect missing fields from all persons
          for (const p of data.person.personen) {
            for (const f of p.missingFields || []) {
              missing.add(f.field);
            }
          }
        } else if (section === 'haushalt') {
          for (const f of data.haushalt?.missingFields || []) {
            missing.add(f.field);
          }
        } else if (section === 'finanzplan') {
          for (const f of data.finanzplan?.missingFields || []) {
            missing.add(f.field);
          }
        } else if (section === 'objekt' && data.objekt?.objekte) {
          for (const o of data.objekt.objekte) {
            for (const f of o.missingFields || []) {
              missing.add(f.field);
            }
          }
        }

        setMissingFields(missing);
      } catch (err) {
        console.error('Failed to load pflichtfelder:', err);
      }
    };

    load();
  }, [leadId, section, showMissing]);

  // Scroll to the specific field after missingFields are loaded
  useEffect(() => {
    if (!scrollTo || !showMissing || scrolledRef.current || missingFields.size === 0) return;
    scrolledRef.current = true;

    // Wait for render then scroll
    setTimeout(() => {
      const el = document.querySelector(`[data-field="${scrollTo}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector('input, textarea') as HTMLElement;
        if (input) setTimeout(() => input.focus(), 400);
      }
    }, 300);
  }, [scrollTo, showMissing, missingFields]);

  const isHighlighted = (field: string): boolean => {
    return showMissing && missingFields.has(field);
  };

  return { isHighlighted, missingFields, showMissing };
};
