import type { Alpine } from "alpinejs";
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
} from "./aux/fetchData";
import { fetchHTMLData, prepareCrumbs } from "./aux/loadData";
import collapse from "@alpinejs/collapse";
import persist from "@alpinejs/persist";

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

const courseRegex = /NR\d[A-Z]/;

interface AlpineSectionStore {
  currentSection: string;
  currentSectionIndex: number;
  changeSection: (section: string, index: number) => void;
}

export default (Alpine: Alpine) => {
  Alpine.plugin(collapse);
  Alpine.plugin(persist);
  Alpine.directive(
    "tw",
    (
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
        breakpoint = rootStyles.getPropertyValue(
          `--breakpoint-${value.slice(4)}`
        );
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
    }
  );
  Alpine.store("section", {
    currentSection: "",
    currentSectionIndex: -1,
    changeSection(section, index) {
      this.currentSection = section;
      this.currentSectionIndex = index;
    },
    init() {
      this.changeSection("home", 0);
    },
  } as AlpineSectionStore);
  Alpine.store("baseURL", {
    dataURL: "/tic-campus",
    changeURL(url) {
      this.dataURL = url;
    },
    init() {
      if (isOnCampus()) {
        this.changeURL("https://jzylber.github.io" + this.dataURL);
      }
    },
    publicURL(url) {
      return `${this.dataURL}/${url}`;
    },
  } as {
    dataURL: string;
    changeURL: (url: string) => void;
    publicURL: (url: string) => void;
  });
  Alpine.store("student", {
    name: Alpine.$persist(""),
    surname: Alpine.$persist(""),
    course: Alpine.$persist(""),
    subject: Alpine.$persist(""),
    id: Alpine.$persist(-1),
    activities: [],
    marks: [],
    markData: {
      finalMark: null,
      averageMark: 0,
      proportion: 1,
      activities: {
        markContribution: 0,
        total: 0,
        done: 0,
      },
      markedActivities: {
        markContribution: 0,
        total: 0,
        passed: 0,
      },
    },
    dataSheetId: "",
    setStudent(name: string, surname: string, course: string, id: number) {
      if (!courseRegex.test(course)) {
        throw new Error(`Invalid course name: ${course}`);
      }
      this.name = name;
      this.surname = surname;
      this.course = course;
      this.id = id;
    },
    setSubject(subject: string) {
      this.subject = subject;
    },
    setDataSheetId(dataSheetId: string) {
      this.dataSheetId = dataSheetId;
    },
    async getStudentData(subject: string, course: string, dataSheetId: string) {
      this.setSubject(subject);
      this.setDataSheetId(dataSheetId);
      let studentName = null;
      if (isOnCampus()) {
        const data = await fetch(
          "https://campus.ort.edu.ar/ajaxactions/GetLoggedInData",
          {
            headers: {
              accept: "application/json",
            },
          }
        ).then((res) => res.json());
        const studentData = data.nombre.split("<br/>");
        studentName = {
          name: studentData[0],
          surname: studentData[1],
        };
      }
      let student = null;
      if (studentName) {
        student = await getStudentData(
          studentName.name,
          studentName.surname,
          course,
          dataSheetId
        );
      }
      if (student) {
        this.setStudent(
          student.name,
          student.surname,
          student.course,
          student.DNI
        );
      }
      if (subject !== "" && this.id !== -1) {
        if (course === this.course) {
          (Alpine.store("section") as AlpineSectionStore).changeSection(
            "actividades",
            1
          );
        }
      }
    },
  } as {
    name: any;
    surname: any;
    course: any;
    subject: any;
    id: any;
    dataSheetId: string;
    setStudent: (
      name: string,
      surname: string,
      course: string,
      id: number
    ) => void;
    setSubject: (subject: string) => void;
    setDataSheetId: (dataSheetId: string) => void;
    getStudentData: (
      subject: string,
      course: string,
      dataSheetId: string
    ) => Promise<void>;
  });
  const shadowContainer = document.querySelector("#campus-insertion");
  if (shadowContainer !== null && isOnCampus()) {
    // Butchering of types but OH WELL
    const shadow = shadowContainer.shadowRoot as unknown as HTMLElement;
    Alpine.initTree(shadow);
  }
};
