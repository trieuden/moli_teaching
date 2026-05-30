'use client';

import { I18nProvider } from "./providers/I18nProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  );
}
