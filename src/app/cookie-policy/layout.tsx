export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <main className="px-8 pb-8">{children}</main>
    </div>
  );
}
