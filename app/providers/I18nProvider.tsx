'use client';
import { ReactNode, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'vi';

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
