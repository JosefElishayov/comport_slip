'use client';

import { useState } from 'react';
import type { CheckoutCustomFieldDefinition } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface CustomFieldsStepProps {
  fields: CheckoutCustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onApply: () => void;
  onUploadFile?: (file: File) => Promise<{ url: string; key: string }>;
  loading?: boolean;
  className?: string;
  hideSubmit?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

export function CustomFieldsStep({
  fields,
  values,
  onChange,
  onApply,
  onUploadFile,
  loading = false,
  className,
  hideSubmit = false,
}: CustomFieldsStepProps) {
  const t = useTranslations('checkout');
  const [uploadingKeys, setUploadingKeys] = useState<Set<string>>(new Set());

  const isMissing = fields.some((f) => {
    if (!f.required) return false;
    const v = values[f.key];
    return v === undefined || v === null || v === '';
  });

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-muted-foreground text-sm">{t('customFieldsSubtitle')}</p>

      {fields.map((field) => {
        const value = values[field.key];
        const labelEl = (
          <label
            htmlFor={`cf-${field.key}`}
            className="text-foreground mb-1 block text-sm font-medium"
          >
            {field.name}
            {field.required && <span className="text-destructive ms-1">*</span>}
          </label>
        );
        const helpEl = field.description ? (
          <p className="text-muted-foreground mt-1 text-xs">{field.description}</p>
        ) : null;

        switch (field.type as string) {
          case 'TEXT':
            return (
              <div key={field.key}>
                {labelEl}
                <input
                  id={`cf-${field.key}`}
                  type="text"
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                  minLength={field.minLength ?? undefined}
                  maxLength={field.maxLength ?? undefined}
                  className="border-border bg-background text-foreground w-full rounded border px-3 py-2 text-sm"
                />
                {helpEl}
              </div>
            );

          case 'TEXTAREA':
            return (
              <div key={field.key}>
                {labelEl}
                <textarea
                  id={`cf-${field.key}`}
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                  minLength={field.minLength ?? undefined}
                  maxLength={field.maxLength ?? undefined}
                  rows={3}
                  className="border-border bg-background text-foreground w-full rounded border px-3 py-2 text-sm"
                />
                {helpEl}
              </div>
            );

          case 'NUMBER':
            return (
              <div key={field.key}>
                {labelEl}
                <input
                  id={`cf-${field.key}`}
                  type="number"
                  value={(value as number | string) ?? ''}
                  onChange={(e) =>
                    onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required={field.required}
                  min={field.minValue ?? undefined}
                  max={field.maxValue ?? undefined}
                  className="border-border bg-background text-foreground w-full rounded border px-3 py-2 text-sm"
                />
                {helpEl}
              </div>
            );

          case 'BOOLEAN':
            return (
              <div key={field.key} className="flex items-start gap-2">
                <input
                  id={`cf-${field.key}`}
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`cf-${field.key}`}
                    className="text-foreground text-sm font-medium"
                  >
                    {field.name}
                    {field.required && <span className="text-destructive ms-1">*</span>}
                  </label>
                  {helpEl}
                </div>
              </div>
            );

          case 'SELECT':
            return (
              <div key={field.key}>
                {labelEl}
                <select
                  id={`cf-${field.key}`}
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                  className="border-border bg-background text-foreground w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">{t('customFieldsSelectPlaceholder')}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {helpEl}
              </div>
            );

          case 'DATE':
            return (
              <div key={field.key}>
                {labelEl}
                <input
                  id={`cf-${field.key}`}
                  type="date"
                  value={(value as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                  className="border-border bg-background text-foreground w-full rounded border px-3 py-2 text-sm"
                />
                {helpEl}
              </div>
            );

          case 'IMAGE': {
            const isUploading = uploadingKeys.has(field.key);
            return (
              <div key={field.key}>
                {labelEl}
                {value ? (
                  <div className="relative inline-block">
                    <img
                      src={value as string}
                      alt={field.name}
                      className="border-border max-h-32 rounded border object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => onChange(field.key, '')}
                      className="bg-background/80 text-foreground absolute end-1 top-1 rounded-full p-1 text-xs leading-none"
                      aria-label={t('customFieldsImageRemove')}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor={`cf-${field.key}`}
                    className={cn(
                      'border-border flex cursor-pointer flex-col items-center gap-2 rounded border-2 border-dashed p-6 text-center transition-colors',
                      isUploading ? 'opacity-50' : 'hover:border-primary/40',
                    )}
                  >
                    <span className="text-muted-foreground text-sm">
                      {isUploading ? t('customFieldsImageUploading') : t('customFieldsImageUpload')}
                    </span>
                    <input
                      id={`cf-${field.key}`}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES}
                      disabled={isUploading || !onUploadFile}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !onUploadFile) return;
                        if (file.size > MAX_IMAGE_SIZE) {
                          alert(t('customFieldsImageTooLarge'));
                          return;
                        }
                        setUploadingKeys((prev) => new Set(prev).add(field.key));
                        try {
                          const result = await onUploadFile(file);
                          onChange(field.key, result.url);
                        } catch {
                          // Upload failed — user can retry
                        } finally {
                          setUploadingKeys((prev) => {
                            const next = new Set(prev);
                            next.delete(field.key);
                            return next;
                          });
                        }
                      }}
                    />
                  </label>
                )}
                {helpEl}
              </div>
            );
          }

          default:
            return null;
        }
      })}

      {!hideSubmit && (
        <button
          type="button"
          onClick={onApply}
          disabled={loading || isMissing}
          className="bg-primary text-primary-foreground w-full rounded px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t('customFieldsApplying') : t('customFieldsApply')}
        </button>
      )}
    </div>
  );
}
