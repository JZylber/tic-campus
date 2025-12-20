import type { AlpineComponent } from "alpinejs";

const setAlpineData = (name: string, component: AlpineComponent<any>) => {
  // If Alpine has initialized, set the data immediately, else, wrap in addEventListener
  if (Alpine) {
    Alpine.data(name, component);
  } else {
    document.addEventListener("alpine:init", () => {
      Alpine.data(name, component);
    });
  }
};

export default setAlpineData;
