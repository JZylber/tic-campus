import {
  getActivitiesAndMarks,
  getRedos,
  getSubjectMarkingCriteria,
} from "../../fetchData";
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
    id: string
  ) {
    this.subject = subject;
    this.student = new Student(name, surname, id, course, [subject]);
    const dataSheetId = (Alpine.store("pageData") as PageDataStore).dataSheetId;
    const year = parseInt(this.student.course[2]);
    const [
      { activities, marks, studentRedos },
      { proportion, specialActivities },
      inRevisionIds,
    ] = await Promise.all([
      getActivitiesAndMarks(parseInt(this.student.id), dataSheetId),
      getSubjectMarkingCriteria(subject, dataSheetId),
      getRedos(year, this.student.name, this.student.surname, dataSheetId),
    ]);
    this.student.setProportion(subject, proportion);
    activities.forEach((activity) => {
      // Check if activity is special
      activity.compulsory = specialActivities.some(
        (spAct) => spAct === parseInt(activity.id)
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
    this.student!.calculateFinalMark(subject);
    this.loading = false;
  },
  allMarkedActivitiesPassed() {
    return this.student!.getFinalMarkData(this.subject)
      .allMarkedActivitiesPassed;
  },
  allSpecialActivitiesDone() {
    return this.student!.getFinalMarkData(this.subject)
      .allCompulsoryClassActivitiesDone;
  },
  get markData() {
    return { ...this.student!.getFinalMarkData(this.subject) };
  },
  get regularActivities() {
    const activities = this.student!.getActivities(this.subject).filter(
      (activity) => !activity.compulsory && !activity.inRevision
    );
    return {
      all: activities,
      total: activities.length,
      done: activities.filter((act) => act.done).length,
    };
  },
  get markedActivities() {
    const activities = this.student!.getMarkedActivities(this.subject).filter(
      (activity) => !activity.inRevision
    );
    return {
      all: activities,
      total: activities.length,
      passed: activities.filter((act) => act.mark >= 6).length,
    };
  },
  get redos() {
    return this.student!.getRedoActivities(this.subject);
  },
  get specialActivitiesIds() {
    return this.student!.getActivities(this.subject)
      .filter((activity) => activity.compulsory)
      .map((activity) => activity.id);
  },
  specialActivities() {
    return this.student!.getActivities(this.subject).filter(
      (activity) => activity.compulsory
    );
  },
});

export type AlpineStudentMarkStore = ReturnType<typeof studentMarkStore>;
export default studentMarkStore;
