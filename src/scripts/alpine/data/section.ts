import type { AlpineComponent } from "alpinejs";
import type { AlpineCourseStore } from "../stores/course";

const sectionData = () => {
  return {
    currentSection: "",
    currentSectionIndex: -1,
    changeSection(section: string, index: number) {
      this.currentSection = section;
      this.currentSectionIndex = index;
    },
    init() {
      this.changeSection("home", 0);
      // Cambiar a actividades si se cargó al estudiante y coincide el curso
      this.$watch(
        "$store.student.course",
        (value: string, oldValue: string) => {
          const course = (Alpine.store("student") as AlpineCourseStore).course;
          if (oldValue === "" && value !== "" && course === value) {
            this.changeSection("actividades", 1);
          }
        }
      );
    },
  } as AlpineComponent<{
    currentSection: string;
    currentSectionIndex: number;
    changeSection: (section: string, index: number) => void;
  }>;
};

type AlpineSectionData = ReturnType<typeof sectionData>;

export type { AlpineSectionData as AlpineSectionStore };
export default sectionData;
