import type { AlpineComponent } from "alpinejs";

const setAlpineStore = (name: string, component: AlpineComponent<any>) => {
  // If Alpine has initialized, set the data immediately, else, wrap in addEventListener
  if (window.Alpine) {
    window.Alpine.store(name, component);
  } else {
    document.addEventListener("alpine:init", () => {
      window.Alpine.store(name, component);
    });
  }
};

export default setAlpineStore;
