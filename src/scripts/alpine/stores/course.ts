import type { Unit } from "../../types";

export const courseRegex = /NR\d[A-Z0-9]/;

interface CourseActivity {
  id: string;
  name: string;
  type: string;
  inProgress: boolean;
  optional: boolean;
}

const courseStore = () => ({
  course: "",
  activities: [] as Array<CourseActivity>,
  setCourse(course: string) {
    if (!courseRegex.test(course)) {
      throw new Error(`Invalid course name: ${course}`);
    }
    this.course = course;
  },
  setActivities(activitiesXUnit: Array<Unit>) {
    // Get all unit contents into a single array
    let activitiesArray = activitiesXUnit.reverse().flatMap((unit) => {
      return unit.contents.map((content) => ({
        id: content.id,
        name: content.name,
        type: content.type,
        inProgress: content.latest,
        optional: content.optional,
      }));
    });
    // Filter keep only types 'Trabajo Práctico', 'Actividad' and 'Encuesta'
    activitiesArray = activitiesArray.filter((activity) => {
      return (
        activity.type === "Trabajo Práctico" ||
        activity.type === "Actividad" ||
        activity.type === "Encuesta"
      );
    });
    this.activities = activitiesArray;
  },
  getRedoableActivities() {
    //Return only activities that are of type 'Trabajo Práctico' or 'Actividad'
    return this.activities.filter(
      (activity) =>
        activity.type === "Trabajo Práctico" || activity.type === "Actividad",
    );
  },
});

export type AlpineCourseStore = ReturnType<typeof courseStore>;
export default courseStore;
