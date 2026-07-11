import AppBar from '@/components/AppBar';
import ConsentGuard from '@/components/ConsentGuard';
import AppSessionTracker from '@/components/AppSessionTracker';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBar />
      <ConsentGuard />
      {/* Time-in-app tracking: one session for the whole signed-in app. */}
      <AppSessionTracker />
      {children}
    </>
  );
}
