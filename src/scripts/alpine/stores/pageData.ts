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

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filePath.split("/").pop() || "archivo";
          document.body.appendChild(link);
          link.click();

          // Cleanup
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
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
