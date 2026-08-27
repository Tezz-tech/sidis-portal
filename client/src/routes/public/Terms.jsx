import { motion } from 'framer-motion';
import { pageEnter } from '../../lib/motion';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const EFFECTIVE_DATE = 'August 27, 2026';

export default function Terms() {
  useDocumentTitle('Terms of Service — Sidis');

  return (
    <motion.div {...pageEnter} className="bg-gradient-to-b from-gray-950 to-black py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-12">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <p>
            These terms govern your use of Sidis ("Sidis," "we," "us"), an AI-assisted platform for building,
            delivering, and grading exams. By creating a workspace or otherwise using Sidis, you agree to
            them.
            <br />
            <em className="text-gray-400">
              This is a standard starting-point agreement, not a substitute for legal advice — have it
              reviewed before relying on it for compliance purposes.
            </em>
          </p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">The service</h2>
            <p>
              Sidis lets an organization upload documents, generate exam questions from them using AI, invite
              participants to take timed exams, and review AI-assisted grading and results. Credits purchased
              through the platform are consumed by question generation and short-answer grading.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Accounts</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You're responsible for keeping your account credentials secure and for activity that happens under your account.</li>
              <li>An organization admin is responsible for the participants and team members they invite, and for the accuracy of the data supplied about them.</li>
              <li>We may suspend an account that we reasonably believe is being used fraudulently, abusively, or in violation of these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Upload content you don't have the right to use, or that's unlawful, infringing, or harmful.</li>
              <li>Attempt to disrupt, reverse-engineer, or gain unauthorized access to the service.</li>
              <li>Use Sidis to administer an exam in a way that violates the rights of the people taking it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">AI-generated content</h2>
            <p>
              Exam questions, grading decisions, and reasoning produced by Sidis are generated with the help
              of third-party AI models. While we aim for accuracy, AI output can be wrong — organizations are
              responsible for reviewing generated questions and grading overrides before relying on them for
              anything consequential (pass/fail decisions, certifications, employment, or academic outcomes).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Payments and credits</h2>
            <p>
              Credits are purchased through our payment provider, Paystack, and consumed as you generate
              questions and grade short-answer responses. Purchases are generally non-refundable except where
              required by law or at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Termination</h2>
            <p>
              You may stop using Sidis at any time. We may suspend or terminate access for a violation of
              these terms, with notice where practical. On termination, an organization may request an export
              or deletion of its data as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Disclaimers and liability</h2>
            <p>
              Sidis is provided "as is," without warranties of any kind, express or implied. To the fullest
              extent permitted by law, Sidis is not liable for indirect, incidental, or consequential damages
              arising from use of the service, including decisions made based on AI-generated grading.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Governing law</h2>
            <p>
              These terms are governed by the laws of the Federal Republic of Nigeria, without regard to
              conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Changes to these terms</h2>
            <p>
              We may update these terms as the product changes. Material changes will be reflected by
              updating the effective date above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>
              Questions about these terms can be sent to{' '}
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
