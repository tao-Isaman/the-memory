import AppBar from '@/components/AppBar';
import ConsentGuard from '@/components/ConsentGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBar />
      <ConsentGuard />
      {children}
    </>
  );
}
