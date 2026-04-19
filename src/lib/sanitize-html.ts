import DOMPurify from 'isomorphic-dompurify';

const TRUSTED_IFRAME_PREFIXES = [
  'https://www.youtube.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://player.vimeo.com/video/',
];

let hooksRegistered = false;

function registerHooksOnce() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'iframe') return;
    const el = node as Element;
    const src = el.getAttribute('src') || '';
    const isTrusted = TRUSTED_IFRAME_PREFIXES.some((prefix) => src.startsWith(prefix));
    if (!isTrusted) {
      el.parentNode?.removeChild(el);
    }
  });

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!('tagName' in node)) return;
    const el = node as Element;
    if (el.tagName === 'A' && el.getAttribute('target') === '_blank') {
      el.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
}

export function sanitizeProductHtml(html: string): string {
  if (!html) return '';
  registerHooksOnce();

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
      'div',
      'span',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'colgroup',
      'col',
      'iframe',
    ],
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'class',
      'src',
      'alt',
      'width',
      'height',
      'colspan',
      'rowspan',
      'allow',
      'allowfullscreen',
      'frameborder',
      'loading',
    ],
    ALLOW_DATA_ATTR: false,
  });
}
