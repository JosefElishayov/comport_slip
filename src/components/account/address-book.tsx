'use client';

import { useState } from 'react';
import type { CustomerAddress, CreateAddressDto } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface AddressBookProps {
  addresses: CustomerAddress[];
  onUpdate: (addresses: CustomerAddress[]) => void;
  className?: string;
}

interface AddressFormState {
  label: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const emptyForm: AddressFormState = {
  label: '',
  firstName: '',
  lastName: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
};

function addressToForm(a: CustomerAddress): AddressFormState {
  return {
    label: a.label || '',
    firstName: a.firstName,
    lastName: a.lastName,
    line1: a.line1,
    line2: a.line2 || '',
    city: a.city,
    region: a.region || '',
    postalCode: a.postalCode,
    country: a.country,
    phone: a.phone || '',
    isDefault: a.isDefault,
  };
}

interface AddressFormProps {
  initial: AddressFormState;
  onSave: (data: AddressFormState) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  t: (key: string) => string;
  tc: (key: string) => string;
}

function AddressForm({ initial, onSave, onCancel, saving, t, tc }: AddressFormProps) {
  const [form, setForm] = useState<AddressFormState>(initial);
  const set = (field: keyof AddressFormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const inputClass =
    'border-border bg-background text-foreground focus:border-primary w-full rounded-md border px-3 py-1.5 text-sm outline-none';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-3"
    >
      <div>
        <label className="text-muted-foreground mb-1 block text-xs font-medium">
          {t('addressLabel')}
        </label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => set('label', e.target.value)}
          className={inputClass}
          placeholder="Home, Work..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            {t('firstName')}
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            {t('lastName')}
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-muted-foreground mb-1 block text-xs font-medium">{t('line1')}</label>
        <input
          type="text"
          value={form.line1}
          onChange={(e) => set('line1', e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className="text-muted-foreground mb-1 block text-xs font-medium">{t('line2')}</label>
        <input
          type="text"
          value={form.line2}
          onChange={(e) => set('line2', e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            {t('city')}
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            {t('postalCode')}
          </label>
          <input
            type="text"
            value={form.postalCode}
            onChange={(e) => set('postalCode', e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            {t('region')}
          </label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs font-medium">
            {t('country')}
          </label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-muted-foreground mb-1 block text-xs font-medium">{t('phone')}</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          className={inputClass}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set('isDefault', e.target.checked)}
          className="accent-primary"
        />
        <span className="text-sm">{t('isDefault')}</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground rounded-md px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? '...' : tc('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-muted-foreground hover:text-foreground rounded-md px-4 py-1.5 text-sm transition-colors"
        >
          {tc('cancel')}
        </button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses, onUpdate, className }: AddressBookProps) {
  const t = useTranslations('account');
  const tc = useTranslations('common');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(data: AddressFormState) {
    setSaving(true);
    try {
      const client = getClient();
      const dto: CreateAddressDto = {
        label: data.label || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        line1: data.line1,
        line2: data.line2 || undefined,
        city: data.city,
        region: data.region || undefined,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone || undefined,
        isDefault: data.isDefault,
      };
      await client.addMyAddress(dto);
      const updated = await client.getMyAddresses();
      onUpdate(updated);
      setAdding(false);
    } catch {
      // ignore — could show error
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: string, data: AddressFormState) {
    setSaving(true);
    try {
      const client = getClient();
      await client.updateMyAddress(id, {
        label: data.label || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        line1: data.line1,
        line2: data.line2 || undefined,
        city: data.city,
        region: data.region || undefined,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone || undefined,
        isDefault: data.isDefault,
      });
      const updated = await client.getMyAddresses();
      onUpdate(updated);
      setEditingId(null);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const client = getClient();
      await client.deleteMyAddress(id);
      onUpdate(addresses.filter((a) => a.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const client = getClient();
      await client.updateMyAddress(id, { isDefault: true });
      const updated = await client.getMyAddresses();
      onUpdate(updated);
    } catch {
      // ignore
    }
  }

  return (
    <div className={cn('border-border rounded-lg border p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">{t('addressBook')}</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            + {t('addAddress')}
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="border-border mb-4 rounded-lg border p-4">
          <h3 className="text-foreground mb-3 text-sm font-medium">{t('addAddress')}</h3>
          <AddressForm
            initial={emptyForm}
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            saving={saving}
            t={t}
            tc={tc}
          />
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !adding ? (
        <p className="text-muted-foreground text-sm">{t('noAddresses')}</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn(
                'border-border rounded-lg border p-4',
                address.isDefault && 'border-primary/40 bg-primary/5'
              )}
            >
              {editingId === address.id ? (
                <>
                  <h3 className="text-foreground mb-3 text-sm font-medium">{t('editAddress')}</h3>
                  <AddressForm
                    initial={addressToForm(address)}
                    onSave={(data) => handleEdit(address.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                    t={t}
                    tc={tc}
                  />
                </>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    {address.label && (
                      <p className="text-foreground mb-1 font-medium">{address.label}</p>
                    )}
                    <p className="text-foreground">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-muted-foreground">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}
                    </p>
                    <p className="text-muted-foreground">
                      {address.city}
                      {address.region ? `, ${address.region}` : ''} {address.postalCode}
                    </p>
                    <p className="text-muted-foreground">{address.country}</p>
                    {address.phone && <p className="text-muted-foreground">{address.phone}</p>}
                    {address.isDefault && (
                      <span className="bg-primary/10 text-primary mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium">
                        {t('defaultAddress')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(address.id)}
                      className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                    >
                      {t('editAddress')}
                    </button>
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.id)}
                        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                      >
                        {t('setDefault')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      disabled={deletingId === address.id}
                      className="text-destructive hover:text-destructive/80 text-xs transition-colors disabled:opacity-50"
                    >
                      {deletingId === address.id ? '...' : t('deleteAddress')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
