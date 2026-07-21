import type { MessagePattern } from '../types';

export interface MatchResult {
  pattern: MessagePattern;
  fields: Record<string, string>;
}

export function runPatterns(
  text: string,
  patterns: MessagePattern[],
): MatchResult | null {
  for (const pattern of patterns) {
    if (!pattern.enabled || !pattern.full_regex) continue;

    try {
      const regex = new RegExp(pattern.full_regex, 'i');
      const match = text.match(regex);
      if (!match) continue;

      const fields: Record<string, string> = {};
      for (const sel of pattern.field_selectors) {
        if (sel.is_static) {
          fields[sel.field_name] = sel.static_value || '';
          continue;
        }
        if (sel.regex_group <= 0 || match[sel.regex_group] === undefined) continue;

        const captured = match[sel.regex_group].trim();
        const lowerCaptured = captured.toLowerCase();

        if (Object.keys(sel.value_map).length > 0) {
          const resolved = sel.value_map[lowerCaptured]
            || sel.value_map[captured]
            || Object.entries(sel.value_map).find(([k]) => lowerCaptured.includes(k.toLowerCase()))?.[1]
            || captured;
          fields[sel.field_name] = resolved;
        } else {
          fields[sel.field_name] = captured;
        }
      }
      return { pattern, fields };
    } catch {
      continue;
    }
  }
  return null;
}

export function autoDetectTxType(
  text: string,
  explicitType?: string,
): 'credit' | 'debit' {
  if (explicitType) {
    const lower = explicitType.toLowerCase();
    if (['credit', 'credited', 'cr', '+'].includes(lower)) return 'credit';
    if (['debit', 'debited', 'dr', '-'].includes(lower)) return 'debit';
  }
  const lower = text.toLowerCase();
  if (/\bcredit(?:ed)?\b|\bCR\b|\+/.test(lower)) return 'credit';
  return 'debit';
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function generalizeStaticText(text: string): string {
  let clean = escapeRegex(text);
  // Replace unselected standard dates (e.g. 09-07-26, 09/07/2026) with generic regex matcher
  clean = clean.replace(/\b\d{2}[-/]\d{2}[-/]\d{2,4}\b/g, '\\d{2}[-/]\\d{2}[-/]\\d{2,4}');
  clean = clean.replace(/\b\d{2}[-/][A-Za-z]{3,}[-/]\d{2,4}\b/g, '\\d{2}[-/][A-Za-z]{3,}[-/]\\d{2,4}');
  
  // Replace unselected numbers (length >= 4, e.g. UPI refs, help lines, account tokens) with \d+
  clean = clean.replace(/\b\d{4,}\b/g, '\\d+');
  
  return clean;
}

interface TextSelection {
  fieldName: string;
  selectedText: string;
  start: number;
  end: number;
}

export function generateRegexFromSelections(
  exampleSms: string,
  selections: TextSelection[],
): string {
  const sorted = [...selections].sort((a, b) => a.start - b.start);
  let regex = '';
  let lastEnd = 0;

  for (const sel of sorted) {
    if (sel.start < lastEnd) continue;

    const before = exampleSms.slice(lastEnd, sel.start);
    regex += generalizeStaticText(before);

    if (['amount', 'balance'].includes(sel.fieldName)) {
      regex += '([\\d,]+\\.?\\d*)';
    } else if (sel.fieldName === 'account_number') {
      regex += '(\\d{4,})';
    } else {
      regex += '(.+?)';
    }

    lastEnd = sel.end;
  }

  regex += generalizeStaticText(exampleSms.slice(lastEnd));
  regex = regex.replace(/\s+/g, '\\s+').replace(/^\\s\+/, '').replace(/\\s\+$/, '');

  return regex;
}
