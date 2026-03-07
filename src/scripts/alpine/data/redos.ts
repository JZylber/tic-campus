import type { AlpineComponent } from "alpinejs";
import { submitRevisionRequest } from "../../APIcalls/studentData";

type Student = {
  name: string;
  surname: string;
  id: string;
  course: string;
  year: number;
};

type AlpineRedoData = AlpineComponent<{
  students: Array<Student>;
  subject: string;
  course: string;
  year: number;
  studentIds: Array<string>;
  activityId: string;
  reason: string;
  bonusTask: string;
  comment: string;
  missingFields: {
    studentIds: boolean;
    activityId: boolean;
    reason: boolean;
  };
  status: {
    success: boolean;
    message: string;
  };
  remainingStudents: Array<Student>;
  selectedStudents: Array<Student>;
  sendingRequest: boolean;
  reset: () => void;
  requestRedo: () => void;
}>;

const redoData = (
  students: Array<Student>,
  subject: string,
  course: string,
  year: number,
) => {
  return {
    students: students,
    subject,
    course,
    year,
    studentIds: [] as Array<string>,
    activityId: "",
    reason: "",
    bonusTask: "",
    comment: "",
    missingFields: {
      studentIds: false,
      activityId: false,
      reason: false,
    },
    status: {
      success: false,
      message: "",
    },
    sendingRequest: false,
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
      this.missingFields = {
        studentIds: false,
        activityId: false,
        reason: false,
      };
      this.status = {
        success: false,
        message: "",
      };
    },
    async requestRedo() {
      // Check if all fields are filled
      this.missingFields.studentIds = !this.studentIds.length;
      this.missingFields.activityId = !this.activityId;
      this.missingFields.reason = !this.reason;
      if (Object.values(this.missingFields).includes(true)) {
        this.sendingRequest = false;
        return;
      }
      this.sendingRequest = true;
      /*await submitRevisionRequest(
        subject,
        course,
        year,
        this.studentIds,
        this.activityId,
        this.reason,
        this.bonusTask,
        this.comment,
      ).then((response) => {
        this.status = response;
      });*/
      this.sendingRequest = false;
    },
  } as AlpineRedoData;
};

export default redoData;
