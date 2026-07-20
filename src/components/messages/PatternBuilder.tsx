import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { MessagePattern, FieldSelector } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

const FIELD_OPTIONS = [
  { value: 'amount', label: 'Amount', color: 'bg-green-500/30 text-green-300 border-green-500/40' },
  { value: 'type', label: 'Type (credit/debit)', color: 'bg-red-500/30 text-red-300 border-red-500/40' },
  { value: 'account_number', label: 'Account Number', color: 'bg-blue-500/30 text-blue-300 border-blue-500/40' },
  { value: 'date', label: 'Date', color: 'bg-amber-500/30 text-amber-300 border-amber-500/40' },
  { value: 'balance', label: 'Balance', color: 'bg-purple-500/30 text-purple-300 border-purple-500/40' },
  { value: 'bank_name', label: 'Bank Name', color: 'bg-cyan-500/30 text-cyan-300 border-cyan-500/40' },
  { value: 'merchant', label: 'Merchant', color: 'bg-pink-500/30 text-pink-300 border-pink-500/40' },
];

const MSG_TYPES = [
  { value: 'transaction', label: 'Transaction' },
  { value: 'otp', label: 'OTP' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'balance', label: 'Balance Update' },
  { value: 'custom', label: 'Custom' },
];

function getFieldColor(fieldName: string) {
  return FIELD_OPTIONS.find((f) => f.value === fieldName)?.color || 'bg-white/10 text-white border-white/20';
}

interface TextSelection {
  fieldName: string;
  selectedText: string;
  start: number;
  end: number;
  valueMap: Record<string, string>;
}

function emptyPattern(): Omit<MessagePattern, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: '',
    source_app: null,
    example_sms: '',
    field_selectors: [],
    full_regex: '',
    message_type: 'transaction',
    enabled: true,
  };
}

function HighlightedText({ text, selections }: { text: string; selections: TextSelection[] }) {
  const sorted = [...selections].sort((a, b) => a.start - b.start);
  const parts: { text: string; highlight?: TextSelection }[] = [];
  let lastEnd = 0;

  for (const sel of sorted) {
    if (sel.start <= lastEnd) continue;
    if (sel.start > lastEnd) {
      parts.push({ text: text.slice(lastEnd, sel.start) });
    }
    parts.push({ text: text.slice(sel.start, sel.end), highlight: sel });
    lastEnd = sel.end;
  }
  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd) });
  }

  return (
    <div className="text-sm text-txt-primary font-mono leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        part.highlight ? (
          <mark
            key={i}
            className={`${getFieldColor(part.highlight.fieldName)} rounded px-0.5 border`}
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </div>
  );
}

export default function PatternBuilder() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState<MessagePattern | null>(null);
  const [draft, setDraft] = useState(emptyPattern());
  const [isnew, setIsNew] = useState(false);
  const [selections, setSelections] = useState<TextSelection[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [testSms, setTestSms] = useState('');
  const [testResult, setTestResult] = useState<Record<string, string> | null>(null);
  const [testMatched, setTestMatched] = useState<boolean | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSelection, setEditingSelection] = useState<number | null>(null);

  const startNew = () => {
    setDraft(emptyPattern());
    setIsNew(true);
    setEditing(null);
    setSelections([]);
    setTestSms('');
    setTestResult(null);
    setTestMatched(null);
  };

  const startEdit = (p: MessagePattern) => {
    setDraft({ ...p });
    setEditing(p);
    setIsNew(false);
    const sels: TextSelection[] = p.field_selectors.map((fs) => ({
      fieldName: fs.field_name,
      selectedText: fs.selected_text,
      start: p.example_sms.indexOf(fs.selected_text),
      end: p.example_sms.indexOf(fs.selected_text) + fs.selected_text.length,
      valueMap: fs.value_map,
    })).filter((s) => s.start >= 0);
    setSelections(sels);
    setTestSms('');
    setTestResult(null);
    setTestMatched(null);
  };

  const handleAssignField = (fieldName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const selectedText = draft.example_sms.slice(start, end);
    const valueMap: Record<string, string> = {};

    if (fieldName === 'type') {
      const lower = selectedText.toLowerCase();
      if (lower.includes('debit') || lower.includes('dr')) {
        valueMap[selectedText.toLowerCase()] = 'debit';
      } else if (lower.includes('credit') || lower.includes('cr')) {
        valueMap[selectedText.toLowerCase()] = 'credit';
      } else {
        valueMap[selectedText.toLowerCase()] = selectedText.toLowerCase();
      }
    }

    setSelections((prev) => [...prev, { fieldName, selectedText, start, end, valueMap }]);
  };

  const removeSelection = (idx: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateValueMap = (idx: number, key: string, value: string) => {
    setSelections((prev) => prev.map((s, i) =>
      i === idx ? { ...s, valueMap: { ...s.valueMap, [key]: value } } : s,
    ));
  };

  const addValueMapEntry = (idx: number) => {
    setSelections((prev) => prev.map((s, i) =>
      i === idx ? { ...s, valueMap: { ...s.valueMap, '': '' } } : s,
    ));
  };

  const removeValueMapEntry = (selIdx: number, key: string) => {
    setSelections((prev) => prev.map((s, i) => {
      if (i !== selIdx) return s;
      const newMap = { ...s.valueMap };
      delete newMap[key];
      return { ...s, valueMap: newMap };
    }));
  };

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const generateRegex = () => {
    if (!draft.example_sms || selections.length === 0) return;
    const sorted = [...selections].sort((a, b) => a.start - b.start);
    let regex = '';
    let lastEnd = 0;

    for (const sel of sorted) {
      if (sel.start < lastEnd) continue;
      const before = draft.example_sms.slice(lastEnd, sel.start);
      regex += escapeRegex(before);

      if (['amount', 'balance'].includes(sel.fieldName)) {
        regex += '([\\d,]+\\.?\\d*)';
      } else if (sel.fieldName === 'account_number') {
        regex += '(\\d{4,})';
      } else if (sel.fieldName === 'type' && Object.keys(sel.valueMap).length > 0) {
        const alts = Object.keys(sel.valueMap).map(escapeRegex).join('|');
        regex += `(${alts})`;
      } else {
        regex += '(.+?)';
      }

      lastEnd = sel.end;
    }

    regex += escapeRegex(draft.example_sms.slice(lastEnd));
    regex = regex.replace(/\s+/g, '\\s+').replace(/^\\s\+/, '').replace(/\\s\+$/, '');
    setDraft({ ...draft, full_regex: regex });
  };

  const buildFieldSelectors = (): FieldSelector[] => {
    return selections.map((sel, idx) => ({
      field_name: sel.fieldName,
      field_label: FIELD_OPTIONS.find((f) => f.value === sel.fieldName)?.label || sel.fieldName,
      highlight_color: getFieldColor(sel.fieldName),
      selected_text: sel.selectedText,
      value_map: sel.valueMap,
      regex_group: idx + 1,
      is_static: false,
      static_value: null,
      required: true,
    }));
  };

  const save = () => {
    if (!draft.name || !draft.full_regex) return;
    const fieldSelectors = buildFieldSelectors();
    const now = new Date().toISOString();
    const pattern: MessagePattern = {
      ...draft,
      field_selectors: fieldSelectors,
      ...(isnew
        ? { id: crypto.randomUUID(), created_at: now, updated_at: now }
        : { id: editing!.id, created_at: editing!.created_at, updated_at: now }),
    };

    if (isnew) {
      dispatch({ type: 'ADD_PATTERN', payload: pattern });
    } else {
      dispatch({ type: 'UPDATE_PATTERN', payload: pattern });
    }
    setEditing(null);
    setIsNew(false);
    setDraft(emptyPattern());
    setSelections([]);
  };

  const remove = (id: string) => {
    dispatch({ type: 'REMOVE_PATTERN', payload: id });
    if (editing?.id === id) {
      setEditing(null);
      setDraft(emptyPattern());
      setSelections([]);
    }
  };

  const toggleEnabled = (p: MessagePattern) => {
    dispatch({ type: 'UPDATE_PATTERN', payload: { ...p, enabled: !p.enabled } });
  };

  const runTest = () => {
    if (!testSms || !draft.full_regex) return;
    try {
      const regex = new RegExp(draft.full_regex, 'i');
      const match = testSms.match(regex);
      if (!match) {
        setTestMatched(false);
        setTestResult(null);
        return;
      }
      setTestMatched(true);
      const fields: Record<string, string> = {};
      const sels = selections;
      sels.forEach((sel, idx) => {
        const captured = match[idx + 1]?.trim() || '';
        if (Object.keys(sel.valueMap).length > 0) {
          const lower = captured.toLowerCase();
          fields[sel.fieldName] = sel.valueMap[lower] || sel.valueMap[captured] || captured;
        } else {
          fields[sel.fieldName] = captured;
        }
      });
      setTestResult(fields);
    } catch {
      setTestMatched(false);
      setTestResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-txt-secondary">
          {state.message_patterns.length} pattern{state.message_patterns.length !== 1 ? 's' : ''} saved
        </p>
        <Button variant="primary" size="sm" onClick={startNew}>
          + New Pattern
        </Button>
      </div>

      {state.message_patterns.length === 0 && !editing && !isnew && (
        <Card className="p-6 text-center">
          <p className="text-txt-secondary text-sm">No patterns yet. Create one to start matching bank SMS.</p>
        </Card>
      )}

      <div className="space-y-2">
        {state.message_patterns.map((p) => (
          <Card key={p.id} className="p-4 flex items-center gap-4">
            <button
              onClick={() => toggleEnabled(p)}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${p.enabled ? 'bg-brand' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${p.enabled ? 'translate-x-5' : ''}`} />
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEdit(p)}>
              <div className="text-sm font-medium text-txt-primary truncate">{p.name}</div>
              <div className="text-xs text-txt-secondary">
                {MSG_TYPES.find((t) => t.value === p.message_type)?.label || p.message_type}
                {p.source_app ? ` · ${p.source_app}` : ''}
                {' · '}
                {p.field_selectors.length} field{p.field_selectors.length !== 1 ? 's' : ''}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>Edit</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} className="text-red-400 hover:text-red-300">
              Del
            </Button>
          </Card>
        ))}
      </div>

      {(editing || isnew) && (
        <Card className="p-6 space-y-5">
          <h4 className="text-base font-bold text-txt-primary">
            {isnew ? 'New Pattern' : `Edit: ${editing?.name}`}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-txt-secondary mb-1">Pattern Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. HDFC Bank SMS"
                className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50"
              />
            </div>
            <div>
              <label className="block text-xs text-txt-secondary mb-1">Message Type</label>
              <select
                value={draft.message_type}
                onChange={(e) => setDraft({ ...draft, message_type: e.target.value as MessagePattern['message_type'] })}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary outline-none focus:border-brand/50"
              >
                {MSG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-txt-secondary mb-1">Source App (optional)</label>
            <input
              type="text"
              value={draft.source_app || ''}
              onChange={(e) => setDraft({ ...draft, source_app: e.target.value || null })}
              placeholder="e.g. com.hdfcbank"
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-secondary/50 outline-none focus:border-brand/50"
            />
          </div>

          <div>
            <label className="block text-xs text-txt-secondary mb-1">Step 1: Paste Example SMS</label>
            <textarea
              ref={textareaRef}
              value={draft.example_sms}
              onChange={(e) => {
                setDraft({ ...draft, example_sms: e.target.value });
                setSelections([]);
              }}
              placeholder="Paste a bank SMS here, then select text to assign fields..."
              rows={4}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 resize-none"
            />
          </div>

          {draft.example_sms && (
            <div>
              <label className="block text-xs text-txt-secondary mb-2">
                Step 2: Select text above, then pick a field
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELD_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleAssignField(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80 ${f.color}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-txt-secondary/50 mt-1">
                Highlight text in the SMS box, then click a field button to assign it
              </p>
            </div>
          )}

          {selections.length > 0 && (
            <div>
              <label className="block text-xs text-txt-secondary mb-2">Assigned Fields</label>

              <div className="mb-3">
                <HighlightedText text={draft.example_sms} selections={selections} />
              </div>

              <div className="space-y-3">
                {selections.map((sel, idx) => (
                  <div key={idx} className="bg-white/[0.03] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getFieldColor(sel.fieldName)}`}>
                        {FIELD_OPTIONS.find((f) => f.value === sel.fieldName)?.label || sel.fieldName}
                      </span>
                      <span className="text-xs text-txt-primary font-mono">"{sel.selectedText}"</span>
                      <span className="text-xs text-txt-secondary">→ group #{idx + 1}</span>
                      <div className="flex-1" />
                      {sel.fieldName === 'type' && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingSelection(editingSelection === idx ? null : idx)}>
                          Values
                        </Button>
                      )}
                      <button onClick={() => removeSelection(idx)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>

                    {sel.fieldName === 'type' && editingSelection === idx && (
                      <div className="ml-4 space-y-1.5 border-l-2 border-border-subtle pl-3">
                        <p className="text-xs text-txt-secondary">Value mappings (text → output):</p>
                        {Object.entries(sel.valueMap).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-xs text-txt-primary font-mono w-20 truncate">"{key}"</span>
                            <span className="text-xs text-txt-secondary">→</span>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateValueMap(idx, key, e.target.value)}
                              className="bg-white/[0.04] border border-border-subtle rounded px-2 py-1 text-xs text-txt-primary w-20 outline-none focus:border-brand/50"
                            />
                            <button onClick={() => removeValueMapEntry(idx, key)} className="text-red-400 text-xs">✕</button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => addValueMapEntry(idx)}>+ Add value</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-txt-secondary">Step 3: Generated Regex</label>
              <Button variant="ghost" size="sm" onClick={generateRegex} disabled={selections.length === 0}>
                Generate
              </Button>
            </div>
            <textarea
              value={draft.full_regex}
              onChange={(e) => setDraft({ ...draft, full_regex: e.target.value })}
              placeholder="Click 'Generate' or type regex manually..."
              rows={2}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-xs text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 resize-none"
            />
          </div>

          <div className="border-t border-border-subtle pt-4">
            <label className="text-xs text-txt-secondary mb-1 block">Step 4: Test Pattern</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testSms}
                onChange={(e) => setTestSms(e.target.value)}
                placeholder="Paste another SMS to test..."
                className="flex-1 bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50"
              />
              <Button variant="secondary" size="sm" onClick={runTest} disabled={!draft.full_regex || !testSms}>
                Test
              </Button>
            </div>
            {testMatched === false && (
              <p className="text-xs text-red-400 mt-2">No match found</p>
            )}
            {testMatched === true && testResult && (
              <div className="mt-2 space-y-1 bg-white/[0.03] rounded-lg p-3">
                <p className="text-xs text-green-400 mb-1">Match found!</p>
                {Object.entries(testResult).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-txt-secondary">{k}:</span>
                    <span className="text-txt-primary font-mono">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" size="sm" onClick={save} disabled={!draft.name || !draft.full_regex}>
              {isnew ? 'Create Pattern' : 'Save Changes'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setIsNew(false); setDraft(emptyPattern()); setSelections([]); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Pattern">
        <p className="text-sm text-txt-secondary mb-4">
          Delete pattern "{state.message_patterns.find((p) => p.id === deleteId)?.name}"?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (deleteId) remove(deleteId); setDeleteId(null); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
