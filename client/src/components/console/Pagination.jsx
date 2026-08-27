import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500 font-mono">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
