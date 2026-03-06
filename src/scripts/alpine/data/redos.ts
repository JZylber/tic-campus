import type { AlpineComponent } from "alpinejs";

type Student = {
  name: string;
  surname: string;
  id: string;
  course: string;
  year: number;
};

type AlpineRedoData = AlpineComponent<{
  students: Array<Student>;
  studentIds: Array<string>;
  activityId: string;
  reason: string;
  bonusTask: string;
  comment: string;
  remainingStudents: Array<Student>;
  selectedStudents: Array<Student>;
}>;

const redoData = (students: Array<Student>) => {
  return {
    students: students,
    studentIds: [] as Array<string>,
    activityId: "",
    reason: "",
    bonusTask: "",
    comment: "",
    get selectedStudents() {
      return this.students.filter((student) =>
        this.studentIds.includes(student.id),
      );
    },
    get remainingStudents() {
      return this.students.filter(
        (student) => !this.studentIds.includes(student.id),
      );
    },
    reset() {
      this.studentIds = [];
      this.activityId = "";
      this.reason = "";
      this.bonusTask = "";
      this.comment = "";
    },
  } as AlpineRedoData;
};

export default redoData;
