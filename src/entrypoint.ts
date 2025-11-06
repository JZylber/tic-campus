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
} from "./scripts/fetchData";
import { fetchHTMLData, prepareCrumbs } from "./scripts/loadData";
import collapse from "@alpinejs/collapse";
import persist from "@alpinejs/persist";
import type { Unit } from "./scripts/types";
import markCalculations from "./scripts/alpine/data/markCalculations";
import twMQDirective from "./scripts/alpine/directives/twMediaQuery";
import swipeDirective from "./scripts/alpine/directives/swipe";
import pageData from "./scripts/alpine/stores/pageData";

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
const courseRegex = /NR\d[A-Z]/;

const isOnCampus = () => {
  const host = window.location.host;
  return host === "campus.ort.edu.ar";
};

interface CourseActivity {
  id: number;
  name: string;
  type: string;
  inProgress: boolean;
  optional: boolean;
}

interface AlpineSectionStore {
  currentSection: string;
  currentSectionIndex: number;
  changeSection: (section: string, index: number) => void;
}

export default (Alpine: Alpine) => {
  Alpine.plugin(collapse);
  Alpine.plugin(persist);
  Alpine.directive("tw", twMQDirective);
  Alpine.directive("swipe", swipeDirective);
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
  Alpine.store("baseURL", pageData());

  Alpine.store("course", {
    course: "",
    activities: [],
    setCourse(course: string) {
      if (!courseRegex.test(course)) {
        throw new Error(`Invalid course name: ${course}`);
      }
      this.course = course;
    },
    setActivities(activitiesXUnit: Array<Unit>) {
      // Get all unit contents into a single array
      let activitiesArray = activitiesXUnit.reverse().flatMap((unit) => {
        return unit.contents.map((content) => ({
          id: content.id,
          name: content.name,
          type: content.type,
          inProgress: content.latest,
          optional: content.optional,
        }));
      });
      // Filter keep only types 'Trabajo Práctico', 'Actividad' and 'Encuesta'
      activitiesArray = activitiesArray.filter((activity) => {
        return (
          activity.type === "Trabajo Práctico" ||
          activity.type === "Actividad" ||
          activity.type === "Encuesta"
        );
      });
      this.activities = activitiesArray;
    },
  } as {
    course: string;
    activities: Array<CourseActivity>;
    setCourse: (course: string) => void;
    setActivities: (activitiesXUnit: Array<Unit>) => void;
  });
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
  Alpine.data("markCalculations", markCalculations);
};
