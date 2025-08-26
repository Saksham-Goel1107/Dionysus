import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alpha Support Center | Dionysus',
  description:
    'Exclusive support center for alpha and beta testers of Dionysus - Your AI Github Assistant',
  robots: {
    index: false, // Don't index this page as it's for alpha testers only
    follow: false,
  },
};

export default function AlphaHelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
