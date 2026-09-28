import type { AlpineStudentMarkStore } from "../../stores/marks";

const markSummaryData = (subject: string) =>
  ({
    student: (Alpine.store("marks") as AlpineStudentMarkStore).student,
    subject: subject,
    get allMarkedActivitiesPassed() {
      return this.student!.getFinalMarkData(this.subject)
        .allMarkedActivitiesPassed;
    },
    get allSpecialActivitiesDone() {
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
        total: activities.length,
        done: activities.filter((act) => act.done).length,
      };
    },
    get markedActivities() {
      const activities = this.student!.getMarkedActivities(this.subject).filter(
        (activity) => !activity.inRevision
      );
      return {
        total: activities.length,
        passed: activities.filter((act) => act.mark >= 6).length,
      };
    },
    get specialActivities() {
      return this.student!.getActivities(this.subject).filter(
        (activity) => activity.compulsory && !activity.inRevision
      );
    },
  });
export default markSummaryData;
