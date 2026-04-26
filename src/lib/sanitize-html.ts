import sanitizeHtml from 'sanitize-html';

const TRUSTED_IFRAME_PREFIXES = [
  'https://www.youtube.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://player.vimeo.com/video/',
];

export function sanitizeProductHtml(html: string): string {
  if (!html) return '';

  return sanitizeHtml(html, {
    allowedTags: [
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
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
      img: ['src', 'alt', 'width', 'height', 'class', 'loading'],
      iframe: [
        'src',
        'width',
        'height',
        'allow',
        'allowfullscreen',
        'frameborder',
        'loading',
        'class',
      ],
      th: ['colspan', 'rowspan', 'class'],
      td: ['colspan', 'rowspan', 'class'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    transformTags: {
      iframe: (tagName, attribs) => {
        const src = attribs.src || '';
        const isTrusted = TRUSTED_IFRAME_PREFIXES.some((prefix) => src.startsWith(prefix));
        if (!isTrusted) {
          return { tagName: 'div', attribs: {}, text: '' };
        }
        return { tagName, attribs };
      },
      a: (tagName, attribs) => {
        if (attribs.target === '_blank') {
          attribs.rel = 'noopener noreferrer nofollow';
        }
        return { tagName, attribs };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'div' && !frame.text && Object.keys(frame.attribs).length === 0,
  });
}
