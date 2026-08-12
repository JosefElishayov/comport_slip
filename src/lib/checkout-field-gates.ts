import type { CheckoutCustomFieldDefinition } from 'brainerce';

/**
 * The "floor" checkout custom field is only relevant when the item can't be taken
 * up in the elevator (oversized mattresses / bases). Brainerce field visibility only
 * supports delivery-type and product scopes — there is no field-to-field dependency —
 * so the gating question is asked in the storefront and the floor field is hidden
 * until the customer says the item won't fit.
 *
 * Matched on key or name so it keeps working if the field is renamed in the dashboard.
 */
const FLOOR_FIELD_PATTERN = /floor|koma|kome|קומה/i;

export function isFloorField(field: CheckoutCustomFieldDefinition): boolean {
  return FLOOR_FIELD_PATTERN.test(field.key) || FLOOR_FIELD_PATTERN.test(field.name);
}

/**
 * Value submitted for the floor field when the item does fit in the elevator.
 * The field is required in the dashboard, so we record an explicit "fits" answer
 * instead of clearing it — this also tells the delivery crew no manual carry is needed.
 * NUMBER fields get 0 (ground level, below any above-floor-3 surcharge threshold).
 */
export function elevatorFitsValue(
  field: CheckoutCustomFieldDefinition,
  label: string
): unknown {
  if ((field.type as string) === 'NUMBER') {
    return field.minValue != null && field.minValue > 0 ? field.minValue : 0;
  }
  return label;
}

/** True when a stored floor value came from the "fits in the elevator" answer. */
export function isElevatorFitsValue(
  field: CheckoutCustomFieldDefinition,
  value: unknown,
  label: string
): boolean {
  if (value === undefined || value === null || value === '') return false;
  return value === elevatorFitsValue(field, label);
}
