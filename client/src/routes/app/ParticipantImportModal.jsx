import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCsv } from '../../lib/csv';
import api, { apiErrorMessage } from '../../lib/api';
import Modal from '../../components/console/Modal';
import Button from '../../components/console/Button';
import { Label } from '../../components/console/Input';
import Select from '../../components/console/Select';

const FIELDS = [
  { key: 'email', label: 'Email', required: true },
  { key: 'firstName', label: 'First name', required: true },
  { key: 'lastName', label: 'Last name', required: true },
  { key: 'externalId', label: 'External ID', required: false },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function guessColumn(headers, key) {
  const lower = headers.map((h) => h.toLowerCase());
  const idx = lower.findIndex((h) => h.includes(key.toLowerCase()) || (key === 'externalId' && (h.includes('id') || h.includes('matric') || h.includes('staff'))));
  return idx >= 0 ? idx : -1;
}

export default function ParticipantImportModal({ open, onClose, onImported }) {
  const fileInputRef = useRef(null);
  const [headers, setHeaders] = useState(null);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);

  const reset = () => { setHeaders(null); setRows([]); setMapping({}); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast.error('That file has no data rows');
      return;
    }
    const [head, ...body] = parsed;
    setHeaders(head);
    setRows(body);
    const nextMapping = {};
    FIELDS.forEach((f) => {
      const guess = guessColumn(head, f.key);
      if (guess >= 0) nextMapping[f.key] = guess;
    });
    setMapping(nextMapping);
    e.target.value = '';
  };

  const mappedRows = rows.map((row) => ({
    email: (mapping.email != null ? row[mapping.email] : '')?.trim(),
    firstName: (mapping.firstName != null ? row[mapping.firstName] : '')?.trim(),
    lastName: (mapping.lastName != null ? row[mapping.lastName] : '')?.trim(),
    externalId: mapping.externalId != null ? row[mapping.externalId]?.trim() : undefined,
  }));

  const validated = mappedRows.map((r) => ({
    ...r,
    valid: Boolean(r.email && EMAIL_RE.test(r.email) && r.firstName && r.lastName),
  }));
  const validCount = validated.filter((r) => r.valid).length;

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/api/participants/import', { rows: validated.filter((r) => r.valid).map(({ valid, ...r }) => r) });
      toast.success(`Imported ${res.data.created} new and updated ${res.data.updated} existing participants`);
      onImported();
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Import participants"
      size="lg"
      footer={
        headers ? (
          <>
            <Button variant="secondary" onClick={reset}>Choose a different file</Button>
            <Button variant="marker" onClick={handleImport} disabled={validCount === 0 || importing}>
              {importing ? 'Importing...' : `Import ${validCount} participant${validCount === 1 ? '' : 's'}`}
            </Button>
          </>
        ) : null
      }
    >
      {!headers ? (
        <div className="text-center py-10">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          <Upload size={24} strokeWidth={1.75} className="text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Upload a CSV with one row per participant.</p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Choose file</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={`map-${f.key}`}>{f.label}{f.required && ' *'}</Label>
                <Select
                  id={`map-${f.key}`}
                  value={mapping[f.key] ?? ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                >
                  <option value="" className="bg-gray-900">Not mapped</option>
                  {headers.map((h, i) => <option key={i} value={i} className="bg-gray-900">{h}</option>)}
                </Select>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Preview — {validCount} of {rows.length} rows valid
            </p>
            <div className="max-h-64 overflow-y-auto border border-white/10 rounded-2xl">
              <table className="w-full text-sm">
                <tbody>
                  {validated.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-b border-white/10 last:border-0">
                      <td className="px-3 py-2 w-6">
                        {r.valid ? <CheckCircle2 size={14} strokeWidth={1.75} className="text-green-400" /> : <AlertCircle size={14} strokeWidth={1.75} className="text-red-400" />}
                      </td>
                      <td className="px-3 py-2 text-white">{r.firstName} {r.lastName}</td>
                      <td className="px-3 py-2 text-gray-400 font-mono">{r.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
