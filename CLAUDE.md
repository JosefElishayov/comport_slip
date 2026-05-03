# Design System — E-Commerce

## Core Philosophy
Every design decision must serve conversion. Beautiful AND functional. No decorative elements that don't earn their place. Trust is the foundation — the UI must feel premium, reliable, and frictionless.

---

## Typography

- **Display**: Fraunces, Playfair Display, or Cormorant Garamond — for product names, hero headlines
- **UI / Body**: DM Sans, Plus Jakarta Sans, or Geist — for prices, descriptions, buttons, nav
- **Scale**: 12 / 14 / 16 / 18 / 24 / 32 / 48 / 64px
- **Prices**: Always larger than surrounding text. `font-variant-numeric: tabular-nums` for alignment in lists
- NEVER: Arial, Roboto, Inter as the primary font

---

## Color System

```css
:root {
  /* Backgrounds */
  --bg:          #fafaf8;
  --bg-2:        #f3f2ee;
  --bg-3:        #eae8e3;
  --bg-dark:     #111110;

  /* Text */
  --text:        #1a1916;
  --text-2:      #6b6a66;
  --text-inv:    #fafaf8;

  /* Borders */
  --border:      rgba(0,0,0,0.08);
  --border-mid:  rgba(0,0,0,0.14);

  /* Brand */
  --accent:      #1a1916;
  --accent-fg:   #fafaf8;
  --accent-hover:#2e2d28;

  /* Semantic */
  --success:     #15803d;
  --success-bg:  #f0fdf4;
  --error:       #dc2626;
  --error-bg:    #fef2f2;
  --sale:        #dc2626;
  --badge-new:   #1d4ed8;
  --badge-sale:  #dc2626;
  --badge-sold:  #6b7280;

  /* Trust */
  --star:        #f59e0b;
}
```

**Rules:**
- Sale price: always `var(--sale)`, original price: strikethrough + `var(--text-2)`
- CTA buttons: high contrast, never light-on-light
- Out of stock: muted state — never hide the button

---

## Spacing & Layout

- 8px base grid
- Max content width: 1440px
- Page padding: `clamp(1rem, 4vw, 3rem)`
- Section spacing: `clamp(3rem, 8vw, 6rem)`

### Product Grid
```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
@media (min-width: 1024px) {
  .product-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## Components

### Product Card
```css
.product-card {
  position: relative;
  background: var(--bg);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
.product-card__image {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--bg-2);
}
.product-card__image img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.product-card:hover .product-card__image img { transform: scale(1.04); }
.product-card__info { padding: 14px 16px 18px; }
.product-card__name {
  font-size: 15px; font-weight: 500; color: var(--text);
  margin-bottom: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.product-card__price {
  font-size: 16px; font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.product-card__price--sale { color: var(--sale); }
.product-card__price--original {
  text-decoration: line-through;
  color: var(--text-2);
  font-size: 13px; font-weight: 400;
  margin-right: 6px;
}
.product-card__quick-add {
  position: absolute;
  bottom: 72px; left: 12px; right: 12px;
  background: var(--bg);
  border: 1px solid var(--border-mid);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  font-size: 13px; font-weight: 500;
  opacity: 0; transform: translateY(6px);
  transition: all 0.2s ease;
}
.product-card:hover .product-card__quick-add {
  opacity: 1; transform: translateY(0);
}
```

**Every product card must include:**
- Badge (NEW / SALE / SOLD OUT) — absolute, top-left
- Wishlist icon — absolute, top-right
- Quick-add button on hover
- Rating stars + review count

---

### Badges
```css
.badge {
  position: absolute; top: 10px; left: 10px;
  padding: 4px 10px; border-radius: 4px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase; z-index: 1;
}
.badge--new  { background: var(--badge-new); color: #fff; }
.badge--sale { background: var(--badge-sale); color: #fff; }
.badge--sold { background: var(--badge-sold); color: #fff; }
```

---

### CTA Buttons
```css
.btn-primary {
  width: 100%; padding: 14px 24px;
  background: var(--accent); color: var(--accent-fg);
  border: none; border-radius: 8px;
  font-size: 15px; font-weight: 600; letter-spacing: 0.01em;
  cursor: pointer; transition: all 0.15s ease;
}
.btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled {
  background: var(--bg-3); color: var(--text-2);
  cursor: not-allowed; transform: none;
}
.btn-secondary {
  padding: 13px 24px; background: transparent;
  border: 1px solid var(--border-mid); border-radius: 8px;
  color: var(--text); font-size: 15px; font-weight: 500;
  cursor: pointer; transition: all 0.15s ease;
}
.btn-secondary:hover { background: var(--bg-2); }
```

**CTA rules:**
- "Add to Cart" = most visually dominant element on the page
- Out-of-stock: disabled state, never hidden
- Loading state: spinner inside button, no layout shift

---

### Price Display
```html
<span class="price-original">₪199</span>
<span class="price price--sale">₪149</span>
<span class="discount-badge">-25%</span>
```
```css
.price { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
.price--sale { color: var(--sale); }
.price-original { text-decoration: line-through; color: var(--text-2); font-size: 16px; }
.discount-badge {
  display: inline-block; background: #fef2f2; color: var(--sale);
  padding: 2px 8px; border-radius: 4px;
  font-size: 13px; font-weight: 600;
}
```

---

### Trust Signals
Must appear near every CTA — non-negotiable.

```html
<div class="trust-bar">
  <span>✓ משלוח חינם מ-₪299</span>
  <span>✓ החזרה בתוך 30 יום</span>
  <span>✓ תשלום מאובטח</span>
</div>
```
```css
.trust-bar {
  display: flex; gap: 16px; flex-wrap: wrap;
  font-size: 13px; color: var(--text-2); margin-top: 16px;
}
```

---

### Rating Stars
```css
.stars { color: var(--star); font-size: 14px; letter-spacing: 1px; }
.rating-count { font-size: 13px; color: var(--text-2); margin-left: 5px; }
```
- Always show numeric score: "4.8 (124 ביקורות)"
- Hide component entirely if 0 reviews

---

### Cart Drawer
- Slides from right — never full-page redirect on add-to-cart
- Width: 400px desktop, 100vw mobile
- Sticky footer: subtotal + checkout CTA
- Empty state: message + CTA back to shop

---

## Page-Specific Rules

### Product Listing Page (PLP)
- Filter sidebar: sticky on scroll, collapsible on mobile
- Sort dropdown: top-right, always visible
- Product count: "מציג 24 מתוך 87 מוצרים"
- Load More button preferred over pagination on mobile
- Skeleton loading always — never blank flash

### Product Detail Page (PDP)
Desktop layout: Image gallery LEFT | Info RIGHT
Mobile layout order: Images → Title → Price → Variants → CTA → Trust → Description → Reviews

**Info column order (strict):**
1. Brand name (small, muted)
2. Product name (large, display font)
3. Rating + review count
4. Price (+ original if on sale)
5. Variant selectors (size / color)
6. Quantity selector
7. Add to Cart (full width, dominant)
8. Buy Now (secondary)
9. Trust bar
10. Short description
11. Accordion: Full Description / Shipping / Returns

**Image gallery:**
- Main image: square ratio, zoom on hover
- Thumbnails: horizontal strip (desktop), dots (mobile)
- Multiple images mandatory

### Cart Page
- Two-column: items LEFT | Summary RIGHT (sticky)
- Summary: subtotal, shipping estimate, total, promo code field
- "המשך לקנייה" link visible at top

### Checkout
- Step indicator: 1/3 → 2/3 → 3/3
- Payment logos: Visa, Mastercard, PayPal, Apple Pay
- SSL badge near payment section
- Order summary always visible, collapsible on mobile
- Inline specific errors ("כרטיס פג תוקף" not "שגיאה כללית")
- Submit button text: "השלם הזמנה" — never "Submit"

---

## Navigation

### Desktop Header
`Logo | Main Nav | Search | Wishlist (count) | Cart (count)`
- Sticky with `backdrop-filter: blur(12px)`
- Mega menu for large category trees

### Mobile Header
`Hamburger | Logo (centered) | Cart (count)`
- Full-screen slide-in menu with category accordion

---

## RTL Support (Hebrew)

```css
html[dir="rtl"] body { text-align: right; }
```
- Set `dir="rtl"` on `<html>`
- Use logical CSS properties: `margin-inline-start/end`, `padding-inline-start/end`
- Mirror directional icons: `transform: scaleX(-1)`
- Prices and numbers stay LTR: wrap in `<span dir="ltr">`

---

## Performance
- Below-fold images: `loading="lazy"`
- Hero/first product image: `loading="eager" fetchpriority="high"`
- Always set `width` and `height` on images to prevent layout shift
- Fonts: `font-display: swap`, preload critical fonts
- LCP target: under 2.5s

---

## Anti-Patterns (Never)
- No full-page redirect on "Add to Cart"
- No price without currency symbol
- No CTA below the fold on mobile PDP
- No auto-playing video with sound
- No pop-up on page load (wait 30s or exit-intent)
- No fake urgency that isn't real
- No hidden shipping costs
- No "Submit" on checkout — use "השלם הזמנה"
- No disabled checkout button without explaining why
- No generic placeholder images
