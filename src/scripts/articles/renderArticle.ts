import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false });

const baseURL = "https://jzylber.github.io/";

/**
 * Renders a raw article HTML fragment into a target element, reproducing the
 * runtime behaviour of the embedded article view:
 *  - injects the parsed body markup
 *  - re-executes any <script> tags (inline or src, rewriting campus.ort URLs to
 *    the GitHub Pages origin so relative assets resolve)
 *  - re-initialises Alpine on the freshly injected subtree
 *  - renders any `.mermaid` diagrams
 *
 * Shared by the in-app article panel (`Article.astro`) and the standalone
 * dev-only article previewer.
 */
export async function renderArticleInto(
  element: HTMLElement,
  rawHTML: string,
): Promise<void> {
  const doc = new DOMParser().parseFromString(rawHTML, "text/html");
  // Scripts inserted via innerHTML never run, so pull them out and re-create them.
  const scripts = [...doc.querySelectorAll("script")];
  scripts.forEach((el) => el.remove());
  element.innerHTML = doc.body.innerHTML;
  const loadScripts = scripts.map(
    (el) =>
      new Promise((resolve) => {
        if (el.textContent) {
          const inlineScript = document.createElement("script");
          inlineScript.textContent = el.textContent;
          document.head.appendChild(inlineScript);
          resolve(true);
        } else if (!el.src) {
          resolve(true);
        } else {
          const newScript = document.createElement("script");
          for (const { name, value } of el.attributes) {
            newScript.setAttribute(name, value);
          }
          // Relative srcs resolved against campus.ort; point them at GitHub Pages.
          newScript.src = el.src.startsWith("https://campus.ort.edu.ar/tic-campus")
            ? el.src.replace("https://campus.ort.edu.ar/", baseURL)
            : el.src;
          newScript.onload = () => resolve(true);
          element.appendChild(newScript);
        }
      }),
  );
  await Promise.all(loadScripts);
  window.Alpine.initTree(element);
  const mermaidNodes = element.querySelectorAll<HTMLElement>(".mermaid");
  for (const node of mermaidNodes) {
    const source = node.textContent ?? "";
    if (!source.trim()) continue;
    const id = "mermaid-" + Math.random().toString(36).slice(2);
    try {
      const { svg } = await mermaid.render(id, source);
      node.innerHTML = svg;
      const svgEl = node.querySelector("svg");
      if (svgEl) {
        svgEl.style.display = "block";
        svgEl.style.height = "auto";
      }
    } catch (err) {
      // A single failing diagram shouldn't abort the whole article render;
      // leave the source visible and keep going.
      console.error("Mermaid render failed:", err);
    }
  }
}
