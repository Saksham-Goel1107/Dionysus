import { Metadata } from 'next';
import { Ban } from 'lucide-react';
import { ContentContainer } from '@/components/ui/content-layout';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Access Blocked | Dionysus',
  description: 'Your access to Dionysus has been restricted.',
};

export default async function BlockPage() {
  const cookiesList = await cookies();
  const redirectCookie = cookiesList.get('middleware_redirect');

  if (!redirectCookie) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-900 text-white">
      <ContentContainer>
        <div className="flex justify-center py-16">
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-800/80 p-8 text-center shadow-2xl backdrop-blur-sm">
            <Ban className="mx-auto mb-4 h-10 w-10 text-red-500" />
            <h2 className="mb-4 text-3xl font-extrabold text-red-500">Access Restricted</h2>

            <p className="mb-6 text-lg text-gray-200">
              Your account has been blocked due to system-reported anomalies, suspected fraudulent
              activity, or a manual action by our administrators.
            </p>

            <p className="mb-8 text-sm text-gray-400">
              To continue, please contact our support team or wait while the restriction is
              reviewed. This may be temporary or permanent depending on the findings.
            </p>

            <a
              href="mailto:sakshamgoel1107@gmail.com"
              className="inline-block rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Contact Support
            </a>

            <p className="mt-6 text-xs text-gray-500">
              We take the safety, fairness, and integrity of our platform seriously.
            </p>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
}
