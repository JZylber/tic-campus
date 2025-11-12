const sectionStore = () => {
  return {
    currentSection: "",
    currentSectionIndex: -1,
    changeSection(section: string, index: number) {
      this.currentSection = section;
      this.currentSectionIndex = index;
    },
    init() {
      this.changeSection("home", 0);
    },
  };
};

type AlpineSectionStore = ReturnType<typeof sectionStore>;

export type { AlpineSectionStore };
export default sectionStore;
