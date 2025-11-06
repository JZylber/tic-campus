import type { DirectiveCallback } from "alpinejs";

const twDirective: DirectiveCallback = (
  el,
  { value, expression, modifiers },
  { Alpine, evaluateLater, evaluate, effect, cleanup }
) => {
  // Set up the expression to be evaluated later in the listener callback
  const run = evaluateLater(expression);

  const rootStyles = getComputedStyle(document.documentElement);
  const isMax = value.startsWith("max");
  let breakpoint = "";
  if (isMax) {
    breakpoint = rootStyles.getPropertyValue(`--breakpoint-${value.slice(4)}`);
  } else {
    breakpoint = rootStyles.getPropertyValue(`--breakpoint-${value}`);
  }
  const mql = isMax
    ? window.matchMedia(`(max-width: ${breakpoint})`)
    : window.matchMedia(`(min-width: ${breakpoint})`);
  const handler = () => {
    if (mql.matches) {
      effect(() => run());
    }
  };
  handler();
  mql.onchange = handler;
  // Be sure you clean up your listeners as a best practice
  cleanup(() => mql.removeEventListener("change", handler));
};

export default twDirective;
