import type { Alpine } from "alpinejs";
import type { Activity, MarkedActivity } from "./aux/types";
import { getStudentData } from "./aux/fetchData";
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
      console.log(student);
      if (student) {
        this.setStudent(
          student.name,
          student.surname,
          student.course,
          student.id
        );
      }
    },
  } as {
    name: string;
    surname: string;
    course: string;
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
  });
  const shadowContainer = document.querySelector("#campus-insertion");
  if (shadowContainer !== null && isOnCampus()) {
    // Butchering of types but OH WELL
    const shadow = shadowContainer.shadowRoot as unknown as HTMLElement;
    Alpine.initTree(shadow);
  }
};
