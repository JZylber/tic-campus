import { type Alpine } from "alpinejs";
import collapse from "@alpinejs/collapse";
import persist from "@alpinejs/persist";
import twMQDirective from "./scripts/alpine/directives/twMediaQuery";
import swipeDirective from "./scripts/alpine/directives/swipe";
import pageData from "./scripts/alpine/stores/pageData";
import courseStore from "./scripts/alpine/stores/course";
import studentStore from "./scripts/alpine/stores/student";

export default (Alpine: Alpine) => {
  Alpine.plugin(collapse);
  Alpine.plugin(persist);
  Alpine.directive("tw", twMQDirective);
  Alpine.directive("swipe", swipeDirective);
  Alpine.store("pageData", pageData());
  Alpine.store("course", courseStore());
  Alpine.store("student", studentStore(Alpine));
};
