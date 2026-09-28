import type { DirectiveCallback } from "alpinejs";

const MAX_SWIPE_MS = 300;
const MIN_SWIPE_PX = 50;

// x-swipe:left="…" runs on a left swipe (likewise right/up/down); a bare
// x-swipe="…" runs on any swipe, receiving the direction as its argument.
const swipeDirective: DirectiveCallback = (
  el,
  { value, expression },
  { evaluateLater, cleanup },
) => {
  const evaluate = evaluateLater(expression);
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const onStart = (e: TouchEvent) => {
    ({ pageX: startX, pageY: startY } = e.changedTouches[0]);
    startTime = Date.now();
  };
  const onEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].pageX - startX;
    const dy = e.changedTouches[0].pageY - startY;
    if (Date.now() - startTime > MAX_SWIPE_MS) return;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_SWIPE_PX) return;
    const direction =
      Math.abs(dx) > Math.abs(dy)
        ? dx < 0 ? "left" : "right"
        : dy < 0 ? "up" : "down";
    if (!value || value === direction) {
      evaluate(() => {}, { scope: {}, params: [direction] });
    }
  };

  el.addEventListener("touchstart", onStart);
  el.addEventListener("touchend", onEnd);
  cleanup(() => {
    el.removeEventListener("touchstart", onStart);
    el.removeEventListener("touchend", onEnd);
  });
};

export default swipeDirective;
