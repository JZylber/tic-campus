import type { Alpine } from "alpinejs";
import type { Activity, MarkedActivity } from "./aux/types";
const isOnCampus = () => {
  const host = window.location.host;
  return host === "campus.ort.edu.ar";
};

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
  });
  const shadowContainer = document.querySelector("#campus-insertion");
  if (shadowContainer !== null && isOnCampus()) {
    // Butchering of types but OH WELL
    const shadow = shadowContainer.shadowRoot as unknown as HTMLElement;
    Alpine.initTree(shadow);
  }
};
