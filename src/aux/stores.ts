import Alpine from "alpinejs";

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
