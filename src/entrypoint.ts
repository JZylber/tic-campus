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
  getTimetable,
  getStudentSeminars,
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

const daysOfWeek = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

interface AlpineSectionStore {
  currentSection: string;
  currentSectionIndex: number;
  changeSection: (section: string, index: number) => void;
}

interface AlpineTimetableStore {
  timetable: {
    [key: string]: Array<{
      day: string;
      block: number;
      room: string;
      teacher: string;
    }>;
  };
  seminars: Array<string>;
  setTimetable: (dataSheetId: string) => void;
  setSeminars: (dataSheetId: string, studentId: number) => Promise<void>;
  getTimetableByGridPos: (
    row: number,
    col: number
  ) => Array<{
    subject: string;
    room: string;
    teacher: string;
  }>;
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
  Alpine.store("timetable", {
    timetable: {},
    seminars: [],
    async setTimetable(dataSheetId: string) {
      this.timetable = await getTimetable(dataSheetId);
    },
    async setSeminars(dataSheetId: string, studentId: number) {
      this.seminars = await getStudentSeminars(studentId, dataSheetId);
    },
    getTimetableByGridPos(row: number, col: number) {
      const slots = [];
      for (const [subject, blocks] of Object.entries(this.timetable)) {
        for (const block of blocks) {
          slots.push({
            coordinates: [
              block.block + (block.block > 3 ? 1 : 0), // Adjust for the 4th block being a different row
              daysOfWeek.indexOf(block.day) + 1,
            ],
            data: {
              subject,
              room: block.room,
              teacher: block.teacher,
            },
          });
        }
      }
      // Sort by "Proyecto" last
      return slots
        .filter((slot) => {
          return slot.coordinates[0] === row && slot.coordinates[1] === col;
        })
        .map((slot) => slot.data)
        .sort((a, b) => {
          if (a.subject === "Proyecto") return 1;
          if (b.subject === "Proyecto") return -1;
          return 0;
        });
    },
  } as AlpineTimetableStore);
  Alpine.store("student", {
    name: Alpine.$persist("").using(sessionStorage),
    surname: Alpine.$persist("").using(sessionStorage),
    course: Alpine.$persist("").using(sessionStorage),
    subject: Alpine.$persist("").using(sessionStorage),
    id: Alpine.$persist(-1).using(sessionStorage),
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
      (Alpine.store("timetable") as AlpineTimetableStore).setTimetable(
        dataSheetId
      );
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
      if (subject !== "" && this.id !== -1 && course === this.course) {
        (Alpine.store("section") as AlpineSectionStore).changeSection(
          "actividades",
          1
        );
        (Alpine.store("timetable") as AlpineTimetableStore).setSeminars(
          dataSheetId,
          this.id
        );
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
