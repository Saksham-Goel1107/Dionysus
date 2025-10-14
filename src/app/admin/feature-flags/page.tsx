import { Metadata } from 'next';
import ConfigCatClient from './ConfigCatClient';

export const metadata: Metadata = {
  title: 'Feature Flags Management | Admin',
  description: 'Manage ConfigCat feature flags',
};

export default function ConfigCatManagementPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Feature Flags Management</h1>
        <p className="mt-2 text-muted-foreground">
          Manage all ConfigCat feature flags and settings from here
        </p>
      </div>
      <ConfigCatClient />
    </div>
  );
}
