import type { Alpine } from "alpinejs";
import type { Activity, MarkedActivity } from "./aux/types";
import {
  getActivitiesAndMarks,
  getRedos,
  getStudentData,
  getSubjectMarkingCriteria,
  getSubjectData,
  getSubjectProgram,
  getSubjectPresentation,
  getSubjectRedoLinks,
  getSubjectMaterial,
  getCourseGroupLink,
} from "./aux/fetchData";
import { fetchHTMLData, prepareCrumbs } from "./aux/loadData";
import collapse from "@alpinejs/collapse";

window.getSubjectData = getSubjectData;
window.getSubjectProgram = getSubjectProgram;
window.getSubjectPresentation = getSubjectPresentation;
window.getSubjectRedoLinks = getSubjectRedoLinks;
window.getSubjectMaterial = getSubjectMaterial;
window.getCourseLink = getCourseGroupLink;
window.fetchHTMLData = fetchHTMLData;
window.prepareCrumbs = prepareCrumbs;

export const round = (num: number, decimals: number) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const isOnCampus = () => {
  const host = window.location.host;
  return host === "campus.ort.edu.ar";
};

const courseRegex = /NR\d[A-Z]/;
const defaultStudent = { name: "Julian Ariel", surname: "Zylber" };

export default (Alpine: Alpine) => {
  Alpine.plugin(collapse);
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
    changeSection(section) {
      this.currentSection = section;
    },
    init() {
      this.changeSection("home");
    },
  } as {
    currentSection: string;
    changeSection: (section: string) => void;
  });
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
  } as {
    dataURL: string;
    changeURL: (url: string) => void;
  });
  Alpine.store("student", {
    name: "",
    surname: "",
    course: "",
    subject: "",
    id: -1,
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
    async getStudentData(subject: string, dataSheetId: string) {
      this.setSubject(subject);
      this.setDataSheetId(dataSheetId);
      let studentName = defaultStudent;
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
      let student = await getStudentData(
        studentName.name,
        studentName.surname,
        dataSheetId
      );
      if (student) {
        this.setStudent(
          student.name,
          student.surname,
          student.course,
          student.DNI
        );
      }
      if (subject !== "" && this.id !== -1) {
        this.calculateMarks();
      }
    },
    regularActivities() {
      return this.activities.filter(
        (activity) => !activity.special && !activity.inRevision
      );
    },
    specialActivities() {
      return this.activities.filter((activity) => activity.special);
    },
    markedActivities() {
      return this.marks.filter((activity) => !activity.inRevision);
    },
    allMarkedActivitiesPassed() {
      return this.markedActivities().every((activity) => activity.mark >= 6);
    },
    allSpecialActivitiesDone() {
      return this.specialActivities().every((activity) => activity.done);
    },
    async calculateMarks() {
      let [{ activities, marks }, { proportion, specialActivities }, redos] =
        await Promise.all([
          getActivitiesAndMarks(this.id, this.dataSheetId),
          getSubjectMarkingCriteria(this.subject, this.dataSheetId),
          getRedos(
            parseInt(this.course.slice(2)),
            this.name,
            this.surname,
            this.dataSheetId
          ),
        ]);
      this.activities = activities.map((activity) => ({
        ...activity,
        inRevision: redos.includes(activity.id),
        special: specialActivities.includes(activity.id),
      }));
      this.marks = marks.map((mark) => ({
        ...mark,
        inRevision: redos.includes(mark.id),
      }));
      this.markData.proportion = proportion;
      // Esta cuenta no tiene en cuenta que un estudiante pueda estar en múltiples materias
      this.markData.activities.total = this.regularActivities().length;
      this.markData.markedActivities.total = this.markedActivities().length;
      this.markData.activities.done = this.regularActivities().filter(
        (activity) => activity.done
      ).length;
      this.markData.markedActivities.passed = this.markedActivities().filter(
        (activity) => activity.mark >= 6
      ).length;
      this.markData.activities.markContribution =
        this.markData.activities.total > 0
          ? round(
              (this.markData.activities.done / this.markData.activities.total) *
                (1 - proportion) *
                10,
              2
            )
          : 10 * (1 - proportion);
      this.markData.markedActivities.markContribution =
        this.markData.markedActivities.total > 0
          ? round(
              (this.marks
                .filter((activity) => !redos.includes(activity.id))
                .reduce((acc, m) => acc + m.mark, 0) /
                this.markData.markedActivities.total) *
                proportion,
              2
            )
          : 10 * proportion;
      this.markData.averageMark = round(
        this.markData.activities.markContribution +
          this.markData.markedActivities.markContribution,
        2
      );
      const allSpecialActivitiesDone = this.allSpecialActivitiesDone();
      const allMarkedActivitiesPassed = this.allMarkedActivitiesPassed();
      this.markData.finalMark =
        allSpecialActivitiesDone && allMarkedActivitiesPassed
          ? Math.round(this.markData.averageMark)
          : Math.min(4, Math.round(this.markData.averageMark));
      if (
        this.markData.activities.total === 0 &&
        this.markData.markedActivities.total === 0
      ) {
        this.markData.finalMark = null;
      }
    },
  } as {
    name: string;
    surname: string;
    course: string;
    subject: string;
    id: number;
    activities: Array<Activity>;
    marks: Array<MarkedActivity>;
    markData: {
      finalMark: number | null;
      averageMark: number;
      proportion: number;
      activities: {
        markContribution: number;
        total: number;
        done: number;
      };
      markedActivities: {
        markContribution: number;
        total: number;
        passed: number;
      };
    };
    dataSheetId: string;
    setStudent: (
      name: string,
      surname: string,
      course: string,
      id: number
    ) => void;
    setSubject: (subject: string) => void;
    setDataSheetId: (dataSheetId: string) => void;
    regularActivities: () => Array<Activity>;
    specialActivities: () => Array<Activity>;
    markedActivities: () => Array<MarkedActivity>;
    allSpecialActivitiesDone: () => boolean;
    allMarkedActivitiesPassed: () => boolean;
    calculateMarks: () => Promise<void>;
    getStudentData: (subject: string, dataSheetId: string) => Promise<void>;
  });
  const shadowContainer = document.querySelector("#campus-insertion");
  if (shadowContainer !== null && isOnCampus()) {
    // Butchering of types but OH WELL
    const shadow = shadowContainer.shadowRoot as unknown as HTMLElement;
    Alpine.initTree(shadow);
  }
};
