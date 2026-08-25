import { Outlet } from 'react-router-dom';

export default function ExamLayout() {
  return (
    <div className="min-h-screen bg-sheet">
      <div className="max-w-exam mx-auto px-4 py-8 md:py-12">
        <Outlet />
      </div>
    </div>
  );
}
