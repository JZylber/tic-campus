import type { AlpineComponent } from "alpinejs";

// Component <script>s can run before or after Alpine boots, so register
// right away if Alpine is there, else on alpine:init.
const whenAlpine = (register: () => void) => {
  if (window.Alpine) register();
  else document.addEventListener("alpine:init", register);
};

const setAlpineData = (name: string, component: AlpineComponent<any>) =>
  whenAlpine(() => window.Alpine.data(name, component));

export const setAlpineStore = (name: string, store: unknown) =>
  whenAlpine(() => window.Alpine.store(name, store));

export default setAlpineData;

// Types `this` in an x-data object (its own fields plus $watch, $refs, …)
// by inference, instead of restating the object's shape.
export const alpineData = <T>(data: AlpineComponent<T>) => data;
