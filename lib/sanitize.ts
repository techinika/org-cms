const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "img",
  "video",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "span",
  "div",
  "figure",
  "figcaption",
]);

const DANGEROUS_SCHEMES = /^\s*(javascript|vbscript|data):/i;

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined" || typeof Node === "undefined") {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");

  const clean = (node: Node): void => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tag)) {
          node.replaceChild(doc.createTextNode(el.textContent || ""), el);
          continue;
        }

        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on")) {
            el.removeAttribute(attr.name);
          } else if ((name === "src" || name === "href") && DANGEROUS_SCHEMES.test(attr.value)) {
            el.removeAttribute(attr.name);
          }
        }

        clean(el);
      }
    }
  };

  clean(doc.body);
  return doc.body.innerHTML;
}
