import type { DirectiveCallback } from "alpinejs";

const twMQDirective: DirectiveCallback = (
  el,
  { value, expression, modifiers },
  { Alpine, evaluateLater, evaluate, effect, cleanup }
) => {
  const run = evaluateLater(expression);

  const isMax = value.startsWith("max");
  const breakpointName = isMax ? value.slice(4) : value;

  let removeListener = () => {};

  requestAnimationFrame(() => {
    const breakpoint = getComputedStyle(document.documentElement)
      .getPropertyValue(`--breakpoint-${breakpointName}`)
      .trim();

    if (!breakpoint) {
      console.warn(`[x-tw] --breakpoint-${breakpointName} is not defined in @theme`);
      return;
    }

    const mql = isMax
      ? window.matchMedia(`(max-width: ${breakpoint})`)
      : window.matchMedia(`(min-width: ${breakpoint})`);
    const handler = () => {
      if (mql.matches) {
        run();
      }
    };
    handler();
    mql.addEventListener("change", handler);
    removeListener = () => mql.removeEventListener("change", handler);
  });

  cleanup(() => removeListener());
};

export default twMQDirective;
