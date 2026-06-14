'use client';

import { useEffect, useState } from 'react';
import type { ContactFormPublic, ContactFormPublicField } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useLocale } from '@/providers/locale-provider';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

const FORM_KEY = 'main';

type Translate = ReturnType<typeof useTranslations>;
type FieldValue = string | string[] | boolean;

function buildLegacyForm(t: Translate): ContactFormPublic {
  return {
    id: 'legacy',
    key: FORM_KEY,
    name: t('legacyName'),
    submitButton: t('submit'),
    successMessage: t('successMessage'),
    fields: [
      { key: 'name', type: 'TEXT', label: t('fullName'), isRequired: true, placeholder: t('fullNamePlaceholder') },
      { key: 'email', type: 'EMAIL', label: t('email'), isRequired: true, placeholder: t('emailPlaceholder') },
      { key: 'phone', type: 'PHONE', label: t('phone'), isRequired: false, placeholder: t('phonePlaceholder') },
      { key: 'subject', type: 'TEXT', label: t('subject'), isRequired: false },
      { key: 'message', type: 'TEXTAREA', label: t('message'), isRequired: true, placeholder: t('messagePlaceholder') },
    ],
  };
}

function inputClasses(hasError: boolean): string {
  return cn(
    'border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary w-full rounded border px-3 text-sm focus:outline-none focus:ring-2',
    hasError && 'border-destructive focus:border-destructive focus:ring-destructive/20'
  );
}

function getInitialValue(field: ContactFormPublicField): FieldValue {
  if (field.type === 'CHECKBOX') return false;
  if (field.type === 'MULTI_SELECT') return [];
  return field.defaultValue ?? '';
}

function validateField(field: ContactFormPublicField, value: FieldValue, t: Translate): string | null {
  if (field.isRequired) {
    if (field.type === 'CHECKBOX' && value !== true) return t('requiredField');
    if (Array.isArray(value) && value.length === 0) return t('requiredField');
    if (typeof value === 'string' && value.trim() === '') return t('requiredField');
  }

  if (typeof value === 'string' && value !== '') {
    if (field.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t('invalidEmail');
    }
    const v = field.validation;
    if (v) {
      if (v.minLength != null && value.length < v.minLength) return t('minChars', { n: String(v.minLength) });
      if (v.maxLength != null && value.length > v.maxLength) return t('maxChars', { n: String(v.maxLength) });
      if (v.pattern) {
        try {
          if (!new RegExp(v.pattern).test(value)) {
            return v.patternMessage || t('invalidValue');
          }
        } catch {
          // ignore invalid pattern from server
        }
      }
      if (field.type === 'NUMBER') {
        const num = Number(value);
        if (Number.isNaN(num)) return t('mustBeNumber');
        if (v.min != null && num < v.min) return t('minValue', { n: String(v.min) });
        if (v.max != null && num > v.max) return t('maxValue', { n: String(v.max) });
      }
    }
  }

  return null;
}

export function ContactForm() {
  const { locale } = useLocale();
  const t = useTranslations('contact');
  const [form, setForm] = useState<ContactFormPublic | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = getClient();
        const fetched = await client.contactForms.get(FORM_KEY, locale);
        if (cancelled) return;
        setForm(fetched);
        setValues(Object.fromEntries(fetched.fields.map((f) => [f.key, getInitialValue(f)])));
      } catch {
        if (cancelled) return;
        const legacy = buildLegacyForm(t);
        setForm(legacy);
        setValues(Object.fromEntries(legacy.fields.map((f) => [f.key, getInitialValue(f)])));
      } finally {
        if (!cancelled) setLoadingForm(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function setField(key: string, value: FieldValue) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || submitting) return;

    if (honeypot.trim() !== '') {
      setSuccess(true);
      return;
    }

    const newErrors: Record<string, string> = {};
    for (const field of form.fields) {
      const err = validateField(field, values[field.key], t);
      if (err) newErrors[field.key] = err;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const client = getClient();
      await client.createInquiry({
        formKey: form.key,
        fields: values as Record<string, unknown>,
        locale,
        sourceMetadata: {
          page: typeof window !== 'undefined' ? window.location.pathname : '/contact',
          referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        },
      });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('submitFailed');
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingForm) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!form) return null;

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground">{t('sentSuccess')}</h2>
        <p className="mt-2 text-muted-foreground">{form.successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-label={form.name}>
      {submitError && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3 text-sm"
        >
          {submitError}
        </div>
      )}

      {/* Honeypot — hidden from users, bots fill every field */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          {t('honeypot')}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {form.fields.map((field) => {
        const value = values[field.key];
        const error = errors[field.key];
        const id = `contact-${field.key}`;
        const errorId = `${id}-error`;
        const helpId = `${id}-help`;
        const describedBy =
          [error ? errorId : null, field.helpText ? helpId : null].filter(Boolean).join(' ') || undefined;

        const labelEl = (
          <label htmlFor={id} className="text-foreground mb-1.5 block text-sm font-medium">
            {field.label}
            {field.isRequired && <span className="text-destructive" aria-hidden="true"> *</span>}
          </label>
        );

        const helpEl = field.helpText ? (
          <p id={helpId} className="text-muted-foreground mt-1 text-xs">
            {field.helpText}
          </p>
        ) : null;

        const errorEl = error ? (
          <p id={errorId} role="alert" className="text-destructive mt-1 text-xs">
            {error}
          </p>
        ) : null;

        if (field.type === 'TEXTAREA') {
          return (
            <div key={field.key}>
              {labelEl}
              <textarea
                id={id}
                value={(value as string) ?? ''}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.isRequired}
                aria-required={field.isRequired}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                rows={5}
                className={cn(inputClasses(!!error), 'min-h-[120px] py-2 leading-relaxed')}
              />
              {errorEl}
              {helpEl}
            </div>
          );
        }

        if (field.type === 'SELECT') {
          return (
            <div key={field.key}>
              {labelEl}
              <select
                id={id}
                value={(value as string) ?? ''}
                onChange={(e) => setField(field.key, e.target.value)}
                required={field.isRequired}
                aria-required={field.isRequired}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                className={cn(inputClasses(!!error), 'h-10')}
              >
                <option value="">{field.placeholder || t('chooseOption')}</option>
                {field.enumValues?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errorEl}
              {helpEl}
            </div>
          );
        }

        if (field.type === 'MULTI_SELECT') {
          const arrValue = Array.isArray(value) ? (value as string[]) : [];
          return (
            <fieldset key={field.key}>
              <legend className="text-foreground mb-1.5 block text-sm font-medium">
                {field.label}
                {field.isRequired && <span className="text-destructive" aria-hidden="true"> *</span>}
              </legend>
              <div className="flex flex-wrap gap-3">
                {field.enumValues?.map((opt) => {
                  const checked = arrValue.includes(opt.value);
                  return (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...arrValue, opt.value]
                            : arrValue.filter((v) => v !== opt.value);
                          setField(field.key, next);
                        }}
                        className="accent-primary"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
              {errorEl}
              {helpEl}
            </fieldset>
          );
        }

        if (field.type === 'CHECKBOX') {
          return (
            <div key={field.key}>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  id={id}
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => setField(field.key, e.target.checked)}
                  required={field.isRequired}
                  aria-required={field.isRequired}
                  aria-invalid={!!error}
                  aria-describedby={describedBy}
                  className="accent-primary mt-0.5"
                />
                <span className="text-foreground text-sm">
                  {field.label}
                  {field.isRequired && <span className="text-destructive" aria-hidden="true"> *</span>}
                </span>
              </label>
              {errorEl}
              {helpEl}
            </div>
          );
        }

        const inputType =
          field.type === 'EMAIL'
            ? 'email'
            : field.type === 'PHONE'
              ? 'tel'
              : field.type === 'NUMBER'
                ? 'number'
                : field.type === 'URL'
                  ? 'url'
                  : field.type === 'DATE'
                    ? 'date'
                    : 'text';

        return (
          <div key={field.key}>
            {labelEl}
            <input
              id={id}
              type={inputType}
              value={(value as string) ?? ''}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.isRequired}
              aria-required={field.isRequired}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              autoComplete={
                field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : 'off'
              }
              className={cn(inputClasses(!!error), 'h-10')}
            />
            {errorEl}
            {helpEl}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground flex h-11 w-full items-center justify-center gap-2 rounded text-base font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <LoadingSpinner size="sm" className="border-primary-foreground/30 border-t-primary-foreground" />
            {t('sending')}
          </>
        ) : (
          form.submitButton
        )}
      </button>
    </form>
  );
}
