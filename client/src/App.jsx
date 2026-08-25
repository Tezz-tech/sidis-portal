import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './routes/public/PublicLayout';
import Landing from './routes/public/Landing';
import Pricing from './routes/public/Pricing';
import RequestWorkspace from './routes/public/RequestWorkspace';
import Login from './routes/public/Login';
import AcceptInvite from './routes/public/AcceptInvite';
import ForgotPassword from './routes/public/ForgotPassword';
import ResetPassword from './routes/public/ResetPassword';

import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './routes/app/AdminLayout';
import Dashboard from './routes/app/Dashboard';
import Documents from './routes/app/Documents';
import ExamsList from './routes/app/ExamsList';
import GenerateQuestions from './routes/app/GenerateQuestions';
import QuestionReview from './routes/app/QuestionReview';
import ExamSettings from './routes/app/ExamSettings';
import Participants from './routes/app/Participants';
import Invitations from './routes/app/Invitations';
import LiveMonitor from './routes/app/LiveMonitor';
import Results from './routes/app/Results';
import ResultDetail from './routes/app/ResultDetail';
import Billing from './routes/app/Billing';
import BillingCallback from './routes/app/BillingCallback';
import Team from './routes/app/Team';
import OrgSettings from './routes/app/OrgSettings';

import PlatformLayout from './routes/platform/PlatformLayout';
import Organizations from './routes/platform/Organizations';
import OrganizationDetail from './routes/platform/OrganizationDetail';
import PlatformPricing from './routes/platform/PlatformPricing';
import Payments from './routes/platform/Payments';

import ExamLayout from './routes/exam/ExamLayout';
import InviteLanding from './routes/exam/InviteLanding';
import VerifyCode from './routes/exam/VerifyCode';
import Instructions from './routes/exam/Instructions';
import Runner from './routes/exam/Runner';
import Submitted from './routes/exam/Submitted';
import Result from './routes/exam/Result';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/request-workspace" element={<RequestWorkspace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route
        path="/app"
        element={
          <ProtectedRoute roles={['org_admin', 'creator']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="exams" element={<ExamsList />} />
        <Route path="exams/:examId/generate" element={<GenerateQuestions />} />
        <Route path="exams/:examId/review" element={<QuestionReview />} />
        <Route path="exams/:examId/settings" element={<ExamSettings />} />
        <Route path="exams/:examId/invitations" element={<Invitations />} />
        <Route path="exams/:examId/monitor" element={<LiveMonitor />} />
        <Route path="exams/:examId/results" element={<Results />} />
        <Route path="exams/:examId/results/:attemptId" element={<ResultDetail />} />
        <Route path="participants" element={<Participants />} />
        <Route path="billing" element={<Billing />} />
        <Route path="billing/callback" element={<BillingCallback />} />
        <Route path="team" element={<Team />} />
        <Route path="settings" element={<OrgSettings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['platform_owner']}>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Organizations />} />
        <Route path="organizations/:id" element={<OrganizationDetail />} />
        <Route path="pricing" element={<PlatformPricing />} />
        <Route path="payments" element={<Payments />} />
      </Route>

      <Route path="/exam" element={<ExamLayout />}>
        <Route path=":token" element={<InviteLanding />} />
        <Route path=":token/verify" element={<VerifyCode />} />
        <Route path=":token/instructions" element={<Instructions />} />
        <Route path=":token/runner" element={<Runner />} />
        <Route path=":token/submitted" element={<Submitted />} />
        <Route path=":token/result" element={<Result />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
