import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, ClipboardList } from 'lucide-react';
import api, { apiErrorMessage } from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { Table, Thead, Tr, Th, Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input, { Label, FieldError } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { pageEnter } from '../../lib/motion';

const STATUS_VARIANT = { draft: 'neutral', review: 'marker', published: 'ink', closed: 'neutral' };
const STATUS_LABEL = { draft: 'Draft', review: 'In review', published: 'Published', closed: 'Closed' };

export default function ExamsList() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(Boolean(location.state?.newExamDocumentId));
  const [title, setTitle] = useState('');
  const [documentId, setDocumentId] = useState(location.state?.newExamDocumentId || '');
  const [titleError, setTitleError] = useState('');

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => api.get('/api/exams').then((r) => r.data.exams),
  });

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/api/documents').then((r) => r.data.documents),
    enabled: modalOpen,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/exams', payload).then((r) => r.data.exam),
    onSuccess: (exam) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setModalOpen(false);
      navigate(`/app/exams/${exam._id}/generate`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleCreate = () => {
    if (!title.trim()) {
      setTitleError('Give this exam a title');
      return;
    }
    createMutation.mutate({ title, sourceDocumentId: documentId || undefined });
  };

  const readyDocuments = documents?.filter((d) => d.extractionStatus === 'done') || [];

  return (
    <motion.div {...pageEnter}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-page-title text-ink">Exams</h1>
          <p className="text-body text-graphite mt-1">Every test you have built, in progress or live.</p>
        </div>
        <Button variant="marker" onClick={() => setModalOpen(true)}>
          <Plus size={16} strokeWidth={1.5} /> New exam
        </Button>
      </div>

      {isLoading && <SkeletonRows rows={4} />}

      {!isLoading && exams?.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No exams yet"
          description="Upload a document to create your first one."
          action={<Button variant="marker" onClick={() => setModalOpen(true)}><Plus size={16} strokeWidth={1.5} /> New exam</Button>}
        />
      )}

      {!isLoading && exams?.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Exam</Th>
              <Th>Status</Th>
              <Th numeric>Questions</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {exams.map((exam) => (
              <Tr key={exam._id}>
                <Td>
                  <Link to={examLink(exam)} className="text-ink hover:underline">{exam.title}</Link>
                </Td>
                <Td><Badge variant={STATUS_VARIANT[exam.status]}>{STATUS_LABEL[exam.status]}</Badge></Td>
                <Td numeric mono>{exam.questionCount}</Td>
                <Td className="text-right">
                  <Link to={examLink(exam)} className="text-small text-marker-deep hover:underline">Open</Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New exam"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="marker" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Continue'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <Label htmlFor="exam-title">Exam title</Label>
            <Input id="exam-title" value={title} onChange={(e) => { setTitle(e.target.value); setTitleError(''); }} placeholder="e.g. Onboarding policy quiz" />
            <FieldError>{titleError}</FieldError>
          </div>
          <div>
            <Label htmlFor="exam-document">Source document</Label>
            <Select id="exam-document" value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
              <option value="">No document — add questions manually</option>
              {readyDocuments.map((doc) => (
                <option key={doc._id} value={doc._id}>{doc.originalName}</option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function examLink(exam) {
  if (exam.status === 'draft') return `/app/exams/${exam._id}/generate`;
  if (exam.status === 'review') return `/app/exams/${exam._id}/review`;
  return `/app/exams/${exam._id}/results`;
}
