import type { ReactNode } from "react";

// Every page lives under src/app/[locale]/, and that layout owns <html>/<body> so the
// `lang` attribute can follow the active locale. This root layout exists only because
// Next requires one — it must not render markup of its own.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
