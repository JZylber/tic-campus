import { type Alpine } from "alpinejs";
import {
  getStudentData,
  getSubjectData,
  getSubjectProgram,
  getSubjectPresentation,
  getSubjectRedoLinks,
  getSubjectMaterial,
  getCourseGroupLink,
  getFixedMarks,
  getStudents,
} from "./scripts/fetchData";
import { fetchHTMLData, prepareCrumbs } from "./scripts/loadData";
import collapse from "@alpinejs/collapse";
import persist from "@alpinejs/persist";
import markCalculations from "./scripts/alpine/data/markCalculations";
import twMQDirective from "./scripts/alpine/directives/twMediaQuery";
import swipeDirective from "./scripts/alpine/directives/swipe";
import pageData from "./scripts/alpine/stores/pageData";
import sectionData, {
  type AlpineSectionStore,
} from "./scripts/alpine/data/section";
import courseStore from "./scripts/alpine/stores/course";
import studentStore from "./scripts/alpine/stores/student";

window.getSubjectData = getSubjectData;
window.getSubjectProgram = getSubjectProgram;
window.getSubjectPresentation = getSubjectPresentation;
window.getSubjectRedoLinks = getSubjectRedoLinks;
window.getSubjectMaterial = getSubjectMaterial;
window.getCourseLink = getCourseGroupLink;
window.fetchHTMLData = fetchHTMLData;
window.prepareCrumbs = prepareCrumbs;
window.getFixedMarks = getFixedMarks;
window.getStudents = getStudents;

export const round = (num: number, decimals: number) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const isOnCampus = () => {
  const host = window.location.host;
  return host === "campus.ort.edu.ar";
};

export default (Alpine: Alpine) => {
  Alpine.plugin(collapse);
  Alpine.plugin(persist);
  Alpine.directive("tw", twMQDirective);
  Alpine.directive("swipe", swipeDirective);
  Alpine.store("pageData", pageData());
  Alpine.store("course", courseStore());
  Alpine.store("student", studentStore(Alpine));
  Alpine.data("markCalculations", markCalculations);
};
