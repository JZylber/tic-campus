import type { Alpine } from "alpinejs";

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
    dataURL: "",
    changeURL(url) {
      this.dataURL = url;
    },
    init() {
      if (isOnCampus()) {
        this.changeURL("https://jzylber.github.io/tic-campus");
      }
    },
  } as {
    dataURL: string;
    changeURL: (url: string) => void;
  });
};
