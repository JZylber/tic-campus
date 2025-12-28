import type { AlpineComponent } from "alpinejs";
import type { AlpineCourseStore } from "../stores/course";
import type { AlpineStudentStore } from "../stores/student";

const sectionData = () => {
  return {
    currentSection: "",
    currentSectionIndex: -1,
    changeSection(section: string, index: number) {
      this.currentSection = section;
      this.currentSectionIndex = index;
    },
    sectionChangeOnData(studentCourse: string, pageCourse: string) {
      if (
        this.currentSection === "home" &&
        studentCourse !== "" &&
        studentCourse === pageCourse
      ) {
        this.changeSection("actividades", 1);
      }
    },
    init() {
      this.changeSection("home", 0);
      const pageCourse = (Alpine.store("course") as AlpineCourseStore).course;
      const studentCourse = (Alpine.store("student") as AlpineStudentStore)
        .course;
      this.sectionChangeOnData(studentCourse, pageCourse);
      // Mirar cambios en el curso del estudiant y del curso de la página
      this.$watch(
        "$store.student.course",
        (value: string, oldValue: string) => {
          const pageCourse = (Alpine.store("course") as AlpineCourseStore)
            .course;
          this.sectionChangeOnData(value, pageCourse);
        }
      );
      this.$watch("$store.course.course", (value: string, oldValue: string) => {
        const studentCourse = (Alpine.store("student") as AlpineStudentStore)
          .course;
        this.sectionChangeOnData(studentCourse, value);
      });
    },
  } as AlpineComponent<{
    currentSection: string;
    currentSectionIndex: number;
    sectionChangeOnData: (studentCourse: string, pageCourse: string) => void;
    changeSection: (section: string, index: number) => void;
  }>;
};

type AlpineSectionData = ReturnType<typeof sectionData>;

export type { AlpineSectionData as AlpineSectionStore };
export default sectionData;
