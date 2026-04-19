'use client';

import { useState, useEffect, useRef } from 'react';
import type { SetShippingAddressDto, ShippingDestinations } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { isValidEmail } from '@/lib/validation';

interface CheckoutConsent {
  acceptsMarketing: boolean;
  saveDetails: boolean;
}

interface CheckoutFormProps {
  onSubmit: (address: SetShippingAddressDto, consent: CheckoutConsent) => void;
  loading?: boolean;
  initialValues?: Partial<SetShippingAddressDto>;
  destinations?: ShippingDestinations | null;
  className?: string;
  showSaveDetails?: boolean;
  emailOnly?: boolean;
}

export function CheckoutForm({
  onSubmit,
  loading = false,
  initialValues,
  destinations,
  className,
  showSaveDetails = false,
  emailOnly = false,
}: CheckoutFormProps) {
  const [formData, setFormData] = useState<SetShippingAddressDto>({
    email: initialValues?.email || '',
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    line1: initialValues?.line1 || '',
    line2: initialValues?.line2 || '',
    city: initialValues?.city || '',
    region: initialValues?.region || '',
    postalCode: initialValues?.postalCode || '',
    country: initialValues?.country || '',
    phone: initialValues?.phone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [saveDetails, setSaveDetails] = useState(true);
  const t = useTranslations('checkoutForm');
  const tc = useTranslations('common');
  const hasAppliedPrefill = useRef(!!initialValues);

  // Sync prefill data when it arrives async (e.g. from getCheckoutPrefillData)
  useEffect(() => {
    if (!initialValues || hasAppliedPrefill.current) return;
    hasAppliedPrefill.current = true;
    setFormData((prev) => ({
      email: initialValues.email || prev.email,
      firstName: initialValues.firstName || prev.firstName,
      lastName: initialValues.lastName || prev.lastName,
      line1: initialValues.line1 || prev.line1,
      line2: initialValues.line2 || prev.line2 || '',
      city: initialValues.city || prev.city,
      region: initialValues.region || prev.region || '',
      postalCode: initialValues.postalCode || prev.postalCode,
      country: initialValues.country || prev.country,
      phone: initialValues.phone || prev.phone || '',
    }));
  }, [initialValues]);

  const hasCountryOptions = destinations && destinations.countries.length > 0;
  const countryRegions = destinations?.regions[formData.country];
  const hasRegionOptions = countryRegions && countryRegions.length > 0;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = t('emailInvalid');
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('firstNameRequired');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('lastNameRequired');
    }
    if (!emailOnly) {
      if (!formData.line1.trim()) {
        newErrors.line1 = t('addressRequired');
      }
      if (!formData.city.trim()) {
        newErrors.city = t('cityRequired');
      }
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = t('postalCodeRequired');
      }
      if (!formData.country.trim()) {
        newErrors.country = t('countryRequired');
      }
    }
    if (!privacyAccepted) {
      newErrors.privacy = t('privacyRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData, { acceptsMarketing, saveDetails: showSaveDetails && saveDetails });
    }
  }

  function updateField(field: keyof SetShippingAddressDto, value: string) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Reset region when country changes
      if (field === 'country' && value !== prev.country) {
        next.region = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  const inputClass =
    'bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2';
  const selectClass =
    'bg-background text-foreground focus:ring-primary/20 focus:border-primary h-10 w-full appearance-none rounded border px-3 text-sm focus:outline-none focus:ring-2';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Email */}
      <div>
        <label htmlFor="email" className="text-foreground mb-1 block text-sm font-medium">
          {t('email')} <span className="text-destructive">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={cn(inputClass, errors.email ? 'border-destructive' : 'border-border')}
          placeholder="your@email.com"
        />
        {errors.email && <p className="text-destructive mt-1 text-xs">{errors.email}</p>}
      </div>

      {/* Name row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="text-foreground mb-1 block text-sm font-medium">
            {t('firstName')} <span className="text-destructive">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className={cn(inputClass, errors.firstName ? 'border-destructive' : 'border-border')}
          />
          {errors.firstName && <p className="text-destructive mt-1 text-xs">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="text-foreground mb-1 block text-sm font-medium">
            {t('lastName')} <span className="text-destructive">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className={cn(inputClass, errors.lastName ? 'border-destructive' : 'border-border')}
          />
          {errors.lastName && <p className="text-destructive mt-1 text-xs">{errors.lastName}</p>}
        </div>
      </div>

      {!emailOnly && (
        <>
          {/* Country + Region row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="country" className="text-foreground mb-1 block text-sm font-medium">
                {t('country')} <span className="text-destructive">*</span>
              </label>
              {hasCountryOptions ? (
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className={cn(
                    selectClass,
                    errors.country ? 'border-destructive' : 'border-border'
                  )}
                >
                  <option value="">{t('selectCountry')}</option>
                  {destinations.countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className={cn(
                    inputClass,
                    errors.country ? 'border-destructive' : 'border-border'
                  )}
                  placeholder={t('countryPlaceholder')}
                />
              )}
              {errors.country && <p className="text-destructive mt-1 text-xs">{errors.country}</p>}
            </div>

            <div>
              <label htmlFor="region" className="text-foreground mb-1 block text-sm font-medium">
                {t('stateRegion')}
              </label>
              {hasRegionOptions ? (
                <select
                  id="region"
                  value={formData.region || ''}
                  onChange={(e) => updateField('region', e.target.value)}
                  className={cn(selectClass, 'border-border')}
                >
                  <option value="">{t('selectRegion')}</option>
                  {countryRegions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="region"
                  type="text"
                  value={formData.region || ''}
                  onChange={(e) => updateField('region', e.target.value)}
                  className={cn(inputClass, 'border-border')}
                />
              )}
            </div>
          </div>

          {/* Address line 1 */}
          <div>
            <label htmlFor="line1" className="text-foreground mb-1 block text-sm font-medium">
              {t('address')} <span className="text-destructive">*</span>
            </label>
            <input
              id="line1"
              type="text"
              value={formData.line1}
              onChange={(e) => updateField('line1', e.target.value)}
              className={cn(inputClass, errors.line1 ? 'border-destructive' : 'border-border')}
              placeholder={t('streetAddress')}
            />
            {errors.line1 && <p className="text-destructive mt-1 text-xs">{errors.line1}</p>}
          </div>

          {/* Address line 2 */}
          <div>
            <label htmlFor="line2" className="text-foreground mb-1 block text-sm font-medium">
              {t('apartmentSuite')}
            </label>
            <input
              id="line2"
              type="text"
              value={formData.line2 || ''}
              onChange={(e) => updateField('line2', e.target.value)}
              className={cn(inputClass, 'border-border')}
              placeholder={t('aptPlaceholder')}
            />
          </div>

          {/* City + Postal code row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="text-foreground mb-1 block text-sm font-medium">
                {t('city')} <span className="text-destructive">*</span>
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className={cn(inputClass, errors.city ? 'border-destructive' : 'border-border')}
              />
              {errors.city && <p className="text-destructive mt-1 text-xs">{errors.city}</p>}
            </div>

            <div>
              <label
                htmlFor="postalCode"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                {t('postalCode')} <span className="text-destructive">*</span>
              </label>
              <input
                id="postalCode"
                type="text"
                value={formData.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                className={cn(
                  inputClass,
                  errors.postalCode ? 'border-destructive' : 'border-border'
                )}
              />
              {errors.postalCode && (
                <p className="text-destructive mt-1 text-xs">{errors.postalCode}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="text-foreground mb-1 block text-sm font-medium">
              {t('phone')}
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className={cn(inputClass, 'border-border')}
              placeholder={t('phonePlaceholder')}
            />
          </div>
        </>
      )}

      {/* Privacy Policy (required) */}
      <div>
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => {
              setPrivacyAccepted(e.target.checked);
              if (e.target.checked && errors.privacy) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.privacy;
                  return next;
                });
              }
            }}
            className="accent-primary mt-0.5"
          />
          <span className="text-muted-foreground text-sm">
            {t('privacyAcceptPrefix')}{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {t('privacyPolicyLink')}
            </a>{' '}
            <span className="text-destructive">*</span>
          </span>
        </label>
        {errors.privacy && <p className="text-destructive mt-1 text-xs">{errors.privacy}</p>}
      </div>

      {/* Marketing consent (optional) */}
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={acceptsMarketing}
          onChange={(e) => setAcceptsMarketing(e.target.checked)}
          className="accent-primary mt-0.5"
        />
        <span className="text-muted-foreground text-sm">{t('acceptsMarketing')}</span>
      </label>

      {/* Save details for next time (logged-in users only) */}
      {showSaveDetails && (
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={saveDetails}
            onChange={(e) => setSaveDetails(e.target.checked)}
            className="accent-primary mt-0.5"
          />
          <span className="text-muted-foreground text-sm">{t('saveDetailsForNextTime')}</span>
        </label>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-primary-foreground w-full rounded px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? tc('saving') : emailOnly ? t('continueToPayment') : t('continueToShipping')}
      </button>
    </form>
  );
}
