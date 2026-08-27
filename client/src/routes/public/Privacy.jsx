import { motion } from 'framer-motion';
import { pageEnter } from '../../lib/motion';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const EFFECTIVE_DATE = 'August 27, 2026';

export default function Privacy() {
  useDocumentTitle('Privacy Policy — Sidis');

  return (
    <motion.div {...pageEnter} className="bg-gradient-to-b from-gray-950 to-black py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <p>
            This policy explains what personal data Sidis ("Sidis," "we," "us") collects, why, and what
            control you have over it. It applies to organizations and staff who use Sidis to build and manage
            exams, and to participants who are invited to take one.
            <br />
            <em className="text-gray-400">
              This is a standard starting-point policy, not a substitute for legal advice — have it reviewed
              before relying on it for compliance purposes.
            </em>
          </p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Who this covers</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Organizations and staff</strong> — the businesses, schools, and individual admins/creators who sign up for a Sidis workspace.</li>
              <li><strong className="text-white">Participants</strong> — the people an organization invites to take an exam through Sidis, who did not sign up directly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">What we collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Account details for staff: name, email, password (stored hashed, never in plain text), and role.</li>
              <li>Participant details supplied by an organization: name, email, and any external ID they choose to attach (e.g. a student or staff number).</li>
              <li>Documents an organization uploads to generate exam questions from, and the questions, answers, and grading results produced from them.</li>
              <li>Exam attempt data: answers, timestamps, and basic integrity signals (tab switches, window focus loss) recorded during a timed attempt.</li>
              <li>Billing information processed by our payment provider, Paystack — Sidis does not receive or store your card details.</li>
              <li>Standard technical data: IP address, browser/device information, and cookies used to keep you signed in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">How we use it</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To operate the product: creating exams, delivering them to participants, timing and grading attempts, and showing results.</li>
              <li>Uploaded documents and exam answers are sent to a third-party AI provider (Google's Gemini models) to generate questions and grade short-answer responses. This processing is limited to what's needed to produce that specific output.</li>
              <li>To process payments through Paystack for credit purchases.</li>
              <li>To send transactional email: invitations, verification codes, password resets, and result notifications.</li>
              <li>To keep the service secure — rate limiting, fraud prevention, and audit logging of sensitive account actions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Cookies</h2>
            <p>
              Sidis uses cookies strictly for authentication — keeping you signed in and protecting your
              session from cross-site request forgery. We don't use advertising or third-party tracking
              cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Data retention</h2>
            <p>
              We keep account and exam data for as long as an organization's workspace is active, plus a
              reasonable period afterward for records and dispute resolution. An organization can request
              deletion of its data at any time — see "Your rights" below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Your rights</h2>
            <p>
              You can request a copy of the personal data we hold about you, or request that it be deleted,
              by contacting us at{' '}
              <a href="mailto:tezzertech@gmail.com" className="text-orange-400 hover:text-orange-300 transition-colors duration-200">
                tezzertech@gmail.com
              </a>. If you're a participant invited to take an exam, this request may need to go through the
              organization that invited you, since they control that invitation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Children's privacy</h2>
            <p>
              Sidis is intended for use by organizations, their staff, and the participants they invite
              (which may include students under the supervision of a school). We don't knowingly collect
              personal data directly from children outside of that organizational context.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Changes to this policy</h2>
            <p>
              We may update this policy as the product changes. Material changes will be reflected by
              updating the effective date above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>
              Questions about this policy can be sent to{' '}
              <a href="mailto:tezzertech@gmail.com" className="text-orange-400 hover:text-orange-300 transition-colors duration-200">
                tezzertech@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
