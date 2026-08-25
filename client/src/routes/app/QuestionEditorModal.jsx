import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input, { Label, FieldError } from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyQuestion(type = 'mcq') {
  return {
    type,
    prompt: '',
    options: type === 'true_false' ? [{ key: 'A', text: 'True' }, { key: 'B', text: 'False' }] : [{ key: 'A', text: '' }, { key: 'B', text: '' }],
    correctOptionKey: 'A',
    expectedAnswer: '',
    gradingGuidance: '',
    points: 1,
  };
}

export default function QuestionEditorModal({ open, onClose, onSave, initial, saving }) {
  const [form, setForm] = useState(initial || emptyQuestion());
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial || emptyQuestion());
    setError('');
  }, [initial, open]);

  const setType = (type) => {
    if (type === form.type) return;
    setForm((f) => ({ ...emptyQuestion(type), prompt: f.prompt, points: f.points }));
  };

  const updateOption = (key, text) => {
    setForm((f) => ({ ...f, options: f.options.map((o) => (o.key === key ? { ...o, text } : o)) }));
  };

  const addOption = () => {
    const nextKey = OPTION_KEYS.find((k) => !form.options.some((o) => o.key === k));
    if (!nextKey) return;
    setForm((f) => ({ ...f, options: [...f.options, { key: nextKey, text: '' }] }));
  };

  const removeOption = (key) => {
    setForm((f) => ({
      ...f,
      options: f.options.filter((o) => o.key !== key),
      correctOptionKey: f.correctOptionKey === key ? null : f.correctOptionKey,
    }));
  };

  const handleSave = () => {
    if (!form.prompt.trim()) {
      setError('Write the question prompt');
      return;
    }
    if ((form.type === 'mcq' || form.type === 'true_false') && !form.correctOptionKey) {
      setError('Choose the correct option');
      return;
    }
    if (form.type === 'short_answer' && !form.expectedAnswer?.trim()) {
      setError('Provide an expected answer');
      return;
    }
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit question' : 'Add question'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="marker" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save question'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <Label htmlFor="q-type">Type</Label>
          <Select id="q-type" value={form.type} onChange={(e) => setType(e.target.value)}>
            <option value="mcq">Multiple choice</option>
            <option value="true_false">True / false</option>
            <option value="short_answer">Short answer</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="q-prompt">Question</Label>
          <Textarea id="q-prompt" value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))} />
        </div>

        {(form.type === 'mcq' || form.type === 'true_false') && (
          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {form.options.map((opt) => (
                <div key={opt.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, correctOptionKey: opt.key }))}
                    aria-label={`Mark ${opt.key} correct`}
                    className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center text-small font-mono transition-colors duration-micro ${
                      form.correctOptionKey === opt.key ? 'bg-pass border-pass text-paper' : 'border-rule text-graphite'
                    }`}
                  >
                    {opt.key}
                  </button>
                  <Input value={opt.text} onChange={(e) => updateOption(opt.key, e.target.value)} disabled={form.type === 'true_false'} />
                  {form.type === 'mcq' && form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(opt.key)} className="text-pencil hover:text-fail text-small px-2">Remove</button>
                  )}
                </div>
              ))}
            </div>
            {form.type === 'mcq' && form.options.length < 6 && (
              <button type="button" onClick={addOption} className="text-small text-marker-deep hover:underline mt-2">Add option</button>
            )}
          </div>
        )}

        {form.type === 'short_answer' && (
          <>
            <div>
              <Label htmlFor="q-expected">Expected answer</Label>
              <Textarea id="q-expected" value={form.expectedAnswer || ''} onChange={(e) => setForm((f) => ({ ...f, expectedAnswer: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="q-guidance">Grading guidance (optional)</Label>
              <Textarea id="q-guidance" value={form.gradingGuidance || ''} onChange={(e) => setForm((f) => ({ ...f, gradingGuidance: e.target.value }))} placeholder="What should a grader look for to award credit?" />
            </div>
          </>
        )}

        <div className="w-32">
          <Label htmlFor="q-points">Points</Label>
          <Input id="q-points" type="number" min={1} mono value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))} />
        </div>

        <FieldError>{error}</FieldError>
      </div>
    </Modal>
  );
}
