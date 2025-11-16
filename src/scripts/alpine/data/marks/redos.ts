import type { RedoActivity } from "../../../types";
import type { AlpineStudentMarkStore } from "../../stores/marks";

const redosMarkData = (subject: string) => ({
  student: (Alpine.store("marks") as AlpineStudentMarkStore).student,
  subject: subject,
  get redos() {
    return this.student!.getRedoActivities(this.subject);
  },
  text(activity: RedoActivity) {
    if (activity.comment !== "") {
      return activity.comment;
    } else if (activity.mark >= 6) {
      return "Recuperado";
    } else {
      return "Pendiente";
    }
  },
  name(id: string) {
    let classActivity = this.student!.getActivities(this.subject).find(
      (activity) => parseInt(id) === parseInt(activity.id)
    );
    if (classActivity) {
      return classActivity.name;
    }
    let markedActivity = this.student!.getMarkedActivities(this.subject).find(
      (activity) => parseInt(id) === parseInt(activity.id)
    );
    if (markedActivity) {
      return markedActivity.name;
    }
    return "(No disponible)";
  },
});

export default redosMarkData;
