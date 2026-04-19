
import { messages } from '@/i18n';

type Messages = typeof messages;
type Namespace = keyof Messages;

export function useTranslations<N extends Namespace>(namespace: N) {
  const ns = messages[namespace] as Record<string, string>;
  return function t(key: string, values?: Record<string, string>): string {
    let result = ns[key] || `${String(namespace)}.${key}`;
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        result = result.replace(`{${k}}`, v);
      }
    }
    return result;
  };
}

