const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');

function blogWith(clientForLocale) {
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync('src/lib/blog.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mockedRequire = (id) => {
    if (id === '@/lib/brainerce') return { getServerClient: clientForLocale };
    if (id === '@/lib/locale') return { withLocalePrefix: (p, l) => l === 'he' ? p : `/en${p}` };
    return require(id);
  };
  new Function('require', 'module', 'exports', output)(mockedRequire, module, module.exports);
  return module.exports;
}

test('original slugs use the direct read without fetching the full list', async () => {
  const post = { id: '1', slug: 'original', content: 'Full article' };
  const blog = blogWith(() => ({ blog: {
    getPost: async (slug) => { assert.equal(slug, 'original'); return post; },
    getPosts: async () => { throw new Error('Unnecessary list request'); },
  } }));
  assert.equal(await blog.getBlogPost('original', 'he'), post);
});

test('translated slug resolves the full localized post beyond page one', async () => {
  const translated = { id: '1', slug: 'experience-in-english', title: 'English title', content: 'Full English article' };
  const pages = [];
  const blog = blogWith((locale) => {
    assert.equal(locale, 'en');
    return { blog: {
      getPost: async () => null,
      getPosts: async ({ page, limit }) => {
        assert.equal(limit, 100);
        pages.push(page);
        return { data: page === 1 ? [{ id: 'other', slug: 'other' }] : [translated], meta: { page, totalPages: 2 } };
      },
    } };
  });
  assert.equal(await blog.getBlogPost('experience-in-english', 'en'), translated);
  assert.deepEqual(pages, [1, 2]);
});

test('a missing slug stays missing, without substituting an unrelated post', async () => {
  const blog = blogWith(() => ({ blog: {
    getPost: async () => null,
    getPosts: async () => ({ data: [{ id: '1', slug: 'actual' }], meta: { totalPages: 1 } }),
  } }));
  assert.equal(await blog.getBlogPost('unknown', 'en'), null);
});

test('encoded Hebrew slugs are decoded once before lookup', async () => {
  const post = { id: '1', slug: 'מזרן', content: 'מאמר' };
  const blog = blogWith(() => ({ blog: {
    getPost: async (slug) => { assert.equal(slug, 'מזרן'); return post; },
  } }));
  assert.equal(await blog.getBlogPost(encodeURIComponent('מזרן'), 'he'), post);
});
