import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api, { apiErrorMessage } from '../../lib/api';
import Card, { CardTitle } from '../../components/console/Card';
import Button from '../../components/console/Button';
import Input, { Label } from '../../components/console/Input';
import Select from '../../components/console/Select';
import { pageEnter } from '../../lib/motion';

export default function OrgSettings() {
  const queryClient = useQueryClient();
  const { data: org } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get('/api/organization').then((r) => r.data.organization),
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (org) setForm({ name: org.name, settings: org.settings });
  }, [org]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.patch('/api/organization', payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['organization'] }); toast.success('Settings saved'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!form) return null;

  return (
    <motion.div {...pageEnter} className="max-w-xl">
      <h1 className="text-3xl md:text-4xl font-black text-white mb-8">Organization settings</h1>

      <Card className="space-y-5 mb-6" animate={false}>
        <CardTitle>General</CardTitle>
        <div>
          <Label htmlFor="org-name">Organization name</Label>
          <Input id="org-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
      </Card>

      <Card className="space-y-5 mb-6" animate={false}>
        <CardTitle>Defaults for new exams</CardTitle>
        <div>
          <Label htmlFor="default-duration">Default duration (minutes)</Label>
          <Input
            id="default-duration"
            type="number"
            mono
            value={form.settings.defaultExamDuration}
            onChange={(e) => setForm((f) => ({ ...f, settings: { ...f.settings, defaultExamDuration: Number(e.target.value) } }))}
          />
        </div>
        <div>
          <Label htmlFor="default-visibility">Default result visibility</Label>
          <Select
            id="default-visibility"
            value={form.settings.resultVisibility}
            onChange={(e) => setForm((f) => ({ ...f, settings: { ...f.settings, resultVisibility: e.target.value } }))}
          >
            <option value="immediate" className="bg-gray-900">Immediately after submitting</option>
            <option value="after_close" className="bg-gray-900">After the exam closes</option>
            <option value="never" className="bg-gray-900">Never shown to participants</option>
          </Select>
        </div>
      </Card>

      <Button variant="marker" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving...' : 'Save settings'}
      </Button>
    </motion.div>
  );
}
