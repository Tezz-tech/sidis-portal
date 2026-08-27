import { Outlet } from 'react-router-dom';

export default function ExamLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <div className="max-w-[720px] mx-auto px-4 py-8 md:py-12">
        <Outlet />
      </div>
    </div>
  );
}
