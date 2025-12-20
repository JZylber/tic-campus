const isOnCampus = () => {
  const host = window.location.host;
  return host === "campus.ort.edu.ar";
};

const pageData = () => {
  return {
    dataSheetId: "",
    dataURL: "/tic-campus",
    onCampus: false,
    changeURL(url: string) {
      this.dataURL = url;
    },
    setDataSheetId(id: string) {
      this.dataSheetId = id;
    },
    init() {
      if (isOnCampus()) {
        this.onCampus = true;
        this.changeURL("https://jzylber.github.io" + this.dataURL);
      }
    },
    publicURL(url: string) {
      return `${this.dataURL}/${url}`;
    },
  };
};
export default pageData;
export type PageDataStore = ReturnType<typeof pageData>;
