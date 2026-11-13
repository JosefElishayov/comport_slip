const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

async function run(context, legacy = false, cartOverrides = {}) {
  let cleanup;
  const navigation = [];
  const calls = [];
  let cartOpened = false;
  const client = {
    getProducts: async (input) => { calls.push(input); return { data: [], meta: { total: 0 } }; },
    getProduct: async (...input) => { calls.push(input); return { id: input[0] }; },
  };
  const modules = {
    react: { useEffect: (effect) => { cleanup = effect(); }, useRef: (current) => ({ current }) },
    '@/lib/brainerce': { getClient: () => client },
    '@/lib/navigation': { useRouter: () => ({ push: (path) => navigation.push(path) }) },
    '@/providers/region-provider': { useRegionId: () => 'region-test' },
    '@/providers/store-provider': { useCart: () => ({ openCartDrawer: () => { cartOpened = true; }, closeCartDrawer() {}, cart: { items: [{ id: 'item1' }] }, ...cartOverrides }) },
  };
  const sandbox = {
    exports: {}, require: (name) => modules[name], AbortController, console,
    document: legacy ? {} : { modelContext: context },
    navigator: legacy ? { modelContext: context } : {},
  };
  const source = ts.transpileModule(fs.readFileSync('src/components/shared/webmcp.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, sandbox);
  sandbox.exports.WebMCP();
  await new Promise(setImmediate);
  return { cleanup, navigation, calls, cartOpened: () => cartOpened };
}

(async () => {
  await run(undefined);
  for (const legacy of [false, true]) {
    const tools = new Map();
    let signal;
    const state = await run({ registerTool(tool, options) { tools.set(tool.name, tool); signal = options.signal; } }, legacy);
    assert.equal(tools.size, 5);
    await tools.get('search_products').execute({ query: 'מזרן & bed' });
    assert.equal(state.calls[0].regionId, 'region-test');
    assert.equal(state.navigation[0], '/products?search=' + encodeURIComponent('מזרן & bed'));
    await assert.rejects(tools.get('search_products').execute({ query: '' }));
    await assert.rejects(tools.get('get_product').execute({ productId: 123 }));
    assert.equal(JSON.parse(await tools.get('get_product').execute({ productId: 'p1' })).id, 'p1');
    await assert.rejects(tools.get('view_product').execute({ slug: '../checkout' }));
    await tools.get('view_product').execute({ slug: 'מזרן' });
    assert.equal(state.navigation[1], '/products/' + encodeURIComponent('מזרן'));
    await tools.get('show_cart').execute({});
    assert.equal(state.cartOpened(), true);
    assert.equal(JSON.parse(await tools.get('start_checkout').execute({})).paymentSubmitted, false);
    assert.equal(state.navigation[2], '/checkout');
    state.cleanup();
    assert.equal(signal.aborted, true);
    await assert.rejects(tools.get('show_cart').execute({}), /context changed/);
  }
  for (const overrides of [{ cart: { items: [] } }, { cartSyncing: true }, { cartError: true }, { cartLoading: true }]) {
    const tools = new Map();
    const state = await run({ registerTool(tool) { tools.set(tool.name, tool); } }, false, overrides);
    await assert.rejects(tools.get('start_checkout').execute({}));
    assert.equal(state.navigation.length, 0);
    state.cleanup();
  }
  console.log('WebMCP checks passed: current/legacy API, unsupported browser, search, region, product, navigation, cart, invalid inputs and cleanup.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
