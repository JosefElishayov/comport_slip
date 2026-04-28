'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface ProductShareButtonProps {
  path: string;
  title: string;
  shareText?: string | null;
  imageUrl?: string | null;
  className?: string;
  iconOnly?: boolean;
}

export function ProductShareButton({
  path,
  title,
  shareText,
  imageUrl,
  className,
  iconOnly = false,
}: ProductShareButtonProps) {
  const t = useTranslations('productDetail');
  const [sharing, setSharing] = useState(false);
  const [feedback, setFeedback] = useState<'shared' | 'copied' | 'error' | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function toPlainText(value: string) {
    const text = value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return text;
  }

  function clampText(value: string, maxLength: number) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trimEnd()}...`;
  }

  function guessMimeType(url: string) {
    const normalizedUrl = url.split('?')[0].toLowerCase();
    if (normalizedUrl.endsWith('.png')) return 'image/png';
    if (normalizedUrl.endsWith('.webp')) return 'image/webp';
    if (normalizedUrl.endsWith('.gif')) return 'image/gif';
    if (normalizedUrl.endsWith('.avif')) return 'image/avif';
    return 'image/jpeg';
  }

  function guessFileExtension(mimeType: string) {
    switch (mimeType) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      case 'image/avif':
        return 'avif';
      default:
        return 'jpg';
    }
  }

  async function buildImageFile() {
    if (!imageUrl) return null;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch share image: ${response.status}`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || guessMimeType(imageUrl);
    const extension = guessFileExtension(mimeType);
    const safeName = title
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .toLowerCase() || 'product';

    return new File([blob], `${safeName}.${extension}`, { type: mimeType });
  }

  async function handleShare() {
    if (sharing) return;

    const shareUrl = new URL(path, window.location.origin).toString();
    const cleanedText = shareText ? clampText(toPlainText(shareText), 220) : title;
    const sharePayload = [cleanedText, shareUrl].filter(Boolean).join('\n');

    try {
      setSharing(true);

      if (navigator.share) {
        const shareData: ShareData = {
          title,
          text: cleanedText,
          url: shareUrl,
        };

        if (imageUrl) {
          try {
            const imageFile = await buildImageFile();
            if (imageFile && (!navigator.canShare || navigator.canShare({ files: [imageFile] }))) {
              shareData.files = [imageFile];
            }
          } catch {
            // Ignore image-share failures and fall back to text/url sharing.
          }
        }

        await navigator.share(shareData);
        setFeedback('shared');
        return;
      }

      await navigator.clipboard.writeText(sharePayload);
      setFeedback('copied');
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return;

      try {
        await navigator.clipboard.writeText(sharePayload);
        setFeedback('copied');
      } catch {
        setFeedback('error');
      }
    } finally {
      setSharing(false);
    }
  }

  const feedbackLabel =
    feedback === 'shared'
      ? t('shared')
      : feedback === 'copied'
        ? t('linkCopied')
        : feedback === 'error'
          ? t('shareFailed')
          : null;

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className={cn(
          'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-xs font-semibold text-foreground transition-all duration-300 hover:border-primary/25 hover:bg-primary/5 hover:text-primary disabled:cursor-wait disabled:opacity-70',
          iconOnly && 'w-10 px-0'
        )}
        aria-label={t('shareProduct')}
        title={t('shareProduct')}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.2 10.9l7.6-4.8M8.2 13.1l7.6 4.8"
          />
        </svg>
        {!iconOnly && <span>{t('shareProduct')}</span>}
      </button>

      {feedbackLabel && (
        <span className="pointer-events-none absolute -top-9 start-0 rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-sm">
          {feedbackLabel}
        </span>
      )}
    </div>
  );
}
