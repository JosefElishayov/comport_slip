'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { getMessages, type Messages } from '@/i18n';
import { getDirection, type Locale } from '@/lib/locale';
import { getClient } from '@/lib/brainerce';

interface LocaleContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // Keep the client SDK in sync with the active locale so every storefront
  // data request carries the right Accept-Language header. Done during render
  // (before child effects fire) so the first product/store fetch is localized.
  getClient().setLocale(locale);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: getDirection(locale),
      messages: getMessages(locale),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}

/** Active message bundle for the current locale. */
export function useLocaleMessages(): Messages {
  return useLocale().messages;
}
