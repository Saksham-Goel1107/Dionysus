'use client';

import dynamic from 'next/dynamic';

const FeedbackForm = dynamic(() => import('@/components/feedback/FeedbackForm'), { ssr: false });

export default function ClientFeedbackForm() {
  return <FeedbackForm />;
}
