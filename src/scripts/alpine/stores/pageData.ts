import { downloadBlob } from "../../csv";

const isOnCampus = () => {
  const host = window.location.host;
  return host === "campus.ort.edu.ar";
};

const pageData = () => {
  return {
    dataSheetId: "",
    dataURL: "/tic-campus",
    onCampus: false,
    setDataSheetId(id: string) {
      this.dataSheetId = id;
    },
    init() {
      if (isOnCampus()) {
        this.onCampus = true;
        this.dataURL = "https://jzylber.github.io" + this.dataURL;
      }
    },
    publicURL(url: string) {
      return `${this.dataURL}/${url}`;
    },
    downloadFileHandler(filePath: string) {
      return async (event: MouseEvent) => {
        // Prevent default anchor behavior if used on an <a> tag
        event.preventDefault();
        try {
          const response = await fetch(this.publicURL(filePath), {
            method: "GET",
            mode: "cors",
          });

          if (!response.ok) throw new Error("Resource fetch failed");

          downloadBlob(
            await response.blob(),
            filePath.split("/").pop() || "archivo",
          );
        } catch (error) {
          console.error("Download failed:", error);
          alert("Could not download file. Check CORS settings.");
        }
      };
    },
  };
};
export default pageData;
export type PageDataStore = ReturnType<typeof pageData>;
