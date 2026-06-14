'use client';

import { useLocaleMessages } from '@/providers/locale-provider';

/**
 * Brainerce stores variant attribute names and values as plain strings with no
 * translation field (unlike product name/description, which the API localizes).
 * They therefore always come back in the language the merchant typed them — for
 * this store, Hebrew. This hook maps known attribute strings to the active
 * locale via the `attributes` message namespace, falling back to the original
 * string for anything unmapped so new/unknown attributes still render.
 */
export function useAttributeLabel(): (value: string) => string {
  const messages = useLocaleMessages();
  const map = (messages.attributes ?? {}) as Record<string, string>;
  return (value: string) => {
    if (!value) return value;
    return map[value] ?? map[value.trim()] ?? value;
  };
}
