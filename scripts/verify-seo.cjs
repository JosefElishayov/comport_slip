// Focused regressions for canonical language URLs, variant pricing and JSON-LD.
// Uses the project's existing TypeScript compiler; no extra test dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const modules = new Map();

function load(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  }).outputText;
  const localRequire = (id) => {
    if (!id.startsWith('@/')) return require(id);
    const base = `src/${id.slice(2)}`;
    const source = ['.ts', '.tsx'].map((ext) => base + ext).find((file) => fs.existsSync(path.join(root, file)));
    if (!source) throw new Error(`Cannot resolve ${id}`);
    return load(source);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

const { localizedAlternates, textSummary, SITE_URL } = load('src/lib/seo.ts');
const { getProductVariantPriceInfo } = load('src/lib/pricing.ts');
const { ProductJsonLd } = load('src/components/seo/product-json-ld.tsx');
const product = {
  id: 'p1', name: 'Mattress', type: 'VARIABLE', status: 'active', basePrice: '1000',
  sku: 'parent', images: [{ url: 'https://example.test/mattress.jpg' }],
  categories: [{ id: 'c1', name: 'Mattresses', slug: 'mattresses' }],
  inventory: { canPurchase: true },
  variants: [
    { id: 'v1', price: '1000', salePrice: '800', attributes: { Size: '140x190' } },
    { id: 'v2', price: '1200', salePrice: '1000', attributes: { Size: '160x200' }, inventory: { canPurchase: false } },
    { id: 'draft', price: '1', status: 'draft', attributes: { Size: 'test' } },
  ],
};

async function jsonLd(data = product, locale = 'en') {
  const result = await ProductJsonLd({ product: data, url: `${SITE_URL}/${locale === 'en' ? 'en/' : ''}products/mattress`, currency: 'ILS', locale });
  assert.ok(result, 'Product JSON-LD must not silently disappear');
  return result.props.children.map((script) => JSON.parse(script.props.dangerouslySetInnerHTML.__html));
}

test('static routes have self-canonical English URLs and reciprocal language links', () => {
  for (const route of ['/', '/products', '/blog', '/shipping', '/returns', '/about']) {
    const he = localizedAlternates(route, 'he');
    const en = localizedAlternates(route, 'en');
    assert.equal(he.canonical, route);
    assert.equal(en.canonical, route === '/' ? '/en' : `/en${route}`);
    assert.deepEqual(he.languages, en.languages);
    assert.equal(en.languages['x-default'], route);
  }
});

test('variant price matches sales, discount rules and scheduled sale windows', () => {
  const variant = product.variants[0];
  assert.equal(getProductVariantPriceInfo(product, variant, 'ILS').price, 800);
  assert.equal(getProductVariantPriceInfo(product, { ...variant, salePrice: '1100' }, 'ILS').price, 1000);
  const discounted = { ...product, discount: { originalPrice: '1000', discountedPrice: '900' } };
  assert.equal(getProductVariantPriceInfo(discounted, variant, 'ILS').price, 720);
  assert.equal(getProductVariantPriceInfo(product, { ...variant, salePriceStartsAt: new Date(Date.now() + 86400000).toISOString() }, 'ILS').price, 1000);
  assert.equal(getProductVariantPriceInfo(product, { ...variant, salePriceEndsAt: new Date(Date.now() - 86400000).toISOString() }, 'ILS').price, 1000);
});

test('regional variant prices are used without applying discount a second time', () => {
  const variant = { ...product.variants[0], displayPrice: '300', displaySalePrice: '250', displayCurrency: 'USD' };
  assert.deepEqual(getProductVariantPriceInfo(product, variant, 'ILS'), {
    price: 250, originalPrice: 300, isOnSale: true, currency: 'USD',
  });
});

test('ProductGroup offers contain selectable variant URLs, real availability and no draft', async () => {
  const [schema, breadcrumbs] = await jsonLd();
  assert.equal(schema['@type'], 'ProductGroup');
  assert.equal(schema.productGroupID, product.id);
  assert.deepEqual(schema.variesBy, ['https://schema.org/size']);
  assert.equal(schema.hasVariant.length, 2);
  assert.equal(schema.offers.lowPrice, 800);
  assert.equal(schema.hasVariant[0].offers.price, 800);
  assert.equal(schema.hasVariant[1].offers.availability, 'https://schema.org/OutOfStock');
  assert.equal(schema.hasVariant[1].offers.url, `${SITE_URL}/en/products/mattress?variant=v2`);
  assert.equal(breadcrumbs.itemListElement[0].name, 'Home');
  assert.equal(breadcrumbs.itemListElement[2].item, `${SITE_URL}/en/category/mattresses`);
});

test('only supplied manufacturer identifiers and ratings are emitted', async () => {
  const [schema] = await jsonLd({ ...product, type: 'SIMPLE', variants: [], gtin: '1234567890123', mpn: 'M-10' });
  assert.equal(schema.gtin, '1234567890123');
  assert.equal(schema.mpn, 'M-10');
  assert.equal(schema.aggregateRating, undefined);
  assert.equal(schema.brand, undefined);
});

test('HTML summaries preserve word separation and JSON-LD cannot escape its script tag', async () => {
  assert.equal(textSummary('<p>One</p><p>two&nbsp;&amp; three</p>'), 'One two & three');
  assert.ok(textSummary('word '.repeat(100), 150).length <= 150);
  const result = await ProductJsonLd({ product: { ...product, name: '</script><script>alert(1)</script>' }, url: `${SITE_URL}/products/test` });
  const embedded = result.props.children[0].props.dangerouslySetInnerHTML.__html;
  assert.ok(!embedded.includes('</script>'));
  assert.equal(JSON.parse(embedded).name, '</script><script>alert(1)</script>');
});
