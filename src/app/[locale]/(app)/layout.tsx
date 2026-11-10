import AppBar from '@/components/AppBar';
import ConsentGuard from '@/components/ConsentGuard';
import AppSessionTracker from '@/components/AppSessionTracker';
import LoyLoginPopupMount from '@/components/loykrathong/LoyLoginPopupMount';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBar />
      <ConsentGuard />
      {/* Time-in-app tracking: one session for the whole signed-in app. */}
      <AppSessionTracker />
      {/* Seasonal (Loy Krathong, until 25 Nov): once per user per day. */}
      <LoyLoginPopupMount />
      {children}
    </>
  );
}
