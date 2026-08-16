import type { ProductQueryParams } from 'brainerce';

export type SortOption = {
  labelKey:
    | 'sortFeatured'
    | 'sortNewest'
    | 'sortNameAZ'
    | 'sortNameZA'
    | 'sortPriceLow'
    | 'sortPriceHigh';
  sortBy: ProductQueryParams['sortBy'];
  sortOrder: ProductQueryParams['sortOrder'];
};

export const sortOptions: SortOption[] = [
  // No sortBy — Brainerce falls back to menuOrder, the manual order set in the dashboard
  { labelKey: 'sortFeatured', sortBy: undefined, sortOrder: undefined },
  { labelKey: 'sortNewest', sortBy: 'createdAt', sortOrder: 'desc' },
  { labelKey: 'sortNameAZ', sortBy: 'name', sortOrder: 'asc' },
  { labelKey: 'sortNameZA', sortBy: 'name', sortOrder: 'desc' },
  { labelKey: 'sortPriceLow', sortBy: 'price', sortOrder: 'asc' },
  { labelKey: 'sortPriceHigh', sortBy: 'price', sortOrder: 'desc' },
];
