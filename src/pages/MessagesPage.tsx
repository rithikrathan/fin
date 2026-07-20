import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { SmsLog } from '../types';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import { runPatterns } from '../utils/matching';

type Filter = 'all' | 'matched' | 'unmatched' | 'created' | 'dismissed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'matched', label: 'Matched' },
  { value: 'unmatched', label: 'Unmatched' },
  { value: 'created', label: 'Transaction Created' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function MessagesPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [manualText, setManualText] = useState('');

  const filtered = state.sms_logs.filter((log) => {
    if (filter === 'matched') return log.matched && !log.transaction_id && !log.dismissed;
    if (filter === 'unmatched') return !log.matched && !log.dismissed;
    if (filter === 'created') return !!log.transaction_id;
    if (filter === 'dismissed') return log.dismissed;
    return true;
  });

  const addManualMessage = () => {
    if (!manualText.trim()) return;
    const match = runPatterns(manualText, state.message_patterns);
    const log: SmsLog = {
      id: crypto.randomUUID(),
      message_text: manualText.trim(),
      message_source: null,
      timestamp: new Date().toISOString(),
      pattern_id: match?.pattern.id || null,
      matched: !!match,
      parsed_fields: match?.fields || {},
      transaction_id: null,
      dismissed: false,
      notification_id: null,
    };
    dispatch({ type: 'ADD_SMS_LOG', payload: log });
    setManualText('');
    setAddOpen(false);
  };

  const dismiss = (id: string) => {
    const log = state.sms_logs.find((l) => l.id === id);
    if (log) dispatch({ type: 'UPDATE_SMS_LOG', payload: { ...log, dismissed: true } });
  };

  const getPatternName = (patternId: string | null) => {
    if (!patternId) return null;
    return state.message_patterns.find((p) => p.id === patternId)?.name || null;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-txt-primary">Messages</h2>
          <p className="text-sm text-txt-secondary">{state.sms_logs.length} messages processed</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          + Add Message
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-brand/15 text-brand border border-brand/30'
                : 'text-txt-secondary hover:text-txt-primary bg-white/[0.04] border border-transparent'
            }`}
          >
            {f.label}
            {f.value === 'all' && ` (${state.sms_logs.length})`}
            {f.value === 'matched' && ` (${state.sms_logs.filter((l) => l.matched && !l.transaction_id && !l.dismissed).length})`}
            {f.value === 'unmatched' && ` (${state.sms_logs.filter((l) => !l.matched && !l.dismissed).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-txt-secondary text-sm">
            {state.sms_logs.length === 0
              ? 'No messages yet. Add a message manually or receive one from Android.'
              : 'No messages match this filter.'}
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                log.transaction_id ? 'bg-green-400' : log.matched ? 'bg-amber-400' : log.dismissed ? 'bg-txt-secondary/30' : 'bg-red-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-txt-secondary font-mono mb-1">
                  {new Date(log.timestamp).toLocaleString('en-IN')}
                  {log.message_source ? ` · ${log.message_source}` : ''}
                </p>
                <p className="text-sm text-txt-primary whitespace-pre-wrap break-words">{log.message_text}</p>
                {log.matched && log.pattern_id && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded">
                      {getPatternName(log.pattern_id)}
                    </span>
                    {Object.entries(log.parsed_fields).map(([k, v]) => (
                      <span key={k} className="text-xs bg-white/[0.06] text-txt-secondary px-2 py-0.5 rounded">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
                {log.transaction_id && (
                  <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded inline-block mt-1">
                    Transaction created
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {log.matched && !log.transaction_id && !log.dismissed && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/detect/${log.id}`)}
                  >
                    Detect
                  </Button>
                )}
                {!log.dismissed && !log.transaction_id && (
                  <Button variant="ghost" size="sm" onClick={() => dismiss(log.id)} className="text-txt-secondary">
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Message Manually">
        <p className="text-sm text-txt-secondary mb-3">
          Paste a bank SMS or notification text to add it to the log.
        </p>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Paste message text here..."
          rows={4}
          className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3 py-2 text-sm text-txt-primary font-mono placeholder:text-txt-secondary/50 outline-none focus:border-brand/50 resize-none"
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={addManualMessage} disabled={!manualText.trim()}>Add Message</Button>
        </div>
      </Modal>
    </div>
  );
}
