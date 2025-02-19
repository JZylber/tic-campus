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
import { fetchHTMLData } from "./aux/loadData";

window.getSubjectData = getSubjectData;
window.getSubjectProgram = getSubjectProgram;
window.getSubjectPresentation = getSubjectPresentation;
window.getSubjectRedoLinks = getSubjectRedoLinks;
window.getSubjectMaterial = getSubjectMaterial;
window.getCourseLink = getCourseGroupLink;
window.fetchHTMLData = fetchHTMLData;

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
    setStudent(name: string, surname: string, course: string, id: number) {
      if (!courseRegex.test(course)) {
        throw new Error(`Invalid course name: ${course}`);
      }
      this.name = name;
      this.surname = surname;
      this.course = course;
      this.id = id;
      if (this.subject !== "" && this.id !== -1) {
        this.calculateMarks();
      }
    },
    setSubject(subject: string) {
      this.subject = subject;
      if (subject !== "" && this.id !== -1) {
        this.calculateMarks();
      }
    },
    async init() {
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
      let student = await getStudentData(studentName.name, studentName.surname);
      if (student) {
        this.setStudent(
          student.name,
          student.surname,
          student.course,
          student.id
        );
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
          getActivitiesAndMarks(this.id),
          getSubjectMarkingCriteria(this.subject),
          getRedos(parseInt(this.course.slice(2)), this.name, this.surname),
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
    setStudent: (
      name: string,
      surname: string,
      course: string,
      id: number
    ) => void;
    setSubject: (subject: string) => void;
    regularActivities: () => Array<Activity>;
    specialActivities: () => Array<Activity>;
    markedActivities: () => Array<MarkedActivity>;
    allSpecialActivitiesDone: () => boolean;
    allMarkedActivitiesPassed: () => boolean;
    calculateMarks: () => Promise<void>;
  });
  const shadowContainer = document.querySelector("#campus-insertion");
  if (shadowContainer !== null && isOnCampus()) {
    // Butchering of types but OH WELL
    const shadow = shadowContainer.shadowRoot as unknown as HTMLElement;
    Alpine.initTree(shadow);
  }
};
