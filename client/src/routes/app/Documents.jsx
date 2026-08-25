import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { Table, Thead, Tr, Th, Td } from '../../components/ui/Table';
import { pageEnter } from '../../lib/motion';

const STATUS_META = {
  done: { icon: CheckCircle2, label: 'Ready', className: 'text-pass' },
  pending: { icon: Clock, label: 'Reading...', className: 'text-graphite' },
  failed: { icon: XCircle, label: 'Failed', className: 'text-fail' },
};

export default function Documents() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/api/documents').then((r) => r.data.documents),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/api/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't upload that file. Try again."));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-page-title text-ink">Documents</h1>
          <p className="text-body text-graphite mt-1">Upload the source material you want to build a test from.</p>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
        <Button variant="marker" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload size={16} strokeWidth={1.5} /> {uploading ? 'Uploading...' : 'Upload document'}
        </Button>
      </div>

      {isLoading && <SkeletonRows rows={4} />}

      {!isLoading && documents?.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a PDF or Word file to generate your first test from it."
          action={
            <Button variant="marker" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} strokeWidth={1.5} /> Upload document
            </Button>
          }
        />
      )}

      {!isLoading && documents?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Document</Th>
              <Th>Status</Th>
              <Th numeric>Characters</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {documents.map((doc) => {
              const meta = STATUS_META[doc.extractionStatus];
              return (
                <Tr key={doc._id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <FileText size={16} strokeWidth={1.5} className="text-graphite shrink-0" />
                      {doc.originalName}
                    </div>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1.5 text-small ${meta.className}`}>
                      <meta.icon size={14} strokeWidth={1.5} /> {meta.label}
                    </span>
                  </Td>
                  <Td numeric mono>{doc.charCount ? doc.charCount.toLocaleString() : '—'}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc.extractionStatus === 'done' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate('/app/exams', { state: { newExamDocumentId: doc._id } })}
                        >
                          Create exam
                        </Button>
                      )}
                      <button
                        type="button"
                        aria-label="Delete document"
                        onClick={() => deleteMutation.mutate(doc._id)}
                        className="p-2 rounded-chip text-graphite hover:text-fail hover:bg-fail/5 transition-colors duration-micro"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </motion.div>
  );
}
