import sanitizeHtml from 'sanitize-html';

/**
 * Renders a blog post body. The Brainerce dashboard may store content as HTML
 * (rich-text editor) or as plain text with blank-line paragraph breaks — handle
 * both. HTML is sanitized server-side against a conservative whitelist before
 * rendering, so even a compromised admin account or upstream injection cannot
 * smuggle <script>, event handlers or javascript: URIs into the page.
 */
function looksLikeHtml(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'blockquote', 'pre', 'code', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sup', 'sub',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['dir'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // Force external links to open safely.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export function BlogContent({ content }: { content: string }) {
  if (!content?.trim()) return null;

  if (looksLikeHtml(content)) {
    const clean = sanitizeHtml(content, SANITIZE_OPTIONS);
    return (
      <div
        className="blog-prose"
        // Sanitized above via sanitize-html against a strict tag/attr whitelist.
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="blog-prose">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
