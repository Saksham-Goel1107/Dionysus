import { Metadata } from 'next';
import VercelDeploymentsClient from './VercelDeploymentsClient';

export const metadata: Metadata = {
  title: 'Vercel Deployments - Admin Dashboard',
  description: 'Manage and monitor Vercel deployments',
};

export default function VercelDeploymentsPage() {
  return <VercelDeploymentsClient />;
}
