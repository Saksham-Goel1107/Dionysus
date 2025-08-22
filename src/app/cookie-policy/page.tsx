import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../components/navbar';

export const metadata: Metadata = {
  title: 'Cookie & Privacy Policy | Dionysus',
  description: 'Detailed information about how we use cookies and handle your data.',
};

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-center text-3xl font-bold">Cookie & Privacy Policy</h1>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">🍪 Our Cookie Policy</h2>
          <p className="mb-4">
            At Dionysus, we are committed to full transparency about how we use cookies, analytics,
            AI, and third-party integrations. This policy details every aspect of data collection,
            storage, processing, and sharing for our production SaaS platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">1. Essential Cookies & Authentication</h2>
          <p className="mb-4">
            We use essential cookies to securely authenticate users and enable critical features.
            These cookies are required for the platform to function and include:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              <strong>Session Cookies:</strong> Maintain your login session and user state.
            </li>
            <li>
              <strong>CSRF Tokens:</strong> Protect against cross-site request forgery attacks.
            </li>
            <li>
              <strong>Security Cookies:</strong> Detect and prevent unauthorized access or abuse.
            </li>
            <li>
              <strong>Preference Cookies:</strong> Store your theme, language, and accessibility
              settings.
            </li>
          </ul>
          <p className="mb-4">
            <strong>Provider:</strong> Clerk (Authentication as a Service). Clerk may set its own
            cookies for session management and security. See{' '}
            <a className="text-blue-600 underline" href="https://clerk.com/legal/privacy">
              Clerk Privacy Policy
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">2. Analytics, Monitoring & Performance</h2>
          <p className="mb-4">
            We use analytics and monitoring tools to understand usage patterns, improve reliability,
            and detect issues. Data collected is anonymized and aggregated unless otherwise stated.
          </p>
          <p className="mb-4">
            <strong>Screen Sharing & Session Replay:</strong> By using our service, you grant us
            permission to view your screen and session in real time via Crisp MagicBrowse and
            similar tools for support and troubleshooting purposes. This may include live screen
            sharing and session replays to help resolve your issues. You acknowledge and consent to
            this as a condition of using our platform. <strong>Note:</strong> You may not be
            notified when real time screen viewing or session replay occurs, but by using our
            platform, you provide legal consent for these activities as described.
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              <strong>Session Replays:</strong> Anonymous recordings of user interactions (e.g.,
              clicks, navigation) for UX improvement. No keystrokes in sensitive fields or personal
              data are recorded.
            </li>
            <li>
              <strong>Error & Crash Reports:</strong> Automatic reporting of errors, stack traces,
              and device/browser info to help us fix bugs and improve stability.
            </li>
            <li>
              <strong>Performance Metrics:</strong> Page load times, API response times, and
              resource usage for optimization.
            </li>
          </ul>
          <p className="mb-4">
            <strong>Providers:</strong> Sentry (error monitoring), Vercel Analytics, and potentially
            others. See{' '}
            <a className="text-blue-600 underline" href="https://sentry.io/privacy/">
              Sentry Privacy Policy
            </a>{' '}
            and{' '}
            <a className="text-blue-600 underline" href="https://vercel.com/legal/privacy-policy">
              Vercel Privacy Policy
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">3. AI & Language Model Data Handling</h2>
          <p className="mb-4">
            When you interact with AI features (e.g., chatbots, code generation, or language
            analysis), your prompts and the AI responses may be processed by third-party AI
            providers. For production, we use <strong>LangSmith</strong> (LangChain), and{' '}
            <strong>Google Gemini</strong> for language model inference. Data handling includes:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              <strong>Prompt Logging:</strong> User prompts and AI responses may be logged for
              debugging, quality assurance, and model improvement. Logs are pseudonymized and never
              used for advertising.
            </li>
            <li>
              <strong>Session Context:</strong> Conversation context may be stored temporarily to
              provide coherent multi-turn interactions. Context is cleared after session end or
              after a set retention period.
            </li>
            <li>
              <strong>Provider Data Policies:</strong> See{' '}
              <a className="text-blue-600 underline" href="https://smith.langchain.com/privacy">
                LangSmith Privacy Policy
              </a>
              , and{' '}
              <a className="text-blue-600 underline" href="https://ai.google.dev/privacy">
                Google Gemini Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>PII Handling:</strong> We instruct users not to submit personal or sensitive
              data to AI features. Any accidental PII is filtered and not retained.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">4. Third-Party Integrations & Data Sharing</h2>
          <p className="mb-4">
            We integrate with several third-party services to provide authentication, analytics,
            payments, and other features. Data shared with these providers is limited to what is
            necessary for their function:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              <strong>Authentication:</strong> Clerk (user ID, email, session info)
            </li>
            <li>
              <strong>Error Monitoring:</strong> Sentry (error details, device/browser info,
              anonymized user/session ID)
            </li>
            <li>
              <strong>Analytics:</strong> Vercel Analytics, Google Analytics (aggregated usage data,
              no direct PII)
            </li>
            <li>
              <strong>Payments:</strong> Stripe (if applicable; only when you make a purchase, and
              only necessary billing info)
            </li>
            <li>
              <strong>AI Providers:</strong> LangSmith, Google Gemini (user prompts, context, and
              responses as described above)
            </li>
          </ul>
          <p className="mb-4">
            All providers are contractually required to comply with GDPR, CCPA, and other relevant
            data protection laws. We do not sell or share your data for advertising.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">5. Data Retention & Security</h2>
          <p className="mb-4">
            <strong>Retention:</strong> We retain data only as long as necessary for the purposes
            described above. Session and authentication cookies expire after logout or a set period.
            AI logs and analytics are retained for a limited time (typically 30-90 days) unless
            required for security or compliance.
          </p>
          <p className="mb-4">
            <strong>Security:</strong> All data is encrypted in transit (TLS) and at rest. Access is
            restricted to authorized personnel only. We regularly audit our systems for
            vulnerabilities and compliance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">6. User Rights & Choices</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              Request access to or deletion of your data (contact{' '}
              <Link className="text-blue-500" href={'/support'}>
                Support
              </Link>
              )
            </li>
            <li>Opt out of non-essential cookies and analytics (see your browser settings)</li>
            <li>Request information about third-party data processors</li>
            <li>Withdraw consent at any time (may affect service functionality)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">7. What We Never Do</h2>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              We <strong>never</strong> use cookies for advertising or marketing purposes
            </li>
            <li>
              We <strong>never</strong> sell or share your personal data with third parties for
              their marketing
            </li>
            <li>
              We <strong>never</strong> collect more data than is necessary to provide our services
            </li>
            <li>
              We <strong>never</strong> keep your data for longer than is necessary
            </li>
            <li>
              We <strong>never</strong> use AI logs for profiling or advertising
            </li>
          </ul>
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            <strong>Important:</strong> You are solely responsible for any personal or sensitive
            information you share, submit, or leak anywhere on our platform, including in chats, AI
            prompts, or support sessions, whether or not it was requested. If such information is
            recorded, displayed, or later misused, you acknowledge that you accept all associated
            risks and liabilities. While we commit to upholding the utmost security and privacy
            standards, by using our platform you agree to these terms and release us from liability
            for any user-initiated data disclosure or misuse.
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            8. Third-Party Services & AI Content Disclaimer
          </h2>
          <p className="mb-4">
            By using Dionysus, you acknowledge and agree to the terms and policies of all
            third-party services we integrate with, including but not limited to:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-5">
            <li>
              <strong>Clerk:</strong> Authentication and user management -{' '}
              <a
                className="text-blue-600 underline"
                href="https://clerk.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{' '}
              |{' '}
              <a
                className="text-blue-600 underline"
                href="https://clerk.com/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <strong>Google Gemini AI:</strong> Language model and AI responses -{' '}
              <a
                className="text-blue-600 underline"
                href="https://ai.google.dev/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{' '}
              |{' '}
              <a
                className="text-blue-600 underline"
                href="https://ai.google.dev/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <strong>Sentry:</strong> Error monitoring and performance tracking -{' '}
              <a
                className="text-blue-600 underline"
                href="https://sentry.io/privacy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{' '}
              |{' '}
              <a
                className="text-blue-600 underline"
                href="https://sentry.io/terms/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <strong>Vercel:</strong> Hosting and analytics -{' '}
              <a
                className="text-blue-600 underline"
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{' '}
              |{' '}
              <a
                className="text-blue-600 underline"
                href="https://vercel.com/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <strong>GitHub:</strong> Repository integration and data synchronization -{' '}
              <a
                className="text-blue-600 underline"
                href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{' '}
              |{' '}
              <a
                className="text-blue-600 underline"
                href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <strong>Stripe:</strong> Payment processing (when applicable) -{' '}
              <a
                className="text-blue-600 underline"
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{' '}
              |{' '}
              <a
                className="text-blue-600 underline"
                href="https://stripe.com/legal/ssa"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <strong>Assembly AI:</strong> Speech-to-text transcription services -{' '}
              <a
                className="text-blue-600 underline"
                href="https://www.assemblyai.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>{' '}
              |{' '}
              <a
                className="text-blue-600 underline"
                href="https://www.assemblyai.com/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>
            </li>
          </ul>

          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <h3 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-200">
              ⚠️ AI Content Disclaimer
            </h3>
            <p className="mb-2 text-yellow-700 dark:text-yellow-300">
              <strong>AI-Generated Content Notice:</strong> Our platform utilizes artificial
              intelligence and machine learning models to generate content, responses, and
              suggestions. You acknowledge and understand that:
            </p>
            <ul className="mb-2 list-disc space-y-1 pl-5 text-yellow-700 dark:text-yellow-300">
              <li>AI-generated content may contain inaccuracies, errors, or misinformation</li>
              <li>
                AI responses should not be considered as professional advice (legal, medical,
                financial, etc.)
              </li>
              <li>
                You should verify any AI-generated information before relying on it for important
                decisions
              </li>
              <li>AI models may reflect biases present in their training data</li>
              <li>
                We implement content filters, but AI may occasionally generate inappropriate or
                offensive content
              </li>
            </ul>
            <p className="text-yellow-700 dark:text-yellow-300">
              <strong>Content Responsibility:</strong> Dionysus is not liable for any consequences
              arising from the use of AI-generated content. You use AI features at your own
              discretion and risk.
            </p>
          </div>

          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <h3 className="mb-2 font-semibold text-red-800 dark:text-red-200">
              🚫 Content Restrictions
            </h3>
            <p className="mb-2 text-red-700 dark:text-red-300">
              You agree not to use our AI features to generate or attempt to generate:
            </p>
            <ul className="mb-2 list-disc space-y-1 pl-5 text-red-700 dark:text-red-300">
              <li>Illegal, harmful, or malicious content</li>
              <li>Content that violates intellectual property rights</li>
              <li>Discriminatory, hateful, or harassing content</li>
              <li>Explicit sexual or violent content</li>
              <li>Misleading information intended to deceive or manipulate</li>
              <li>Content that violates any applicable laws or regulations</li>
            </ul>
            <p className="text-red-700 dark:text-red-300">
              Violation of these restrictions may result in immediate suspension or termination of
              your account.
            </p>
          </div>

          <p className="mb-4">
            <strong>Third-Party Liability:</strong> We are not responsible for the actions,
            policies, content, or services of third-party providers. Any issues with third-party
            services should be directed to the respective service provider. By using our platform,
            you agree to hold Dionysus harmless from any claims, damages, or losses arising from
            your use of integrated third-party services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">9. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie & Privacy Policy at any time, for any reason, and reserve the
            right to do so without prior consent or notice to users. You are responsible for
            reviewing this policy periodically and regularly to stay informed of any changes. By
            continuing to use our services after any changes are made, you agree to be bound by the
            updated policy, regardless of whether you have reviewed the changes. Major changes may
            be communicated via email or in-app notification, but this is not guaranteed.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">10. Contact & Support</h2>
          <p className="mb-4">
            If you have any questions, requests, or concerns about our Cookie & Privacy Policy or
            data practices, please contact us at{' '}
            <Link className="text-blue-500" href={'/support'}>
              Support
            </Link>
            .
          </p>
        </section>

        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Last updated: August 22, 2025
          </p>
        </div>
      </div>
    </>
  );
}
