import type { ProductQueryParams } from 'brainerce';

export type SortOption = {
  labelKey: 'sortNewest' | 'sortNameAZ' | 'sortNameZA' | 'sortPriceLow' | 'sortPriceHigh';
  sortBy: ProductQueryParams['sortBy'];
  sortOrder: ProductQueryParams['sortOrder'];
};

export const sortOptions: SortOption[] = [
  { labelKey: 'sortNewest', sortBy: 'createdAt', sortOrder: 'desc' },
  { labelKey: 'sortNameAZ', sortBy: 'name', sortOrder: 'asc' },
  { labelKey: 'sortNameZA', sortBy: 'name', sortOrder: 'desc' },
  { labelKey: 'sortPriceLow', sortBy: 'price', sortOrder: 'asc' },
  { labelKey: 'sortPriceHigh', sortBy: 'price', sortOrder: 'desc' },
];
