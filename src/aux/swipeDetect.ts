const ALLOWED_SWIPE_TIME = 300;

class SwipeDetect {
  target: HTMLElement;
  callback: (direction: string) => void;
  threshold: number;
  startX: number;
  startY: number;
  startTime: number;
  constructor(
    target: HTMLElement,
    callback: (direction: string) => void,
    threshold: number
  ) {
    this.target = target;
    this.callback = callback;
    this.threshold = threshold;
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;

    this.enable();
  }

  enable() {
    this.target.addEventListener(
      "touchstart",
      this.recordTouchStartValues.bind(this)
    );
    this.target.addEventListener(
      "touchend",
      this.detectSwipeDirection.bind(this)
    );
  }

  disable() {
    this.target.removeEventListener(
      "touchstart",
      this.recordTouchStartValues.bind(this)
    );
    this.target.removeEventListener(
      "touchend",
      this.detectSwipeDirection.bind(this)
    );
  }

  recordTouchStartValues(e: TouchEvent) {
    const touch = e.changedTouches[0];

    this.startX = touch.pageX;
    this.startY = touch.pageY;
    this.startTime = new Date().getTime();
  }

  detectSwipeDirection(e: TouchEvent) {
    const touch = e.changedTouches[0];
    const distX = touch.pageX - this.startX;
    const distY = touch.pageY - this.startY;
    const absX = Math.abs(distX);
    const absY = Math.abs(distY);
    const elapsedTime = new Date().getTime() - this.startTime;

    if (elapsedTime > ALLOWED_SWIPE_TIME) return;

    switch (true) {
      case absX >= this.threshold && absX > absY && distX < 0:
        this.callback("left");
        break;
      case absX >= this.threshold && absX > absY && distX > 0:
        this.callback("right");
        break;
      case absY >= this.threshold && absY > absX && distY < 0:
        this.callback("up");
        break;
      case absY >= this.threshold && absY > absX && distY > 0:
        this.callback("down");
        break;
    }
  }
}

function detectSwipe(
  target: HTMLElement,
  callback: (direction: string) => void,
  threshold: number = 150
): SwipeDetect {
  return new SwipeDetect(target, callback, threshold);
}

export default detectSwipe;
