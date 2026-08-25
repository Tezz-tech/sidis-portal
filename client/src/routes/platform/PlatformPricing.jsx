import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Card, { CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Label } from '../../components/ui/Input';
import { pageEnter } from '../../lib/motion';

export default function PlatformPricing() {
  const queryClient = useQueryClient();
  const { data: pricing } = useQuery({
    queryKey: ['platform-pricing'],
    queryFn: () => api.get('/api/platform/pricing').then((r) => r.data.pricing),
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (pricing) setForm(pricing);
  }, [pricing]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/api/platform/pricing', payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-pricing'] }); toast.success('Pricing updated'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!form) return null;

  const updatePack = (index, patch) => {
    setForm((f) => ({ ...f, packs: f.packs.map((p, i) => (i === index ? { ...p, ...patch } : p)) }));
  };

  const removePack = (index) => setForm((f) => ({ ...f, packs: f.packs.filter((_, i) => i !== index) }));
  const addPack = () => setForm((f) => ({ ...f, packs: [...f.packs, { name: 'New pack', credits: 100, priceKobo: 500000, isActive: true }] }));

  return (
    <motion.div {...pageEnter} className="max-w-2xl">
      <h1 className="font-display text-page-title text-ink mb-8">Pricing</h1>

      <Card className="space-y-4 mb-6">
        <CardTitle>Rates</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rate-gen">Credits per question generated</Label>
            <Input id="rate-gen" type="number" mono min={0} step={0.1} value={form.creditsPerQuestionGenerated} onChange={(e) => setForm((f) => ({ ...f, creditsPerQuestionGenerated: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="rate-grade">Credits per short answer graded</Label>
            <Input id="rate-grade" type="number" mono min={0} step={0.1} value={form.creditsPerShortAnswerGraded} onChange={(e) => setForm((f) => ({ ...f, creditsPerShortAnswerGraded: Number(e.target.value) }))} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle>Credit packs</CardTitle>
          <Button variant="secondary" size="sm" onClick={addPack}><Plus size={14} strokeWidth={1.5} /> Add pack</Button>
        </div>
        <div className="space-y-4">
          {form.packs.map((pack, i) => (
            <div key={pack._id || i} className="grid grid-cols-[1fr_100px_140px_auto] gap-3 items-end">
              <div>
                <Label htmlFor={`pack-name-${i}`}>Name</Label>
                <Input id={`pack-name-${i}`} value={pack.name} onChange={(e) => updatePack(i, { name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor={`pack-credits-${i}`}>Credits</Label>
                <Input id={`pack-credits-${i}`} type="number" mono value={pack.credits} onChange={(e) => updatePack(i, { credits: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor={`pack-price-${i}`}>Price (kobo)</Label>
                <Input id={`pack-price-${i}`} type="number" mono value={pack.priceKobo} onChange={(e) => updatePack(i, { priceKobo: Number(e.target.value) })} />
              </div>
              <button type="button" onClick={() => removePack(i)} className="p-2 rounded-chip text-graphite hover:text-fail hover:bg-fail/5 mb-0.5">
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="marker" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving...' : 'Save pricing'}
      </Button>
    </motion.div>
  );
}
