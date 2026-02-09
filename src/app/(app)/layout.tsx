import AppBar from '@/components/AppBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBar />
      {children}
    </>
  );
}
