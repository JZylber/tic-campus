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
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHTML, "text/html");
  // Get all script tags
  const scripts = [...doc.querySelectorAll("script")];
  // Remove from doc
  scripts.forEach((el) => {
    el.remove();
  });
  // Clear previous content
  element.innerHTML = "";
  // Set new content
  element.innerHTML += doc.body.innerHTML;
  const loadScripts = scripts.map((el) => {
    return new Promise((resolve) => {
      // Check if the script has inline code
      if (el.textContent) {
        const inlineScript = document.createElement("script");
        inlineScript.textContent = el.textContent;
        document.head.appendChild(inlineScript);
        resolve(true);
      } else if (!el.src) {
        // If no src and no inline code, resolve
        resolve(true);
      } else {
        // If has src, create a new script tag and set the src
        const newScript = document.createElement("script");
        // Copy all attributes from the original script tag
        for (let i = 0; i < el.attributes.length; i++) {
          newScript.setAttribute(
            el.attributes[i].name,
            el.attributes[i].value,
          );
        }
        if (el.src) {
          // If the source is a relative path, add the base URL at the front
          if (el.src.startsWith("https://campus.ort.edu.ar/tic-campus")) {
            newScript.src = el.src.replace("https://campus.ort.edu.ar/", baseURL);
          } else {
            newScript.src = el.src;
          }
        }
        // onload resolve the promise
        newScript.onload = () => {
          resolve(true);
        };
        element.appendChild(newScript);
      }
    });
  });
  await Promise.all(loadScripts);
  window.Alpine.initTree(element);
  const mermaidNodes = element.querySelectorAll<HTMLElement>(".mermaid");
  for (const node of mermaidNodes) {
    const source = node.textContent ?? "";
    if (!source.trim()) continue;
    const id = "mermaid-" + Math.random().toString(36).slice(2);
    const { svg } = await mermaid.render(id, source);
    node.innerHTML = svg;
    const svgEl = node.querySelector("svg");
    if (svgEl) {
      svgEl.style.display = "block";
      svgEl.style.height = "auto";
    }
  }
}
