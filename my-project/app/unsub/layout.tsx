export default function UnsubLayout({ children }: { children: React.ReactNode }) {
  // This layout intentionally avoids the global AuthGuard and AppSidebar
  // so public recipients can access unsubscribe functionality without login.
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-xl mx-auto py-12 px-4">
        {children}
      </main>
    </div>
  );
}
