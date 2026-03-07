import {
  fetchRevisionRequests,
  fetchStudentMarksAndCriteria,
} from "../../APIcalls/studentData";
import { Student } from "../data/marks/markCalculations";
import type { PageDataStore } from "./pageData";

const studentMarkStore = () => ({
  student: null as Student | null,
  subject: "",
  loading: true,
  async start(
    subject: string,
    name: string,
    surname: string,
    course: string,
    year: number,
    id: string,
  ) {
    this.subject = subject;
    this.student = new Student(name, surname, id, course, [subject]);
    const dataSheetId = (Alpine.store("pageData") as PageDataStore).dataSheetId;
    const [
      {
        activities,
        marks,
        criteria: { proportion, specialActivities },
        redos: studentRedos,
        fixedMarks,
      },
      inRevisionIds,
    ] = await Promise.all([
      fetchStudentMarksAndCriteria(subject, course, year, id, dataSheetId),
      fetchRevisionRequests(subject, course, year, id),
    ]);
    this.student.setProportion(subject, proportion);
    this.student.setFixedMarks(subject, fixedMarks);
    activities.forEach((activity) => {
      // Check if activity is special
      activity.compulsory = specialActivities.some(
        (spAct) => spAct === activity.id,
      );
      this.student!.setClassActivity(subject, activity);
    });
    marks.forEach((mark) => {
      this.student!.setMarkedActivity(subject, mark);
    });
    studentRedos.forEach((redo) => {
      this.student!.setRedo(subject, redo);
    });
    inRevisionIds.forEach((activityId) => {
      this.student!.setInRevision(subject, activityId);
    });
    this.student!.withRevisions = true;
    this.student!.calculateFinalMark(subject);
    this.loading = false;
  },
  get markData() {
    return { ...this.student!.getFinalMarkData(this.subject) };
  },
  get classActivities() {
    return (
      this.student
        ?.getActivities(this.subject)
        .filter((activity) => !activity.compulsory) || []
    );
  },
  get markedActivities() {
    return this.student?.getMarkedActivities(this.subject) || [];
  },
  get redos() {
    return this.student?.getRedoActivities(this.subject) || [];
  },
  get fixedMarks() {
    return this.student?.getFixedMarks(this.subject) || {};
  },
  get specialActivitiesIds() {
    return (
      this.student
        ?.getActivities(this.subject)
        .filter((activity) => activity.compulsory)
        .map((activity) => activity.id) || []
    );
  },
  specialActivities() {
    return (
      this.student
        ?.getActivities(this.subject)
        .filter((activity) => activity.compulsory) || []
    );
  },
});

export type AlpineStudentMarkStore = ReturnType<typeof studentMarkStore>;
export default studentMarkStore;
