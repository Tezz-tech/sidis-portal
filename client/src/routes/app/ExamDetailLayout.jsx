import { useParams, useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';

const STATUS_VARIANT = { draft: 'neutral', generating: 'marker', review: 'marker', published: 'ink', closed: 'neutral' };
const STATUS_LABEL = { draft: 'Draft', generating: 'Generating', review: 'In review', published: 'Published', closed: 'Closed' };

// A single shell around every exam-scoped page (Questions, Settings,
// Invitations, Live monitor, Results) so a creator can move between them
// from anywhere instead of only reaching whichever one ExamsList happened
// to link to — previously those were six disconnected top-level pages with
// no way to get from one to another short of editing the URL by hand.
export default function ExamDetailLayout() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => api.get(`/api/exams/${examId}`).then((r) => r.data.exam),
  });

  const isDraftStage = exam && (exam.status === 'draft' || exam.status === 'generating');

  const tabs = [
    { to: 'generate', label: 'Generate', show: isDraftStage },
    { to: 'review', label: 'Questions' },
    { to: 'settings', label: 'Settings' },
    { to: 'invitations', label: 'Invitations', show: !isDraftStage },
    { to: 'monitor', label: 'Live monitor', show: !isDraftStage },
    { to: 'results', label: 'Results', show: !isDraftStage },
  ].filter((t) => t.show !== false);

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/app/exams')}
        className="inline-flex items-center gap-1.5 text-small text-graphite hover:text-ink transition-colors duration-micro mb-4"
      >
        <ArrowLeft size={14} strokeWidth={1.5} /> All exams
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-page-title text-ink truncate">{exam?.title}</h1>
        {exam && <Badge variant={STATUS_VARIANT[exam.status] || 'neutral'}>{STATUS_LABEL[exam.status] || exam.status}</Badge>}
      </div>

      <nav className="flex gap-1 border-b border-rule mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={`/app/exams/${examId}/${tab.to}`}
            className={({ isActive }) =>
              clsx(
                'px-4 py-2.5 text-body whitespace-nowrap border-b-2 -mb-px transition-colors duration-micro',
                isActive ? 'border-ink text-ink' : 'border-transparent text-graphite hover:text-ink',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
