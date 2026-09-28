import { alpineData } from "../setAlpineData";
import type { AlpineCourseStore } from "../stores/course";
import type { AlpineStudentStore } from "../stores/student";

const sectionData = () =>
  alpineData({
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
      this.$watch("$store.student.course", (value: string) => {
        const pageCourse = (Alpine.store("course") as AlpineCourseStore).course;
        this.sectionChangeOnData(value, pageCourse);
      });
      this.$watch("$store.course.course", (value: string) => {
        const studentCourse = (Alpine.store("student") as AlpineStudentStore)
          .course;
        this.sectionChangeOnData(studentCourse, value);
      });
    },
  });

export default sectionData;
